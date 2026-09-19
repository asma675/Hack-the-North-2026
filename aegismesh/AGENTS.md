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
- `cloudflare/` — Cloudflare Workers runtime (primary for hackathon deployment). Includes main Worker (worker-entry.mjs), Aegis Gate (worker.js), Autonomous Agent (agent-orchestrator.mjs, agent-tools.mjs), Durable Objects (do-agents.mjs), KV persistence (kv-store.mjs), Queue handlers (queue-handlers.mjs). The orchestrator agent autonomously decomposes goals, dispatches tasks to the agent fleet, monitors progress, and synthesizes findings.
- `edge/` — Raspberry Pi enforcement service.

## Product responsibilities

- Huawei openJiuwen / JiuwenSwarm: multi-agent decomposition and collaboration.
- OpenAI: Evidence Court, counterfactual analysis, least-destructive remediation.
- Aegis Gate: authorization and policy enforcement.
- Aegis Edge: signed-capability verification and low-voltage demo enforcement.

Do not blur those roles merely to add another model call.

## Development rules

- Run `npm run check:server` after backend changes.
- Run `npm run smoke` after API, policy, auth, approval, or capability changes.
- Frontend provider keys must never use `VITE_*` variables.
- Never show simulated sponsor output as `LIVE`.
- Keep Judge Mode deterministic even if a live provider is unavailable.
- High-impact commands must remain target-specific, short-lived, signed, and one-time-use.
- The hardware demo must remain low voltage only.
