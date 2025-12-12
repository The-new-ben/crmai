# Project Zero-Touch — Architecture Documentation

## Overview

Zero-Touch is a **Universal, Self-Adaptive Autonomous Business Ecosystem** that automates the entire lead-to-payment workflow without human intervention.

## Core Principles

1. **Zero Manual Work** — The admin observes; the system executes
2. **Polymorphic Data** — Accepts any business vertical (law, real estate, e-commerce, etc.)
3. **Recursive Intelligence** — AI agents spawn sub-agents based on context
4. **Self-Healing** — System improves its own prompts daily
5. **Modular Providers** — Swap voice/messaging/payment providers easily

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                                 │
│                    (Next.js + WebSocket)                         │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│    │Incoming │→│ AI Proc │→│Negotiate│→│Contract │→│  PAID   │  │
│    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└──────────────────────────────────────────────────────────────────┘
                               ↑↓ WebSocket
┌──────────────────────────────────────────────────────────────────┐
│                          API LAYER                                │
│                       (Node.js/Express)                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │  Webhook   │ │    NLP     │ │  Provider  │ │   Event    │    │
│  │  Receiver  │ │ Classifier │ │  Manager   │ │    Bus     │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                               ↑↓ Events
┌──────────────────────────────────────────────────────────────────┐
│                        AGENT LAYER                                │
│                         (Python)                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    CHIEF OF STAFF                           │  │
│  │            (Decision Maker - Spawns Sub-Agents)             │  │
│  └────────────────────────────────────────────────────────────┘  │
│       ↓                    ↓                    ↓                 │
│  ┌─────────┐          ┌─────────┐          ┌─────────┐          │
│  │  Shark  │          │ Empath  │          │Concierge│          │
│  │ (Legal) │          │(Support)│          │  (VIP)  │          │
│  └─────────┘          └─────────┘          └─────────┘          │
│       ↓                    ↓                    ↓                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                       CLOSER                                │  │
│  │              (Contract + Payment Finalization)              │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                               ↑↓ Database
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                  │
│                      (PostgreSQL)                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │      Leads      │ │    Ontology     │ │  Negotiations   │    │
│  │    (JSONB)      │ │     Rules       │ │      Logs       │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│  │    Financial    │ │     Agent       │ │    Provider     │    │
│  │     Queue       │ │    Personas     │ │     Config      │    │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Lead Ingestion

```
External Source → Webhook Receiver → NLP Classifier → Database
     ↓
WhatsApp/Email/Voice/Web → Universal Webhook → GPT-4 Analysis → Lead Record
```

### 2. Agent Processing

```
New Lead Event → Chief of Staff → Analyze Lead → Spawn Agent
                                       ↓
                    [Shark | Empath | Concierge | Professional]
                                       ↓
                              Hunter Agent Workflow
                                       ↓
                    WhatsApp → (wait) → Voice Call → Email
                                       ↓
                           Sentiment > 0.8 → Closer
```

### 3. Contract & Payment

```
Closer Agent → Generate Contract → Send DocuSign → Wait for Signature
                                                          ↓
                                        Signed → Generate Invoice → Send
                                                          ↓
                                              Payment Webhook → PAID
```

### 4. Self-Improvement

```
Daily Cron (The Improver)
     ↓
Analyze Lost Leads → Find Patterns → Generate Improved Prompts
     ↓
A/B Test New Prompts → Measure Conversion → Keep Winners
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `universal_leads_ledger` | All leads with JSONB for polymorphic data |
| `dynamic_ontology_map` | AI-learned business rules |
| `autonomous_negotiation_logs` | Every interaction tracked |
| `financial_execution_queue` | Contracts, invoices, payments |
| `agent_personas` | Agent configurations and prompts |
| `provider_configurations` | External service configs |
| `improvement_jobs` | Self-healing job logs |
| `audit_log` | System-wide event tracking |

### Key Design Decisions

1. **JSONB Columns** — Store any payload shape, query with GIN indexes
2. **Generated Columns** — Auto-calculate sentiment shifts, success rates
3. **UUID Primary Keys** — Distributed-friendly IDs
4. **Soft Versioning** — Personas track previous versions for rollback

---

## Provider Architecture

### Abstraction Layer

```javascript
// Get default voice provider
const voice = providerManager.get('voice');

// Get specific provider
const twilio = providerManager.get('voice', 'twilio');

// All providers implement same interface
await voice.createCall(phoneNumber, config);
```

### Supported Providers

| Type | Default | Alternatives |
|------|---------|--------------|
| Voice | Vapi.ai | Twilio |
| Messaging | WhatsApp | Twilio SMS |
| Email | SendGrid | Resend |
| E-Signature | DocuSign | PandaDoc |
| Payment | Stripe | PayPal |

---

## Agent System

### Persona Characteristics

| Persona | Trigger Conditions | Behavior |
|---------|-------------------|----------|
| **Shark** | Legal cases, disputes, aggressive deals | Direct, assertive, no backing down |
| **Empath** | Emotional matters, complaints | Warm, validating, supportive |
| **Concierge** | High-value, luxury clients | Sophisticated, anticipating needs |
| **Professional** | Standard business | Efficient, helpful, clear |
| **Closer** | Sentiment > 0.8 | Urgent, encouraging, finalizing |

### Recursive Spawning

```python
# Chief of Staff decides which agent to spawn
decision = await self.analyze_lead(lead)

# Spawn appropriate sub-agent
agent = self.agent_registry[decision['agent_type']](lead)
result = await agent.execute()

# If successful, spawn closer
if result.sentiment >= 0.8:
    closer = CloserAgent(lead)
    await closer.generate_contract()
```

---

## Real-Time Updates

### WebSocket Events

| Event | Trigger | Data |
|-------|---------|------|
| `lead:new` | Lead ingested | Lead ID, classification |
| `lead:status_changed` | Status update | Lead ID, old/new status |
| `agent:spawned` | Agent created | Agent type, lead ID |
| `message:sent` | Outbound message | Channel, content preview |
| `voice:call_started` | Call initiated | Lead ID, phone |
| `contract:sent` | DocuSign sent | Lead ID, envelope ID |
| `payment:received` | Payment confirmed | Amount, lead ID |

---

## Deployment Considerations

### Environment Variables

See `.env.example` for full list. Key variables:

```
# Database
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# AI
OPENAI_API_KEY

# Providers (configure as needed)
VAPI_API_KEY, WHATSAPP_ACCESS_TOKEN, SENDGRID_API_KEY, etc.
```

### Scaling

- **API Layer**: Horizontal scaling behind load balancer
- **Agent Layer**: Run as separate workers, triggered by events
- **Database**: PostgreSQL with read replicas for dashboard
- **WebSocket**: Sticky sessions or Redis pub/sub for multi-instance

---

## Security Notes

1. **API Keys** — Store in environment, never in code
2. **Webhooks** — Verify signatures (Stripe, WhatsApp)
3. **Database** — Use connection pooling, parameterized queries
4. **CORS** — Restrict to known origins in production
5. **Rate Limiting** — Already configured in API

---

## Future Enhancements

- [ ] Multi-tenant support (separate businesses)
- [ ] AI model fine-tuning per vertical
- [ ] Voice emotion analysis (beyond transcription)
- [ ] Automated A/B test significance calculation
- [ ] Mobile app for admin monitoring
- [ ] Integration with CRM systems (HubSpot, Salesforce)
