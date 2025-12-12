# Getting Started with Zero-Touch

This guide will help you set up and run Project Zero-Touch locally.

## Prerequisites

- **Node.js** 18+ 
- **Python** 3.9+
- **PostgreSQL** 14+
- **npm** or **yarn**

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/The-new-ben/crmai.git
cd crmai
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your API keys
```

**Required API keys:**
- `OPENAI_API_KEY` — For AI classification and agent responses
- Database credentials

**Optional (for full functionality):**
- `VAPI_API_KEY` — Voice AI
- `WHATSAPP_ACCESS_TOKEN` — WhatsApp messaging
- `SENDGRID_API_KEY` — Email
- `DOCUSIGN_*` — E-signatures
- `STRIPE_SECRET_KEY` — Payments

### 3. Set Up Database

```bash
# Create PostgreSQL database
createdb zerotouch

# Run schema
psql -d zerotouch -f database/schema.sql
```

### 4. Start the API Server

```bash
cd api
npm install
npm run dev
```

API will be available at `http://localhost:3001`

### 5. Start the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard will be available at `http://localhost:3000`

### 6. (Optional) Set Up Python Agents

```bash
cd agents
pip install -r requirements.txt
```

---

## Testing the System

### Send a Test Lead

```bash
# From the scripts directory
node scripts/send-test-leads.js --random
```

Or use the **+** button in the dashboard to send a test lead through the UI.

### Check the Dashboard

1. Open `http://localhost:3000`
2. You should see the lead appear in the "Incoming" column
3. Watch it progress through the pipeline

---

## Project Structure

```
crmai/
├── api/                 # Node.js backend API
│   ├── src/
│   │   ├── index.js     # Express server
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── providers/   # External service integrations
│   └── package.json
│
├── agents/              # Python AI agents
│   ├── core.py          # Agent classes
│   ├── the_improver.py  # Self-healing optimization
│   └── requirements.txt
│
├── dashboard/           # Next.js frontend
│   ├── app/             # Pages
│   ├── components/      # React components
│   └── lib/             # Utilities
│
├── database/            # PostgreSQL schemas
│   └── schema.sql
│
├── docs/                # Documentation
├── scripts/             # Utility scripts
└── .env.example         # Environment template
```

---

## Configuration

### Switching Providers

Providers can be changed in the `provider_configurations` database table or by updating environment variables.

**Example: Switch from Vapi to Twilio for voice:**

```sql
UPDATE provider_configurations 
SET is_default = FALSE 
WHERE provider_type = 'voice';

UPDATE provider_configurations 
SET is_default = TRUE 
WHERE provider_type = 'voice' AND provider_name = 'twilio';
```

### Adding Custom Personas

Insert into `agent_personas` table:

```sql
INSERT INTO agent_personas (name, code_name, persona_type, system_prompt_en)
VALUES (
  'The Negotiator',
  'negotiator',
  'sales',
  'You are a skilled negotiator who finds win-win solutions...'
);
```

### Language Configuration

Default language is English with Hebrew as secondary. To change:

```bash
# In .env
DEFAULT_LANGUAGE=en
SECONDARY_LANGUAGE=he
```

---

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Make sure PostgreSQL is running:
```bash
# Windows
net start postgresql

# Mac
brew services start postgresql
```

### OpenAI API Error

```
Error: 401 Invalid API Key
```

**Solution:** Check your `OPENAI_API_KEY` in `.env`

### Dashboard Not Loading

```
Error: Module not found
```

**Solution:** Make sure dependencies are installed:
```bash
cd dashboard
npm install
```

---

## Next Steps

1. **Connect Real Providers** — Add your Vapi, WhatsApp, and Stripe credentials
2. **Customize Personas** — Modify agent prompts for your business
3. **Set Up Webhooks** — Configure external services to send data to your API
4. **Deploy** — Use Vercel (dashboard) + Railway/Render (API) + Supabase (database)

---

## Support

- GitHub Issues: [github.com/The-new-ben/crmai/issues](https://github.com/The-new-ben/crmai/issues)
- Documentation: See `/docs` folder
