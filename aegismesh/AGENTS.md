# AGENTS.md

## Project context

AegisMesh is a standalone full-stack hackathon application. The frontend originated as a Base44 export, but the hosted Base44 runtime has been removed. Do **not** add Base44 CLI, SDK, or hosted-backend dependencies back into the project.

Start with `README.md` and `ARCHITECTURE.md`.

## Architecture boundaries

Keep the separation explicit:

- `src/` — React/Vite presentation and control-plane UI.
- `src/api/base44Client.js` — compatibility facade only. The name is retained so original generated screens do not need a risky rewrite; it now calls our own `/api/*` routes.
- `server/` — Node backend (local dev fallback; uses server/store.mjs which auto-detects CF Workers env via setCFEnv).
- `api/` — Vercel serverless entrypoint.
- `cloudflare/` — Cloudflare Workers runtime (optional backend). Includes main Worker, Aegis Gate, Agent DO, A2A, KV, Queues. Also hosts Browserbase integration (agent-tools.mjs: browserbase_search_intel, browserbase_verify_web_target) for external threat intel verification.
- `pear-app/` — **Pear/Tether local AI runtime (PRIMARY for sovereign deploy)**. QVAC local inference via `workers/qvac.js`, agent orchestration via `workers/agent-worker.js`, Bare worker threads via `workers/agent-thread.mjs`, HTTP server via `ui/app.js`, dashboard via `ui/index.html`. All agents run locally with no cloud dependency. See `pear-app/DEMO.md` for hackathon demo flow.
- `scripts/` — Smoke tests, Browserbase investigation demo, validation scripts
- `edge/` — Raspberry Pi enforcement service.

## Product responsibilities

- **Pear/QVAC (primary):** Local AI inference on-device. No cloud required. P2P distribution via Pear keys, OTA updates via Pear runtime, P2P networking via Hyperswarm.
- **Huawei openJiuwen / JiuwenSwarm:** Multi-agent decomposition and collaboration (optional cloud fallback).
- **OpenAI:** Evidence Court, counterfactual analysis, least-destructive remediation (optional fallback only).
- **Cloudflare Aegis Gate:** Authorization and policy enforcement (optional).
- **Aegis Edge:** Signed-capability verification and low-voltage demo enforcement.

Do not blur those roles merely to add another model call.

## Development rules

- Run `npm run check:server` after backend changes.
- Run `npm run smoke` after API, policy, auth, approval, or capability changes.
- For Pear/QVAC changes: test in standalone mode first (no Cloudflare deps), then verify Cloudflare compatibility.
- Frontend provider keys must never use `VITE_*` variables.
- Never show simulated sponsor output as `LIVE`.
- Keep Judge Mode deterministic even if a live provider is unavailable.
- High-impact commands must remain target-specific, short-lived, signed, and one-time-use.
- The hardware demo must remain low voltage only.
- QVAC local inference must always have a deterministic fallback — never show "no provider" as an error.
- QVAC uses role-aware model selection: LEAD→QVAC-3B, GUARD→QVAC-Sec, SCAN→QVAC-Sec, RELAY→QVAC-1B.
- Pear integration must support both `pear run` (live) and `QVAC_TEST_MODE=1` (offline demo).
- Browserbase is cloud-only: set `BROWSERBASE_API_KEY` for external threat intel verification. No API key = LOCAL-ONLY mode.
- Browserbase tools (`browserbase_search_intel`, `browserbase_verify_web_target`) are in `cloudflare/agent-tools.mjs`, wired into `cloudflare/agent-orchestrator.mjs`.
