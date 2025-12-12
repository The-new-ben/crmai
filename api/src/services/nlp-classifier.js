// ============================================
// PROJECT ZERO-TOUCH - NLP CLASSIFIER
// AI-powered lead classification
// ============================================

import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

// Lazy initialization - client is created on first use
let openai = null;

function getOpenAI() {
    if (!openai) {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    return openai;
}

/**
 * Classify an incoming lead using GPT-4
 * Extracts: intent, urgency, value, persona, vertical, language
 */
export async function classifyLead(rawData, options = {}) {
    const { preferredLanguage = 'en', detectLanguage = true } = options;

    try {
        // Convert raw data to string for analysis
        const dataString = typeof rawData === 'string'
            ? rawData
            : JSON.stringify(rawData, null, 2);

        const systemPrompt = `You are an expert lead classification AI for a multi-vertical business automation system.
Analyze the incoming data and extract:

1. INTENT: What does this person want? 
   Options: buying, selling, suing, asking, complaining, scheduling, other

2. URGENCY (1-10): How urgent is this? 
   - 1-3: Can wait days/weeks
   - 4-6: Should respond within hours
   - 7-9: Needs immediate attention
   - 10: Critical/emergency

3. ESTIMATED_VALUE: Monetary value in USD (estimate based on context)
   - If unknown, estimate based on vertical (e.g., legal = $5000, real estate = varies)

4. PERSONA: Which AI agent persona should handle this?
   - shark: Aggressive negotiations, legal disputes, tough deals
   - empath: Emotional situations, complaints, sensitive matters
   - concierge: Luxury/VIP service, high-value clients
   - professional: Standard business inquiries

5. VERTICAL: Business category
   Options: law, real_estate, ecommerce, consulting, services, other

6. LANGUAGE: Detected language (en, he, or other ISO code)

7. SCORE (1-100): Lead quality score

8. CONVERSION_PROBABILITY (0.0-1.0): Likelihood of conversion

Respond ONLY with valid JSON, no markdown or explanations.`;

        const userPrompt = `Classify this incoming lead data:

${dataString}

Respond with JSON:
{
  "intent": "...",
  "urgency": 5,
  "estimatedValue": 0,
  "persona": "...",
  "vertical": "...",
  "language": "en",
  "score": 50,
  "conversionProbability": 0.5,
  "summary": "Brief one-line summary",
  "keyPhrases": ["phrase1", "phrase2"]
}`;

        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 500,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content);

        // Validate and normalize
        return {
            intent: validateIntent(result.intent),
            urgency: Math.min(10, Math.max(1, parseInt(result.urgency) || 5)),
            estimatedValue: parseFloat(result.estimatedValue) || 0,
            persona: validatePersona(result.persona),
            vertical: validateVertical(result.vertical),
            language: result.language || preferredLanguage,
            score: Math.min(100, Math.max(1, parseInt(result.score) || 50)),
            conversionProbability: Math.min(1, Math.max(0, parseFloat(result.conversionProbability) || 0.5)),
            summary: result.summary || '',
            keyPhrases: result.keyPhrases || [],
            embeddings: null // Could be added later for vector search
        };

    } catch (error) {
        logger.error('NLP Classification failed', { error: error.message });

        // Return defaults on failure
        return {
            intent: 'other',
            urgency: 5,
            estimatedValue: 0,
            persona: 'professional',
            vertical: 'other',
            language: preferredLanguage,
            score: 30,
            conversionProbability: 0.3,
            summary: 'Classification failed - manual review needed',
            keyPhrases: [],
            embeddings: null
        };
    }
}

/**
 * Classify message sentiment
 */
export async function analyzeSentiment(text, previousSentiment = null) {
    try {
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: `Analyze sentiment of this message. Return JSON:
{
  "sentiment": -1.0 to 1.0 (-1 = very negative, 0 = neutral, 1 = very positive),
  "emotions": {"joy": 0-1, "anger": 0-1, "fear": 0-1, "sadness": 0-1, "surprise": 0-1},
  "objections": ["list of any objections or concerns mentioned"],
  "buyingSignals": ["list of any positive buying signals"]
}`
                },
                { role: 'user', content: text }
            ],
            temperature: 0.2,
            max_tokens: 300,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content);

        return {
            sentiment: Math.min(1, Math.max(-1, parseFloat(result.sentiment) || 0)),
            previousSentiment,
            emotions: result.emotions || {},
            objections: result.objections || [],
            buyingSignals: result.buyingSignals || []
        };

    } catch (error) {
        logger.error('Sentiment analysis failed', { error: error.message });
        return {
            sentiment: 0,
            previousSentiment,
            emotions: {},
            objections: [],
            buyingSignals: []
        };
    }
}

/**
 * Match lead against ontology rules
 */
export async function matchOntologyRules(leadData, rules) {
    const matches = [];

    // Extract text to match against
    const textToMatch = [
        leadData.raw_data?.text,
        leadData.raw_data?.message,
        leadData.raw_data?.body,
        leadData.detected_intent,
        JSON.stringify(leadData.raw_data)
    ].filter(Boolean).join(' ').toLowerCase();

    for (const rule of rules) {
        const keywords = [
            ...(rule.trigger_keywords || []),
            ...(rule.trigger_keywords_en || []),
            ...(rule.trigger_keywords_he || [])
        ];

        let matchScore = 0;
        let matchedKeywords = [];

        for (const keyword of keywords) {
            if (textToMatch.includes(keyword.toLowerCase())) {
                matchScore += 1;
                matchedKeywords.push(keyword);
            }
        }

        if (matchScore > 0) {
            const normalizedScore = matchScore / keywords.length;

            if (normalizedScore >= (rule.match_threshold || 0.7)) {
                matches.push({
                    ruleId: rule.id,
                    ruleName: rule.rule_name,
                    score: normalizedScore,
                    matchedKeywords,
                    targetPersona: rule.target_persona,
                    targetVertical: rule.target_vertical
                });
            }
        }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
}

// ============================================
// VALIDATION HELPERS
// ============================================

function validateIntent(intent) {
    const validIntents = ['buying', 'selling', 'suing', 'asking', 'complaining', 'scheduling', 'other'];
    return validIntents.includes(intent) ? intent : 'other';
}

function validatePersona(persona) {
    const validPersonas = ['shark', 'empath', 'concierge', 'professional', 'closer'];
    return validPersonas.includes(persona) ? persona : 'professional';
}

function validateVertical(vertical) {
    const validVerticals = ['law', 'real_estate', 'ecommerce', 'consulting', 'services', 'other'];
    return validVerticals.includes(vertical) ? vertical : 'other';
}
