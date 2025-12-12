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

| Layer | Technology |
|-------|------------|
| **Database** | PostgreSQL + JSONB |
| **Backend API** | Node.js / Python (FastAPI) |
| **AI Agents** | LangChain + CrewAI |
| **Voice AI** | Vapi.ai / Twilio |
| **Messaging** | WhatsApp Business API |
| **Frontend** | Next.js + React |

## 📁 Project Structure

```
crmai/
├── database/           # SQL schemas & migrations
├── api/                # Ingestion engine & webhooks
├── agents/             # Recursive AI agent system
├── dashboard/          # God-view React frontend
├── docs/               # Architecture & documentation
└── scripts/            # Automation & cron jobs
```

## 🌐 Language Support

- **Hebrew (RTL)** — Native primary language
- **English** — Bilingual processing

---

**Created:** December 2025 | **Status:** 🏗️ Architecture Phase
