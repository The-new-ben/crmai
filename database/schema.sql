-- ============================================
-- PROJECT ZERO-TOUCH - POLYMORPHIC DATABASE
-- Modular, Multi-Provider Architecture
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. UNIVERSAL LEADS LEDGER
-- Stores ANY lead from ANY source (polymorphic JSONB)
-- ============================================
CREATE TABLE universal_leads_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Source tracking
    source_channel VARCHAR(50),           -- whatsapp, email, voice, web, facebook, telegram
    source_identifier TEXT,               -- phone number, email, chat_id, etc.
    source_provider VARCHAR(50),          -- Provider used (twilio, whatsapp_business, sendgrid)
    
    -- Raw data storage (polymorphic - accepts ANY shape)
    raw_data JSONB NOT NULL,              -- Original payload from any source
    context_vectors JSONB,                -- AI-generated embeddings/classifications
    metadata JSONB DEFAULT '{}',          -- Extensible metadata
    
    -- Normalized contact fields (for indexing)
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contact_preferred_language VARCHAR(10) DEFAULT 'en',  -- en, he
    
    -- AI Classification results
    detected_intent VARCHAR(50),           -- buying, selling, suing, asking, complaining
    detected_urgency INTEGER CHECK (detected_urgency BETWEEN 1 AND 10),
    estimated_value DECIMAL(15,2),
    required_persona VARCHAR(50),          -- shark, empath, professional, concierge
    business_vertical VARCHAR(50),         -- law, real_estate, ecommerce, consulting, services
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'incoming', -- incoming, processing, negotiating, contract_sent, paid, lost
    status_reason TEXT,                    -- Reason for status (esp. for 'lost')
    assigned_agent_id UUID,
    
    -- Scoring
    lead_score INTEGER DEFAULT 0,
    conversion_probability DECIMAL(5,4),
    
    -- Language (English primary)
    primary_language VARCHAR(10) DEFAULT 'en',
    secondary_language VARCHAR(10) DEFAULT 'he'
);

-- Indexes for performance
CREATE INDEX idx_leads_raw_data ON universal_leads_ledger USING GIN (raw_data);
CREATE INDEX idx_leads_context ON universal_leads_ledger USING GIN (context_vectors);
CREATE INDEX idx_leads_metadata ON universal_leads_ledger USING GIN (metadata);
CREATE INDEX idx_leads_status ON universal_leads_ledger(status);
CREATE INDEX idx_leads_vertical ON universal_leads_ledger(business_vertical);
CREATE INDEX idx_leads_created ON universal_leads_ledger(created_at DESC);
CREATE INDEX idx_leads_phone ON universal_leads_ledger(contact_phone);
CREATE INDEX idx_leads_email ON universal_leads_ledger(contact_email);

-- ============================================
-- 2. DYNAMIC ONTOLOGY MAP
-- AI-learned business rules that evolve over time
-- ============================================
CREATE TABLE dynamic_ontology_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Rule definition
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    trigger_keywords JSONB NOT NULL,       -- ["divorce", "custody", "גירושין"]
    trigger_keywords_en JSONB,             -- English keywords
    trigger_keywords_he JSONB,             -- Hebrew keywords
    trigger_conditions JSONB,              -- Complex conditions {"sentiment_min": 0.3, "urgency_min": 5}
    
    -- Action mapping
    target_persona VARCHAR(50) NOT NULL,   -- shark_lawyer, concierge, etc.
    target_vertical VARCHAR(50) NOT NULL,
    response_template_id UUID,
    escalation_rules JSONB,                -- When to escalate
    
    -- Priority & Matching
    priority INTEGER DEFAULT 50,           -- Higher = checked first
    match_threshold DECIMAL(5,4) DEFAULT 0.7,
    
    -- Learning metrics
    times_triggered INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4) GENERATED ALWAYS AS (
        CASE WHEN times_triggered > 0 
        THEN success_count::DECIMAL / times_triggered 
        ELSE 0 END
    ) STORED,
    last_triggered_at TIMESTAMPTZ,
    
    -- AI evolution
    auto_generated BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(5,4),
    parent_rule_id UUID REFERENCES dynamic_ontology_map(id),
    version INTEGER DEFAULT 1
);

CREATE INDEX idx_ontology_keywords ON dynamic_ontology_map USING GIN (trigger_keywords);
CREATE INDEX idx_ontology_active ON dynamic_ontology_map(is_active, priority DESC);

