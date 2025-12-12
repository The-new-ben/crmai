// ============================================
// PROJECT ZERO-TOUCH - UNIVERSAL WEBHOOK RECEIVER
// Accepts ANY payload shape, classifies via AI
// ============================================

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { classifyLead } from '../services/nlp-classifier.js';
import { db } from '../services/database.js';
import { eventBus } from '../services/event-bus.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Universal Ingestion Endpoint
 * POST /api/ingest
 * 
 * Accepts ANY JSON payload from ANY source.
 * Immediately classifies and stores in polymorphic database.
 */
router.post('/ingest', async (req, res) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    try {
        // 1. Capture raw payload (any shape)
        const rawData = req.body;
        const sourceChannel = req.headers['x-source-channel'] || detectChannel(req);
        const sourceIdentifier = req.headers['x-source-id'] || extractIdentifier(rawData);
        const sourceProvider = req.headers['x-source-provider'] || 'unknown';

        logger.info(`[${requestId}] Ingesting from ${sourceChannel}`, {
            source: sourceChannel,
            provider: sourceProvider
        });

        // 2. Validate minimum data
        if (!rawData || Object.keys(rawData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Empty payload',
                requestId
            });
        }

        // 3. NLP Pre-processor Classification (async but awaited)
        const classification = await classifyLead(rawData, {
            preferredLanguage: 'en',
            detectLanguage: true
        });

        logger.info(`[${requestId}] Classification complete`, {
            intent: classification.intent,
            urgency: classification.urgency,
            persona: classification.persona,
            language: classification.language
        });

        // 4. Extract contact info from raw data
        const contactInfo = extractContactInfo(rawData);

        // 5. Store in polymorphic database
        const lead = await db.query(`
      INSERT INTO universal_leads_ledger (
        source_channel,
        source_identifier,
        source_provider,
        raw_data,
        context_vectors,
        contact_name,
        contact_phone,
        contact_email,
        detected_intent,
        detected_urgency,
        estimated_value,
        required_persona,
        business_vertical,
        primary_language,
        lead_score,
        conversion_probability
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id, created_at
    `, [
            sourceChannel,
            sourceIdentifier,
            sourceProvider,
            JSON.stringify(rawData),
            JSON.stringify(classification.embeddings || {}),
            contactInfo.name,
            contactInfo.phone,
            contactInfo.email,
            classification.intent,
            classification.urgency,
            classification.estimatedValue,
            classification.persona,
            classification.vertical,
            classification.language || 'en',
            classification.score || 50,
            classification.conversionProbability || 0.5
        ]);

        const leadId = lead.rows[0].id;

        // 6. Log to audit trail
        await db.query(`
      INSERT INTO audit_log (event_type, event_source, lead_id, event_data, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
            'lead_created',
            'api',
            leadId,
            JSON.stringify({ classification, processingTime: Date.now() - startTime }),
            req.ip,
            req.headers['user-agent']
        ]);

        // 7. Emit event for Chief of Staff Agent (async, don't wait)
        eventBus.emit('lead:new', {
            leadId,
            classification,
            sourceChannel,
            priority: calculatePriority(classification)
        });

        // 8. Return success
        const processingTime = Date.now() - startTime;

        res.status(202).json({
            success: true,
            leadId,
            requestId,
            processingTimeMs: processingTime,
            classification: {
                intent: classification.intent,
                urgency: classification.urgency,
                persona: classification.persona,
                language: classification.language
            }
        });

    } catch (error) {
        logger.error(`[${requestId}] Ingestion failed`, { error: error.message, stack: error.stack });

        res.status(500).json({
            success: false,
            error: 'Ingestion failed',
            requestId,
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Webhook receivers for specific providers
 */

// WhatsApp Business API Webhook
router.post('/webhook/whatsapp', async (req, res) => {
    // WhatsApp verification challenge
    if (req.query['hub.mode'] === 'subscribe') {
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
        if (req.query['hub.verify_token'] === verifyToken) {
            return res.send(req.query['hub.challenge']);
        }
        return res.sendStatus(403);
    }

    // Forward to universal ingest with channel info
    req.headers['x-source-channel'] = 'whatsapp';
    req.headers['x-source-provider'] = 'whatsapp_business';

    // Transform WhatsApp payload
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
        req.body = {
            original_payload: req.body,
            message_id: message.id,
            from: message.from,
            timestamp: message.timestamp,
            type: message.type,
            text: message.text?.body || message.caption || '',
            contact_name: changes?.value?.contacts?.[0]?.profile?.name
        };
        req.headers['x-source-id'] = message.from;
    }

    // Continue to universal ingest
    return router.handle(req, res, () => {
        req.url = '/ingest';
        router.handle(req, res);
    });
});

// Vapi Voice Webhook
router.post('/webhook/vapi', async (req, res) => {
    const event = req.body;

    logger.info('Vapi webhook received', { type: event.type });

    switch (event.type) {
        case 'call-started':
            // Log call start
            break;

        case 'transcript':
            // Real-time transcription
            eventBus.emit('voice:transcript', {
                callId: event.call?.id,
                transcript: event.transcript,
                role: event.role
            });
            break;

        case 'call-ended':
            // Call completed - store full interaction
            req.headers['x-source-channel'] = 'voice';
            req.headers['x-source-provider'] = 'vapi';
            req.headers['x-source-id'] = event.call?.customer?.number;

            req.body = {
                call_id: event.call?.id,
                phone: event.call?.customer?.number,
                duration_seconds: event.call?.duration,
                transcript: event.transcript,
                summary: event.summary,
                recording_url: event.recordingUrl
            };

            // Forward to ingest if it's a new lead
            break;
    }

    res.sendStatus(200);
});

// DocuSign Webhook
router.post('/webhook/docusign', async (req, res) => {
    const event = req.body;

    if (event.event === 'envelope-completed') {
        eventBus.emit('signature:completed', {
            envelopeId: event.data?.envelopeId,
            recipientEmail: event.data?.recipientEmail
        });
    }

    res.sendStatus(200);
});

// Stripe Webhook
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        // Verify webhook signature (in production)
        const event = JSON.parse(req.body);

        switch (event.type) {
            case 'payment_intent.succeeded':
                eventBus.emit('payment:received', {
                    paymentIntentId: event.data.object.id,
                    amount: event.data.object.amount / 100,
                    currency: event.data.object.currency
                });
                break;

            case 'invoice.paid':
                eventBus.emit('invoice:paid', {
                    invoiceId: event.data.object.id,
                    customerId: event.data.object.customer
                });
                break;
        }

        res.sendStatus(200);
    } catch (error) {
        logger.error('Stripe webhook error', { error: error.message });
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function detectChannel(req) {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const contentType = req.headers['content-type'] || '';

    if (userAgent.includes('whatsapp')) return 'whatsapp';
    if (userAgent.includes('twilio')) return 'sms';
    if (req.headers['x-fb-signature']) return 'facebook';
    if (req.headers['x-telegram-bot-api-secret-token']) return 'telegram';

    return 'web';
}

function extractIdentifier(rawData) {
    // Try common patterns
    return rawData.phone
        || rawData.from
        || rawData.email
        || rawData.sender
        || rawData.customer_phone
        || rawData.contact?.phone
        || null;
}

function extractContactInfo(rawData) {
    return {
        name: rawData.name
            || rawData.contact_name
            || rawData.customer_name
            || rawData.contact?.name
            || rawData.sender_name
            || null,
        phone: rawData.phone
            || rawData.from
            || rawData.customer_phone
            || rawData.contact?.phone
            || rawData.mobile
            || null,
        email: rawData.email
            || rawData.customer_email
            || rawData.contact?.email
            || null
    };
}

function calculatePriority(classification) {
    let priority = 5; // Default medium

    // Urgency boosts priority
    if (classification.urgency >= 8) priority += 3;
    else if (classification.urgency >= 5) priority += 1;

    // High value boosts priority
    if (classification.estimatedValue > 50000) priority += 2;
    else if (classification.estimatedValue > 10000) priority += 1;

    // Intent affects priority
    if (classification.intent === 'buying') priority += 1;
    if (classification.intent === 'suing') priority += 2;

    return Math.min(priority, 10);
}

export default router;
