# AGENTS.md

## Project context

AegisMesh is a standalone full-stack hackathon application. The frontend originated as a Base44 export, but the hosted Base44 runtime has been removed. Do **not** add Base44 CLI, SDK, or hosted-backend dependencies back into the project.

Start with `README.md` and `ARCHITECTURE.md`.

## Architecture boundaries

Keep the separation explicit:

- `src/` — React/Vite presentation and control-plane UI.
- `src/api/base44Client.js` — compatibility facade only. The name is retained so original generated screens do not need a risky rewrite; it now calls our own `/api/*` routes.
- `server/` — standalone Node backend and provider adapters.
- `api/` — Vercel serverless entrypoint.
- `cloudflare/` — optional Aegis Gate Worker.
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
