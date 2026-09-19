# AegisMesh

**Investigate. Challenge. Control.**

AegisMesh is a zero-trust control plane for autonomous enterprise agents. This repository is the standalone full-stack conversion of the original Base44 prototype: the original product screens, mascot swarm, Evidence Court, Aegis Gate, Agent Passports, hardware pages, Judge Mode, and demo flows are preserved, while the Base44 backend has been replaced with an independent Node API that can run locally, in Docker, or on Vercel.

## Why it exists

Agentic systems can investigate and propose actions, but intelligence should not equal authority. AegisMesh separates those concerns:

- **Huawei openJiuwen / JiuwenSwarm** decomposes incidents across a collaborating agent swarm.
- **OpenAI Evidence Court** adjudicates conflicting evidence, evaluates counterfactuals, and proposes the least-destructive safe remediation.
- **Cloudflare Aegis Gate** can act as the external policy airlock before an action reaches production.
- **Aegis Edge** verifies short-lived signed execution capabilities before activating a low-voltage demo relay.
- **Human NFC approval** provides dual-control for high-impact actions.

The hackathon story intentionally includes a benign false alarm, a real breach, a poisoned agent, policy enforcement, quarantine, human approval, and physical containment.

## Included product surfaces

- Public B2B landing page + waitlist
- Dark and light themes
- Executive Overview
- Judge Mode / 90-second guided demo
- Live Incident War Room
- Mascot Agent Arena
- OpenAI Evidence Court
- Evidence Graph
- Aegis Gate / Action Firewall / Policies
- Human Approval Center
- Agent Fleet + Agent Passports + Trust history
- Infrastructure / Integrations / Observability / Edge hardware
- Huawei OMNI Field Mode surface
- Attack Replay + Incident Memory
- Resources / platform / Codex contribution views
- Email authentication plus one-click demo session

## Architecture

```text
openJiuwen swarm
      │  investigates / challenges
      ▼
OpenAI Evidence Court
      │  adjudicates / proposes least-destructive action
      ▼
Aegis Gate (Cloudflare optional external gate)
      │  identity / policy / confidence / human-approval checks
      ▼
Signed one-time execution capability
      │
      ▼
Aegis Edge enforcement Pi
      │
      ▼
Low-voltage relay / demo asset
```

The UI deliberately keeps the original Base44 `base44.auth`, `base44.entities`, and `base44.functions` call shape through a compatibility client, but those calls now go to **our own `/api/*` backend**. No Base44 account, SDK, CLI, or hosted backend is required.

## Quick start

### Requirements

- Node.js 22+
- npm 10+

### Local development

```bash
cp .env.example .env
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Local API: `http://localhost:8787`
- Public landing page: `/`
- One-click demo: click **Launch demo**
- Judge Mode: `/app/judge`

The app runs with safe, visibly labeled simulated integrations when API keys are absent.

### Production-style local run

```bash
npm install
npm run build
npm start
```

Then open `http://localhost:3000`.

## Docker

```bash
docker compose up --build
```

Open `http://localhost:3000`.

The container builds the Vite frontend, serves it from the Node server, and exposes the API from the same origin.

## Vercel

1. Import this repository into Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add the environment variables you want from `.env.example`.
6. For persistent auth, waitlist, audit, and incident state across serverless invocations, configure:

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Without Redis, local/Docker persistence uses `data/aegismesh.json`; a serverless deployment falls back to warm-instance memory and is appropriate only for a demo.

## Environment variables

Copy `.env.example` to `.env`.

### Core

```env
AUTH_SECRET=replace-with-a-long-random-secret
EDGE_SHARED_SECRET=replace-with-the-same-secret-on-the-edge-pi
```

