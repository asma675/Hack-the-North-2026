# AegisMesh

**Investigate. Challenge. Control.**

AegisMesh is a zero-trust, multi-agent security control plane where specialized AI agents collaborate autonomously to investigate incidents, challenge each other's findings, and converge on actionable verdicts. Runs on **local AI via QVAC** (primary inference, 3-tier fallback) and **P2P via Pear** (peer discovery, OTA updates) — no cloud required. Optional Cloudflare Workers backend for distributed deployments.

---

## What it does

When a security incident occurs, AegisMesh assembles a team of specialist agents who investigate from their own perspectives — telemetry scans, network analysis, security audits, change tracking — then challenge each other's conclusions and synthesize a final verdict with confidence scoring and least-destructive remediation recommendations.

The system handles both **false alarms** (benign activity correctly identified as non-threatening) and **real breaches** (unauthorized access with exfiltration risk), including poisoned agents, policy enforcement, quarantine, human approval gates, and physical containment via Aegis Edge.

---

## Architecture

```
User Goal (Investigate / Monitor / etc.)
        │
        ▼
Autonomous Orchestrator Agent
  (decomposes goals → dispatches tasks → synthesizes)
  Tools: 18 tools including:
  list_agents, query_agent, dispatch_task
  list_skills, find_skills_for_task
  a2a_send, a2a_broadcast, a2a_get_messages
  run_jiuwen (JiuwenSwarm decomposition)
  run_scenario, synthesize_findings
        │
   ┌────┴────┬────────┬────────┐
   ▼         ▼        ▼        ▼
Commander  Security Network  Telemetry
◈ LEAD     🛡 GUARD  🌐 RELAY  📡 SCAN
98 trust   96 trust 95 trust  93 trust
   ┌────────┴────────┐
   ▼                 ▼
Change    Skeptic   Verifier
⚙ SHIFT  🔍 DOUBT  ✓ PROOF
97 trust 99 trust 99 trust
        │
        ▼
Cloudflare Workers Runtime
  • Agent Arena (visual multi-agent coordination)
  • Durable Objects (agent state, A2A messages)
  • Workers KV (state, policies, skills, audit)
  • Workers Queues (async tasks, AI, events)
  • Aegis Gate Worker (policy enforcement)
  • Autonomous Agent (orchestration + reasoning)
        │
   ┌────┴────┬────────┬────────┐
   ▼         ▼        ▼        ▼
OpenAI    Jiuwen   Aegis    Pear/Tether
Evidence  Swarm    Gate     P2P (edge)
Court     A2A      (policy)  (optional)
```

### Product responsibilities

| Provider | Role |
|----------|------|
| **Huawei openJiuwen / JiuwenSwarm** | Multi-agent decomposition and collaboration via A2A gateway |
| **OpenAI** | Evidence Court, counterfactual analysis, least-destructive remediation |
| **Cloudflare Aegis Gate** | Authorization and policy enforcement |
| **Aegis Edge** | Signed-capability verification and low-voltage demo enforcement |
| **Pear/Tether** | P2P runtime for edge deployment — full local AI via QVAC, no cloud needed |
| **Human NFC** | Dual-control for high-impact actions |

---

## Quick start

### Requirements

- Node.js 22+
- npm 10+

### Local development

```bash
cd aegismesh
cp .env.example .env
npm install
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Local API:** `http://localhost:8787`
- **Public landing page:** `/`
- **One-click demo:** click **Launch demo**
- **Judge Mode:** `/app/judge`

All integrations run as **SIMULATED** when API keys are absent — never falsely shown as LIVE.

### Production-style local run

```bash
npm install
npm run build
npm start
```

Then open `http://localhost:3000`.

### Docker

```bash
docker compose up --build
```

### Cloudflare Workers deployment

```bash
cd cloudflare
npx wrangler deploy
```

Set environment secrets via `npx wrangler secret put <NAME>`.

### Pear/Tether — Local AI (primary)

```bash
cd pear-app
npm install
node workers/boot.mjs      # → http://localhost:8000
npm run make:linux-x64     # cross-platform build
```

All AI runs locally via QVAC. No cloud dependency. See `pear-app/DEMO.md` for the hackathon demo flow.

