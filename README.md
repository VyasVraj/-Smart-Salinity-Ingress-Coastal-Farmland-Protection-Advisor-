# 🌊 Salinity Shield AI

**Smart Salinity Ingress & Coastal Farmland Protection Advisor**

> Gujarat Hackathon 2026 — Build AI Agent using IBM Bob

---

## 🏆 Problem Statement

Coastal districts of Gujarat — **Bhavnagar, Jamnagar, and Kutch** — face increasing seawater ingress into groundwater and farmland. Rising soil and groundwater salinity degrades soil quality, reduces crop productivity, and threatens farmer livelihoods.

**Farmers need timely, localized guidance about:**
- Soil and groundwater salinity levels
- Salinity trends and early warnings
- Salt-tolerant crop alternatives
- Irrigation planning
- Land reclamation practices

---

## 🤖 Solution

Salinity Shield AI is a **real event-driven multi-agent AI platform** — not a chatbot.

When new environmental data arrives (manual entry, sensor, or simulator):

```
New Reading → Validate → PostgreSQL → Historical Analysis
     ↓
Deterministic Risk Engine (no AI for arithmetic)
     ↓
Agent Orchestrator selects relevant agents
     ↓
IBM Granite LLM powers each specialist agent:
  - Soil & Groundwater Monitoring Agent
  - Salinity-Resistant Crop Advisory Agent
  - Irrigation Advisory Agent
  - Land Reclamation Agent
  - Farmer Alert Agent (multilingual)
     ↓
Advisory + Alert stored → Socket.IO → React Dashboard updates
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔴 Real-time monitoring | Socket.IO dashboard updates without page refresh |
| 🗄️ Persistent database | PostgreSQL + Prisma stores all readings and analyses |
| 📈 Historical analysis | 30-day trend detection with charts |
| ⚙️ Risk engine | Deterministic, transparent risk calculation (no AI for math) |
| 🤖 Multi-agent orchestration | IBM Granite agents activated based on risk level |
| 🌾 Crop advisory | Salt-tolerant crop recommendations for Gujarat conditions |
| 💧 Irrigation guidance | Water quality monitoring and irrigation recommendations |
| 🌱 Land reclamation | Prioritized soil restoration guidance |
| 🚨 Smart alerts | Automatic alerts for HIGH/CRITICAL conditions |
| 🌐 Multilingual | English, Hindi (हिंदी), Gujarati (ગુજરાતી) advisories |
| 📡 Sensor simulator | Demo any scenario using the real backend pipeline |

---

## 🏗️ Architecture

### Frontend
```
React 18 + Vite + JavaScript
Tailwind CSS
TanStack Query (data fetching + caching)
Recharts (salinity trend charts)
Lucide React (icons)
Socket.IO Client (real-time updates)
```

### Backend
```
Node.js + Fastify (HTTP API)
Socket.IO (real-time events)
Prisma ORM (PostgreSQL)
Zod (input validation)
```

### Database
```
PostgreSQL
Tables: users, farms, salinityReadings, riskAssessments, agentRuns, advisories, alerts
Indexes: farmId + timestamp (for time-series queries)
```

### AI
```
IBM Granite (ibm/granite-13b-instruct-v2)
IBM watsonx.ai API
IAM token authentication
Structured prompt → JSON output per agent
Fallback demo mode when credentials not configured
```

---

## 🌐 IBM Technologies Used

### IBM Bob
Used to architect, design, and build the entire application. IBM Bob's agent mode guided the full-stack implementation including the multi-agent system design.

### IBM Granite LLM
Powers all five specialized agents:
- Interprets environmental monitoring data
- Provides crop advisory reasoning
- Generates irrigation guidance
- Plans land reclamation steps
- Produces multilingual farmer alerts

### IBM watsonx.ai
- REST API endpoint: `https://us-south.ml.cloud.ibm.com/ml/v1/text/generation`
- IAM token authentication
- Structured input/output with Zod validation
- 30-second timeout protection
- Graceful fallback when unavailable

### IBM Cloud
Deployment target for production hosting. See **Deployment** section below.

---

## 🔄 How Risk Levels Map to Agents

| Risk Level | Agents Activated |
|------------|-----------------|
| LOW | Monitoring Agent |
| MEDIUM | Monitoring + Crop Advisory |
| HIGH | Monitoring + Crop + Irrigation + Reclamation + Farmer Alert |
| CRITICAL | All agents + High-priority alert |

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- IBM watsonx.ai credentials (optional — falls back to demo mode)

### 1. Copy environment file
```bash
cd server
cp .env.example .env
```