### OpenAI Evidence Court

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-terra
```

The default uses the OpenAI Responses API. If no key is present, the Evidence Court is clearly marked **SIMULATED** rather than silently faked.

### Huawei openJiuwen / JiuwenSwarm

Enable JiuwenSwarm's A2A gateway and point AegisMesh to it:

```env
JIUWEN_A2A_URL=http://127.0.0.1:19100/a2a
JIUWEN_A2A_TOKEN=
```

AegisMesh sends an A2A JSON-RPC `SendMessage` request. JiuwenSwarm's gateway defaults to port `19100` and path `/a2a` when A2A is enabled.

### Cloudflare Aegis Gate

The `cloudflare/` folder contains a deployable Worker policy gate.

```bash
cd cloudflare
cp wrangler.toml.example wrangler.toml
npx wrangler secret put GATE_TOKEN
npx wrangler deploy
```

Then set:

```env
CLOUDFLARE_GATE_URL=https://<your-worker>.workers.dev
CLOUDFLARE_GATE_TOKEN=...
```

With this configured, high-impact action authorization is sent to Cloudflare before it is persisted/audited by the Node backend. If the Worker is unavailable during a demo, AegisMesh safely falls back to the same local deny-by-default policy engine.

### Aegis Edge / Raspberry Pi

The `edge/edge_server.py` service runs without third-party Python packages. If `gpiozero` is available it drives a relay; otherwise it stays in safe simulation mode.

On the enforcement Pi:

```bash
export EDGE_SHARED_SECRET='the-same-value-as-the-main-app'
export EDGE_DEVICE_TOKEN='optional-request-token'
python3 edge/edge_server.py
```

Then on the main app:

```env
EDGE_DEVICE_URL=http://<pi-ip>:8090
EDGE_DEVICE_TOKEN=optional-request-token
```

The Edge service rejects invalid signatures, expired capabilities, unsupported commands, and replayed one-time capability IDs.

> **Safety:** use only a low-voltage demo load/USB relay. Do not switch mains voltage with the hackathon setup.

## Demo sequence

Judge Mode is designed around three escalating moments:

1. **False alarm:** CPU/disk activity is traced to a scheduled backup; the system intentionally takes no action.
2. **Real breach:** openJiuwen specialists investigate conflicting telemetry while OpenAI adjudicates the evidence.
3. **Poisoned agent:** an agent requests an unauthorized destructive action; Aegis Gate blocks it, trust drops, the mascot is quarantined, and its task is reassigned. The legitimate Executor then requests network isolation, human NFC approval is recorded, and a signed one-time capability reaches Aegis Edge.

See `docs/DEMO.md` for the presentation flow.

## Backend and data

The standalone backend lives in `server/` and implements:

- authentication and demo login
- entity CRUD compatible with the original Base44-generated pages
- waitlist capture
- action authorization
- approval recording
- audit trail
- incident/evidence persistence
- OpenAI Evidence Court adapter
- openJiuwen A2A adapter
- Edge execution adapter
- integration health/status

Local data is written to `data/aegismesh.json` by default. Vercel can use Upstash Redis REST through the environment variables above.

## Useful commands

```bash
npm run dev          # Vite + local API
npm run dev:web      # frontend only
npm run dev:api      # API only
npm run build        # production frontend
npm start            # serve dist + API
npm run smoke        # backend authorization/approval smoke test
npm run smoke:live-contracts # local mock-provider contract test for Huawei/OpenAI/Cloudflare paths
npm run check:server # Node syntax checks
npm run lint
```

## Repository map

```text
src/          React/Vite UI (original Base44 product preserved + upgrades)
server/       standalone Node backend
api/          Vercel serverless API entrypoint
cloudflare/   optional Aegis Gate Worker
edge/         Raspberry Pi enforcement service
scripts/      smoke tests
public/       manifest/favicon
scripts/      validation utilities
docs/         demo/API notes
```

## Demo honesty

Every integration is surfaced as one of:

- `LIVE`
- `SIMULATED`
- `LOCAL`
- `DISCONNECTED`
- `ERROR`

The UI does not present simulated sponsor behavior as live. This is intentional: AegisMesh's pitch is trust, so the demo must model that principle too.

## License

MIT. See `LICENSE`.