Install on any machine from a Pear key (no internet needed):

```bash
cd pear-app
pear install ./agent-0.1.0.tar.gz
pear run pear://<aegismesh-key>
```

Agents run in sandboxed Bare worklets with P2P Hyperswarm networking and self-updates via Pear OTA. **All AI inference is local via QVAC**.

---

## Agent Fleet

| Agent | Role | Symbol | Trust |
|-------|------|--------|-------|
| `commander-01` | Swarm Commander | ◈ | 98 |
| `security-02` | Security Investigator | ▣ | 96 |
| `network-01` | Network Investigator | ◌ | 95 |
| `telemetry-03` | Telemetry Investigator | ◎ | 93 |
| `change-01` | Change Investigator | △ | 97 |
| `skeptic-01` | Adversarial Reviewer | ✦ | 99 |
| `verifier-01` | Evidence Judge | ⚖ | 99 |
| `executor-01` | Controlled Executor | ⟡ | 99 |

Each agent has distinct permissions, denied actions, tools, and a trust score that dynamically adjusts based on behavior. Unauthorized actions trigger trust decay and potential quarantine.

---

## Cloudflare Runtime (optional)

The Cloudflare Workers runtime provides the following components:

| File | Purpose |
|------|---------|
| `cloudflare/worker-entry.mjs` | Main Worker — all API routes, agent execution, A2A proxy |
| `cloudflare/agent-orchestrator.mjs` | Autonomous agent — decomposes goals, dispatches tasks, synthesizes |
| `cloudflare/agent-tools.mjs` | 18 tools available to the orchestrator |
| `cloudflare/do-agents.mjs` | Agent Durable Objects — state, events, A2A messaging |
| `cloudflare/a2a-protocol.mjs` | A2A Conversation DO — direct agent-to-agent communication |
| `cloudflare/skill-registry.mjs` | Skill definitions stored in KV, discoverable by orchestrator |
| `cloudflare/queue-handlers.mjs` | Queue consumer — AI verify, events, scenarios, A2A, skills |
| `cloudflare/kv-store.mjs` | Dual-platform store (KV for Workers, file/Redis for local) |
| `cloudflare/worker.js` | Aegis Gate Worker — policy enforcement and authorization |
| `cloudflare/wrangler.toml` | Worker config with KV, DO, Queue bindings |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/*` | GET/POST | All existing API routes (auth, entities, functions, AI, edge) |
| `/api/agent/run` | POST | Autonomous agent execution (JSON or SSE stream) |
| `/api/agent/stream` | POST | Server-sent events stream for agent reasoning |
| `/api/a2a/:convId` | POST | Direct agent-to-agent messaging |
| `/api/queue/send` | POST | Enqueue background tasks |
| `/health` | GET | Worker health check |

---

## Demo Sequence

Judge Mode is designed around three escalating moments:

1. **False alarm:** CPU/disk activity traced to a scheduled backup — system takes no action
2. **Real breach:** openJiuwen specialists investigate conflicting telemetry while OpenAI adjudicates evidence
3. **Poisoned agent:** an agent requests unauthorized destructive action — Aegis Gate blocks it, trust drops, mascot quarantined, task reassigned. Legitimate Executor requests network isolation, human NFC approval recorded, signed one-time capability reaches Aegis Edge

See `docs/DEMO.md` for the full presentation flow.

---

## Environment Variables

Copy `.env.example` to `.env`.

### Core

```env
PORT=3000
AUTH_SECRET=replace-with-a-long-random-secret
EDGE_SHARED_SECRET=replace-with-the-same-secret-on-the-edge-pi
```

### OpenAI Evidence Court

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-terra
```

### Huawei openJiuwen / JiuwenSwarm

```env
JIUWEN_A2A_URL=http://127.0.0.1:19100/a2a
JIUWEN_A2A_TOKEN=...
```

### Cloudflare Aegis Gate

```env
CLOUDFLARE_GATE_URL=https://<your-worker>.workers.dev
CLOUDFLARE_GATE_TOKEN=...
```

Also configure Cloudflare Worker bindings in `wrangler.toml`:
- `AEGIS_KV` — KV namespace for state persistence
- `AEGIS_AGENT_DO` — Durable Object for agent state
- `AEGIS_QUEUE` — Queue for async task processing

### Aegis Edge / Raspberry Pi

```env
EDGE_DEVICE_URL=http://<pi-ip>:8090
EDGE_DEVICE_TOKEN=optional-request-token
```

### Pear/Tether (optional)

```env
PEAR_AGENT_ENABLED=true
PEAR_AGENT_URL=https://<pear-app>.pear.link
```

---

## Demo Honesty

Every integration is surfaced as one of:

- `LIVE` — real external service responding
- `SIMULATED` — safe, labeled simulation (default when no API key)
- `LOCAL` — local service on the network
- `DISCONNECTED` — service unavailable
- `ERROR` — service returned an error

Simulated sponsor output is **never** shown as LIVE. Trust and transparency are core to the product.

---

## Useful Commands

```bash
npm run dev          # Vite + local API
npm run dev:web      # frontend only
npm run dev:api      # API only
npm run build        # production frontend
npm start            # serve dist + API
npm run smoke        # backend authorization/approval smoke test
npm run smoke:live-contracts # mock-provider contract test
npm run check:server # Node syntax checks
npm run lint         # ESLint
npm run cf:deploy    # Deploy Cloudflare Worker
npm run cf:dev       # Cloudflare dev mode
npm run cf:tail      # Cloudflare logs
npm run make:*       # Pear build (linux-x64, darwin-arm64, etc.)
```

---

## Repository Map

```text
src/                React/Vite UI (original Base44 product preserved + upgrades)
server/             standalone Node backend (local dev fallback)
  └── store.mjs       Dual-platform store (KV for CF, file/Redis for local)
api/                Vercel serverless API entrypoint
cloudflare/         Cloudflare Workers runtime (optional backend)
  ├── worker-entry.mjs    Main Worker + Agent + A2A endpoints
  ├── agent-orchestrator.mjs  Autonomous agent (7 agents, skills, A2A, Jiuwen)
  ├── agent-tools.mjs     18 agent tools (list, dispatch, A2A, skills, Jiuwen)
  ├── do-agents.mjs       Agent Durable Objects (state, events, A2A)
  ├── a2a-protocol.mjs    A2A messaging DO (send, broadcast, history)
  ├── skill-registry.mjs  21 seed skills + discovery/search/matching
  ├── queue-handlers.mjs  Queue consumer (6 task types)
  ├── kv-store.mjs        Dual-platform store
  ├── worker.js           Aegis Gate Worker
  └── wrangler.toml       Worker config (KV, DO, Queue)
pear-app/           Pear/Tether local AI runtime (PRIMARY for sovereign deploy)
  ├── package.json        Pear + QVAC deps
  ├── workers/
  │   ├── boot.mjs        Entry point
  │   ├── agent-worker.js Agent orchestration worker
  │   ├── agent-thread.mjs Worker thread per agent
  │   └── qvac.js         Local AI inference (QVAC + OpenAI fallback)
  ├── ui/
  │   ├── index.html      Dashboard UI
  │   └── app.js          HTTP server + API
  └── DEMO.md             Hackathon demo flow
edge/               Raspberry Pi enforcement service
  └── edge_server.py      Edge agent server (no Python deps)
data/               Local persistence (data/aegismesh.json)
docs/               Demo flow, API docs
public/             favicon, manifest
scripts/            Smoke tests, validation
```

---

## Built With

- Cloudflare Workers (optional backend)
- Cloudflare Durable Objects (optional)
- Cloudflare Workers KV (optional)
- Cloudflare Workers Queues (optional)
- Pear/Tether (P2P runtime, primary for sovereign deploy)
- Bare Runtime (Pear engine)
- QVAC (local AI inference, no cloud)
- Hyperswarm (P2P networking)
- Hypercore / Hyperbee (distributed storage)
- React + Vite (Frontend)
- Node.js 22+ (Local Dev Fallback)
- OpenAI API (Evidence Court, optional fallback)
- Huawei openJiuwen / JiuwenSwarm A2A (multi-agent orchestration, optional)
- Aegis Edge (Hardware Enforcement)
- Docker / Docker Compose
- Vercel (Frontend Hosting)

---

## License

MIT. See `LICENSE`.