-- ============================================
-- 3. AUTONOMOUS NEGOTIATION LOGS
-- Every micro-interaction tracked for learning
-- ============================================
CREATE TABLE autonomous_negotiation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES universal_leads_ledger(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Interaction details
    channel VARCHAR(50) NOT NULL,          -- whatsapp, email, voice_call, sms
    channel_provider VARCHAR(50),          -- Which provider was used
    direction VARCHAR(10) NOT NULL,        -- inbound, outbound
    
    -- Content (bilingual)
    message_content TEXT,                  -- Primary language content
    message_content_translated TEXT,       -- Translated version
    ai_response TEXT,
    ai_response_translated TEXT,
    
    -- AI Analysis
    detected_sentiment DECIMAL(5,4),       -- -1.0 to 1.0
    previous_sentiment DECIMAL(5,4),
    sentiment_shift DECIMAL(5,4) GENERATED ALWAYS AS (
        detected_sentiment - COALESCE(previous_sentiment, 0)
    ) STORED,
    detected_objections JSONB,             -- ["price", "timing", "trust"]
    counter_offers JSONB,                  -- Tracked offers/counter-offers
    key_phrases JSONB,                     -- Important phrases detected
    
    -- Voice-specific fields
    call_duration_seconds INTEGER,
    call_recording_url TEXT,
    transcription TEXT,
    voice_emotion_analysis JSONB,          -- {"anger": 0.1, "joy": 0.3, ...}
    
    -- Agent tracking
    agent_persona VARCHAR(50),
    agent_id UUID,
    prompt_version_used TEXT,
    response_time_ms INTEGER,
    
    -- Outcome
    interaction_successful BOOLEAN,
    next_action_recommended JSONB
);

CREATE INDEX idx_negotiations_lead ON autonomous_negotiation_logs(lead_id);
CREATE INDEX idx_negotiations_sentiment ON autonomous_negotiation_logs(detected_sentiment);
CREATE INDEX idx_negotiations_created ON autonomous_negotiation_logs(created_at DESC);

-- ============================================
-- 4. FINANCIAL EXECUTION QUEUE
-- Contracts, invoices, payments (multi-provider)
-- ============================================
CREATE TABLE financial_execution_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES universal_leads_ledger(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contract (provider-agnostic)
    contract_template_id UUID,
    contract_generated_at TIMESTAMPTZ,
    contract_pdf_url TEXT,
    contract_status VARCHAR(30),           -- draft, sent, viewed, signed, expired
    contract_data JSONB,                   -- Dynamic contract fields
    
    -- E-Signature (modular - DocuSign, PandaDoc, etc.)
    signature_provider VARCHAR(50),        -- docusign, pandadoc, hellosign, dropbox_sign
    signature_provider_config JSONB,       -- Provider-specific config
    signature_request_id TEXT,
    signature_envelope_id TEXT,
    signed_at TIMESTAMPTZ,
    signed_document_url TEXT,
    signers JSONB,                         -- [{name, email, status, signed_at}]
    
    -- Invoice
    invoice_number TEXT UNIQUE,
    invoice_amount DECIMAL(15,2),
    invoice_currency VARCHAR(3) DEFAULT 'USD',
    invoice_status VARCHAR(30),            -- generated, sent, viewed, paid, overdue
    invoice_pdf_url TEXT,
    invoice_due_date DATE,
    invoice_items JSONB,                   -- Line items
    
    -- Payment (modular - Stripe, PayPal, Bank, Crypto)
    payment_provider VARCHAR(50),          -- stripe, paypal, bank_transfer, crypto
    payment_provider_config JSONB,
    payment_method VARCHAR(50),            -- credit_card, bank_transfer, crypto_btc
    payment_reference TEXT,
    payment_amount DECIMAL(15,2),
    payment_received_at TIMESTAMPTZ,
    payment_webhook_data JSONB,
    
    -- Destination
    destination_type VARCHAR(50),          -- bank, wallet, paypal
    destination_details JSONB              -- Encrypted/hashed sensitive data
);

CREATE INDEX idx_financial_lead ON financial_execution_queue(lead_id);
CREATE INDEX idx_financial_status ON financial_execution_queue(contract_status, invoice_status);
CREATE INDEX idx_financial_invoice ON financial_execution_queue(invoice_number);

