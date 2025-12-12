# Project Zero-Touch

> 🚀 **Universal, Self-Adaptive Autonomous Business Ecosystem**

A radical automation platform where the Admin does **zero manual work**. The system observes, learns, and executes autonomously.

## 🧠 Core Philosophy

**"Radical Automation"** — The system handles everything: lead ingestion, intelligent classification, multi-channel outreach (WhatsApp, Email, AI Voice), autonomous negotiation, contract generation, and payment processing.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GOD-VIEW DASHBOARD                          │
│            Incoming → Processing → Negotiating → PAID           │
└─────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────┐
│                    RECURSIVE AI AGENTS                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Chief of    │→│   Hunter    │→│   Closer    │            │
│  │ Staff       │  │   Agent    │  │   Agent    │            │
│  │ (Decision)  │  │ (Outreach) │  │ (Contract) │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└───────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────┐
│                  VACUUM INGESTION ENGINE                       │
│              Universal Webhook + NLP Classifier                │
└───────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────┐
│                POLYMORPHIC DATABASE (PostgreSQL)               │
│  universal_leads_ledger │ dynamic_ontology │ negotiation_logs │
└───────────────────────────────────────────────────────────────┘
```

## 🔧 Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| **Database** | PostgreSQL + JSONB | ✅ Schema ready |
| **Backend API** | Node.js (Express) | ✅ Implemented |
| **AI Agents** | Python (OpenAI GPT-4) | ✅ Implemented |
| **Voice AI** | Vapi.ai (+ Twilio option) | ✅ Modular |
| **Messaging** | WhatsApp Business API | ✅ Modular |
| **Email** | SendGrid (+ Resend option) | ✅ Modular |
| **E-Signature** | DocuSign (+ PandaDoc option) | ✅ Modular |
| **Payments** | Stripe (+ PayPal option) | ✅ Modular |
| **Frontend** | Next.js 15 + React | ✅ Implemented |

## 📁 Project Structure

```
crmai/
├── database/
│   └── schema.sql           # Polymorphic PostgreSQL schema
├── api/
│   ├── src/
│   │   ├── index.js         # Express server
│   │   ├── routes/
│   │   │   └── webhook.js   # Universal webhook receiver
│   │   ├── services/
│   │   │   ├── database.js  # PostgreSQL connection
│   │   │   ├── event-bus.js # Event system
│   │   │   └── nlp-classifier.js # AI classification
│   │   ├── providers/
│   │   │   └── index.js     # Modular provider system
│   │   └── utils/
│   │       └── logger.js    # Winston logger
│   └── package.json
├── agents/
│   ├── core.py              # Recursive AI agents
│   └── the_improver.py      # Self-healing optimization
├── dashboard/
│   ├── app/
│   │   ├── page.tsx         # Main dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── MoneyStream.tsx  # Pipeline visualization
│   │   ├── LeadCard.tsx     # Lead display
│   │   ├── StatsBar.tsx     # Statistics
│   │   └── EmergencyStop.tsx
│   └── lib/
│       └── types.ts
├── docs/
├── scripts/
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

## 🚀 Quick Start

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb zerotouch

# Run schema
psql -d zerotouch -f database/schema.sql
```

### 2. API Server
```bash
cd api
cp ../.env.example .env
# Edit .env with your API keys
npm install
npm run dev
```

### 3. Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### 4. Agents (Python)
```bash
cd agents
pip install openai asyncio
# Agents are triggered via event bus from API
```

## 🔌 Modular Provider System

All external services are **plug-and-play**:

| Service Type | Default Provider | Alternatives |
|--------------|------------------|--------------|
| Voice AI | Vapi.ai | Twilio |
| Messaging | WhatsApp Business | Twilio SMS |
| Email | SendGrid | Resend |
| E-Signature | DocuSign | PandaDoc |
| Payments | Stripe | PayPal |

Switch providers by updating `provider_configurations` table or environment variables.

## 🌐 Language Support

- **English** — Primary language (default)
- **Hebrew (עברית)** — Secondary language with RTL support

## 🤖 Agent Personas

| Persona | Use Case | Style |
|---------|----------|-------|
| 🦈 **Shark** | Legal disputes, tough negotiations | Aggressive, direct |
| 💗 **Empath** | Emotional matters, complaints | Warm, understanding |
| 🎩 **Concierge** | VIP/luxury clients | Sophisticated, attentive |
| 👔 **Professional** | Standard business | Efficient, helpful |
| 🎯 **Closer** | Final deal closing | Urgent, encouraging |

## 📊 God-View Dashboard

The dashboard shows the **Money Stream**:

```
📥 Incoming → 🤖 AI Processing → 💬 Negotiating → 📄 Contract Sent → 💰 PAID
```

Features:
- Real-time lead tracking
- Urgency-based prioritization
- Persona assignment visualization
- Revenue counter
- 🛑 **Emergency Stop** button (only control needed)

## 🔄 Self-Healing System

**The Improver** runs daily:
1. Analyzes lost leads from past 24 hours
2. Identifies failure patterns
3. Generates improved prompts
4. A/B tests new versions automatically

The system gets smarter every day without code changes.

---

**Created:** December 2025 | **Status:** ✅ Core Implementation Complete

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.