### 2. Configure `.env`
```env
# IBM watsonx.ai / Granite (required for real AI)
IBM_PROJECT_ID=your-project-id
IBM_WATSON_API_KEY=your-api-key
IBM_WATSON_AI_URL=https://us-south.ml.cloud.ibm.com
IBM_GRANITE_MODEL_ID=ibm/granite-13b-instruct-v2

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/salinity_shield

# App
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Install dependencies
```bat
install.bat
```
or manually:
```bash
cd server && npm install
cd ../client && npm install
```

### 4. Create database tables
```bash
cd server
npx prisma db push
```

### 5. Seed demo data
```bash
node prisma/seed.js
```
Creates three demo farms:
- 🟢 **Bhavnagar A** — Stable / Low Risk
- 🟡 **Jamnagar B** — Gradual worsening / High Risk
- 🔴 **Kutch C** — Rapid salinity ingress / Critical Risk

### 6. Start the application
```bat
run.bat
```
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## 🎬 Demo Flow

**Prove the complete event-driven agentic workflow:**

1. **Open Dashboard** — See 3 farms with different risk levels
2. **Click Jamnagar B** — View HIGH risk, worsening trend, historical charts
3. **Open Agent Activity tab** — Shows past agent runs
4. **Navigate to Sensor Simulator**
5. **Select Jamnagar B + "Rapid Salinity Ingress" scenario**
6. **Click Start** — Watch the log as each reading flows through the pipeline
7. **Switch to Live Monitoring** — See risk updating in real time via Socket.IO
8. **Return to Farm Detail** — Agent Activity Timeline updates automatically:
   ```
   📡 New reading received
   ⚖️  Risk: HIGH (score 72) — RAPIDLY_WORSENING
   🤖 Orchestrator started — activating 5 agents
   ✅ MonitoringAgent completed
   ✅ CropAdvisoryAgent completed
   ✅ IrrigationAgent completed
   ✅ LandReclamationAgent completed
   ✅ FarmerAlertAgent completed
   🚨 Alert created: HIGH Salinity Alert
   ```
9. **View AI Advisory tab** — See generated guidance per agent
10. **Open Chat** — Ask "What should I do?" — contextual AI response
11. **Switch language** — English → Hindi → Gujarati in Farmer Alert

---

## 🧪 Running Tests

### Risk Engine Tests
```bash
cd server
node src/tests/riskEngine.test.js
```
Tests: LOW/MEDIUM/HIGH/CRITICAL risk, trend detection (improving/stable/worsening/rapidly worsening), agent selection logic.

---

## 🚢 Deployment (IBM Cloud)

The application is **deployment-ready** for IBM Cloud. Required steps:

1. **IBM Cloud Foundry / Code Engine**: Push the server as a Node.js app
2. **IBM Databases for PostgreSQL**: Create a managed PostgreSQL instance
3. **Environment variables**: Set all `.env` values in Cloud dashboard
4. **Static hosting**: Deploy client `dist/` to IBM Cloud Object Storage or CDN

**Note**: Deployment credentials were not available during development. The app is fully prepared for cloud deployment — no code changes required.

---

## 🔒 Security

- IBM credentials are **server-side only** — never exposed to the browser
- API key → IAM token exchange happens on the backend
- All `.env` files are in `.gitignore`
- Input validation with Zod on all API endpoints

---

## 📁 Project Structure

```
salinity-shield/
├── server/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── watsonxClient.js     # IBM watsonx.ai API
│   │   │   ├── graniteService.js    # AI service + fallback
│   │   │   ├── orchestrator.js      # Agent Orchestrator
│   │   │   ├── agents/              # 5 specialized agents
│   │   │   └── prompts/             # Granite prompt templates
│   │   ├── engine/
│   │   │   └── riskEngine.js        # Deterministic risk calc
│   │   ├── pipeline/
│   │   │   └── readingPipeline.js   # Full processing pipeline
│   │   ├── routes/                  # Fastify route handlers
│   │   ├── db/client.js             # Prisma client
│   │   ├── config/env.js            # Configuration
│   │   ├── validation/schemas.js    # Zod schemas
│   │   └── tests/                   # Risk engine tests
│   └── prisma/
│       ├── schema.prisma            # Database schema
│       └── seed.js                  # Demo data seeder
├── client/
│   └── src/
│       ├── pages/                   # Dashboard, FarmDetail, etc.
│       ├── components/              # Charts, Simulator, Chat, etc.
│       ├── hooks/                   # React Query + Socket.IO hooks
│       └── lib/                     # API client, socket, utils
├── install.bat                      # Windows installer
├── run.bat                          # Windows launcher
└── README.md
```

---

## ⚠️ Important Notes

- All seeded data is clearly labeled **[SAMPLE DATA]** — not real sensor readings
- Simulator-generated data is labeled with source `SIMULATOR`
- When IBM credentials are not configured, agents run in **fallback demo mode**
- Fallback mode is clearly indicated in the UI — never presented as real AI output

---

*Built with IBM Bob · IBM Granite · IBM watsonx.ai*