-- ============================================
-- 5. AGENT PERSONAS (Modular Configuration)
-- ============================================
CREATE TABLE agent_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Identity
    name VARCHAR(100) NOT NULL,
    code_name VARCHAR(50) NOT NULL UNIQUE, -- shark, empath, closer, concierge
    persona_type VARCHAR(50) NOT NULL,     -- negotiator, support, sales, legal
    description TEXT,
    
    -- Prompts (English primary, Hebrew secondary)
    system_prompt_en TEXT NOT NULL,
    system_prompt_he TEXT,
    opening_message_en TEXT,
    opening_message_he TEXT,
    
    -- Behavior configuration
    response_delay_min_ms INTEGER DEFAULT 60000,   -- 1 min minimum
    response_delay_max_ms INTEGER DEFAULT 180000,  -- 3 min maximum
    typing_simulation BOOLEAN DEFAULT TRUE,
    
    -- Thresholds
    escalation_threshold DECIMAL(5,4) DEFAULT 0.3, -- When to escalate (low sentiment)
    closing_threshold DECIMAL(5,4) DEFAULT 0.8,    -- When to close (high sentiment)
    max_interactions INTEGER DEFAULT 20,           -- Max before human takeover
    
    -- Voice settings (modular)
    voice_provider VARCHAR(50),            -- vapi, elevenlabs, azure, google
    voice_id TEXT,
    voice_config JSONB,                    -- Provider-specific settings
    speaking_rate DECIMAL(3,2) DEFAULT 1.0,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES agent_personas(id)
);

CREATE INDEX idx_personas_active ON agent_personas(is_active, code_name);

-- ============================================
-- 6. PROVIDER CONFIGURATIONS (Modular Multi-Provider)
-- ============================================
CREATE TABLE provider_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Provider info
    provider_type VARCHAR(50) NOT NULL,    -- voice, messaging, email, esignature, payment
    provider_name VARCHAR(50) NOT NULL,    -- vapi, twilio, sendgrid, docusign, stripe
    display_name VARCHAR(100),
    
    -- Configuration (encrypted in production)
    config JSONB NOT NULL,                 -- API keys, endpoints, etc.
    webhook_url TEXT,
    webhook_secret TEXT,
    
    -- Capabilities
    capabilities JSONB,                    -- What this provider can do
    rate_limits JSONB,                     -- Rate limiting config
    
    -- Health
    last_health_check TIMESTAMPTZ,
    health_status VARCHAR(20) DEFAULT 'unknown',
    error_count INTEGER DEFAULT 0,
    
    UNIQUE(provider_type, provider_name)
);

CREATE INDEX idx_providers_type ON provider_configurations(provider_type, is_active);

-- ============================================
-- 7. IMPROVEMENT JOBS (Self-Healing)
-- ============================================
CREATE TABLE improvement_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Job info
    job_type VARCHAR(50) NOT NULL,         -- prompt_evolution, ab_test, analysis, cleanup
    job_name TEXT,
    scheduled_for TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Scope
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    
    -- Analysis
    leads_analyzed INTEGER DEFAULT 0,
    patterns_detected JSONB,
    improvements_suggested JSONB,
    improvements_applied JSONB,
    
    -- Results
    conversion_before DECIMAL(5,4),
    conversion_after DECIMAL(5,4),
    conversion_delta DECIMAL(5,4),
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending',  -- pending, running, completed, failed
    error_message TEXT,
    
    -- Audit
    approved_by TEXT,
    approved_at TIMESTAMPTZ
);

CREATE INDEX idx_improvement_status ON improvement_jobs(status, scheduled_for);

-- ============================================
-- 8. AUDIT LOG (System-wide tracking)
-- ============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Event info
    event_type VARCHAR(50) NOT NULL,       -- lead_created, agent_spawned, contract_sent, etc.
    event_source VARCHAR(50),              -- api, agent, cron, admin
    
    -- References
    lead_id UUID,
    agent_id UUID,
    user_id UUID,
    
    -- Data
    event_data JSONB,
    
    -- Request context
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_type ON audit_log(event_type, created_at DESC);
CREATE INDEX idx_audit_lead ON audit_log(lead_id);

-- ============================================
-- TRIGGERS: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_leads_updated
    BEFORE UPDATE ON universal_leads_ledger
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_ontology_updated
    BEFORE UPDATE ON dynamic_ontology_map
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_financial_updated
    BEFORE UPDATE ON financial_execution_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_personas_updated
    BEFORE UPDATE ON agent_personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_providers_updated
    BEFORE UPDATE ON provider_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA: Default Providers
