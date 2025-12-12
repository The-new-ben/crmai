// ============================================
// PROJECT ZERO-TOUCH - LEADS API ROUTES
// Additional endpoints for lead management
// ============================================

import express from 'express';
import { db, leadsDb, negotiationsDb } from '../services/database.js';
import { eventBus, Events } from '../services/event-bus.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Get a single lead by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await leadsDb.getById(id);

        if (!lead) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }

        res.json({ success: true, data: lead });
    } catch (error) {
        logger.error('Error fetching lead', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch lead' });
    }
});

/**
 * Get negotiation history for a lead
 */
router.get('/:id/negotiations', async (req, res) => {
    try {
        const { id } = req.params;
        const negotiations = await negotiationsDb.getByLeadId(id);

        res.json({ success: true, data: negotiations });
    } catch (error) {
        logger.error('Error fetching negotiations', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to fetch negotiations' });
    }
});

/**
 * Update lead status
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const validStatuses = ['incoming', 'processing', 'negotiating', 'contract_sent', 'paid', 'lost'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const result = await leadsDb.updateStatus(id, status, reason);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }

        // Emit event
        eventBus.emit(Events.LEAD_STATUS_CHANGED, {
            leadId: id,
            status,
            reason
        });

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        logger.error('Error updating lead status', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
});

/**
 * Assign agent to lead
 */
router.patch('/:id/assign', async (req, res) => {
    try {
        const { id } = req.params;
        const { agentId, persona } = req.body;

        const result = await db.query(`
      UPDATE universal_leads_ledger 
      SET assigned_agent_id = $2, required_persona = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id, agentId, persona]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }

        eventBus.emit(Events.LEAD_ASSIGNED, {
            leadId: id,
            agentId,
            persona
        });

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        logger.error('Error assigning agent', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to assign agent' });
    }
});

/**
 * Trigger manual action on lead
 */
router.post('/:id/action', async (req, res) => {
    try {
        const { id } = req.params;
        const { action, data } = req.body;

        const validActions = ['send_whatsapp', 'send_email', 'trigger_call', 'generate_contract', 'change_persona', 'pause'];
        if (!validActions.includes(action)) {
            return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        // Log the action
        await db.query(`
      INSERT INTO audit_log (event_type, event_source, lead_id, event_data)
      VALUES ($1, $2, $3, $4)
    `, [`manual_${action}`, 'dashboard', id, JSON.stringify(data || {})]);

        // In production, this would trigger the actual action
        // For now, just emit an event
        eventBus.emit(`manual:${action}`, { leadId: id, data });

        res.json({ success: true, message: `Action ${action} triggered` });
    } catch (error) {
        logger.error('Error triggering action', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to trigger action' });
    }
});

/**
 * Search leads
 */
router.get('/', async (req, res) => {
    try {
        const {
            status,
            vertical,
            persona,
            language,
            minUrgency,
            search,
            limit = 50,
            offset = 0
        } = req.query;

        let query = 'SELECT * FROM universal_leads_ledger WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        if (vertical) {
            query += ` AND business_vertical = $${paramIndex++}`;
            params.push(vertical);
        }

        if (persona) {
            query += ` AND required_persona = $${paramIndex++}`;
            params.push(persona);
        }

        if (language) {
            query += ` AND primary_language = $${paramIndex++}`;
            params.push(language);
        }

        if (minUrgency) {
            query += ` AND detected_urgency >= $${paramIndex++}`;
            params.push(parseInt(minUrgency));
        }

        if (search) {
            query += ` AND (contact_name ILIKE $${paramIndex} OR contact_phone ILIKE $${paramIndex} OR contact_email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: result.rows.length
            }
        });
    } catch (error) {
        logger.error('Error searching leads', { error: error.message });
        res.status(500).json({ success: false, error: 'Failed to search leads' });
    }
});

export default router;