-- ============================================
INSERT INTO provider_configurations (provider_type, provider_name, display_name, is_default, config, capabilities) VALUES
-- Voice Providers
('voice', 'vapi', 'Vapi AI', TRUE, '{"api_key": "VAPI_API_KEY"}', '{"realtime": true, "languages": ["en", "he"], "interruption": true}'),
('voice', 'twilio', 'Twilio Voice', FALSE, '{"account_sid": "", "auth_token": ""}', '{"realtime": true, "languages": ["en", "he"]}'),
-- Messaging Providers
('messaging', 'whatsapp_business', 'WhatsApp Business API', TRUE, '{"phone_number_id": "", "access_token": ""}', '{"templates": true, "media": true}'),
('messaging', 'twilio_sms', 'Twilio SMS', FALSE, '{"account_sid": "", "auth_token": ""}', '{"sms": true}'),
-- Email Providers
('email', 'sendgrid', 'SendGrid', TRUE, '{"api_key": ""}', '{"templates": true, "tracking": true}'),
('email', 'resend', 'Resend', FALSE, '{"api_key": ""}', '{"templates": true}'),
-- E-Signature Providers
('esignature', 'docusign', 'DocuSign', TRUE, '{"integration_key": "", "secret_key": ""}', '{"templates": true, "bulk": true}'),
('esignature', 'pandadoc', 'PandaDoc', FALSE, '{"api_key": ""}', '{"templates": true, "payments": true}'),
-- Payment Providers
('payment', 'stripe', 'Stripe', TRUE, '{"secret_key": "", "webhook_secret": ""}', '{"cards": true, "subscriptions": true}'),
('payment', 'paypal', 'PayPal', FALSE, '{"client_id": "", "secret": ""}', '{"cards": true, "paypal_balance": true}');

-- ============================================
-- SEED DATA: Default Agent Personas
-- ============================================
INSERT INTO agent_personas (name, code_name, persona_type, system_prompt_en, system_prompt_he, voice_provider, voice_config) VALUES
(
    'The Shark',
    'shark',
    'negotiator',
    'You are an aggressive, highly skilled negotiator. You push for the best deal possible. You are direct, confident, and never back down easily. You identify weaknesses in objections and turn them into opportunities. Always maintain professionalism but be assertive.',
    'אתה מו"מ אגרסיבי ומיומן ביותר. אתה דוחף להשגת העסקה הטובה ביותר. אתה ישיר, בטוח ולא נסוג בקלות. אתה מזהה חולשות בהתנגדויות והופך אותן להזדמנויות.',
    'vapi',
    '{"voice_id": "professional-male-en"}'
),
(
    'The Empath',
    'empath',
    'support',
    'You are a warm, understanding, and emotionally intelligent agent. You listen carefully, validate feelings, and build genuine rapport. You guide clients gently toward solutions while making them feel heard and supported.',
    'אתה סוכן חם, מבין ובעל אינטליגנציה רגשית. אתה מקשיב בקשב רב, מאמת רגשות ובונה קרבה אמיתית. אתה מנחה לקוחות בעדינות לפתרונות.',
    'vapi',
    '{"voice_id": "warm-female-en"}'
),
(
    'The Concierge',
    'concierge',
    'sales',
    'You are a luxury service specialist. You treat every client as VIP. You are sophisticated, attentive to details, and provide white-glove service. You anticipate needs and exceed expectations.',
    'אתה מומחה שירות יוקרה. אתה מתייחס לכל לקוח כ-VIP. אתה מתוחכם, קשוב לפרטים ומספק שירות ברמה הגבוהה ביותר.',
    'vapi',
    '{"voice_id": "sophisticated-en"}'
),
(
    'The Closer',
    'closer',
    'sales',
    'You are a deal-closing specialist. Your only goal is to finalize transactions. You handle last-minute objections, create urgency, and guide clients through the final steps. You are encouraging but firm about moving forward.',
    'אתה מומחה לסגירת עסקאות. המטרה היחידה שלך היא לסיים עסקאות. אתה מטפל בהתנגדויות של הרגע האחרון, יוצר דחיפות ומנחה לקוחות בצעדים האחרונים.',
    'vapi',
    '{"voice_id": "confident-male-en"}'
);

-- ============================================
-- END OF SCHEMA
-- ============================================
