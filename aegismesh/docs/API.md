# AegisMesh API quick reference

The browser talks only to the AegisMesh backend. Sponsor/provider secrets remain server-side.

## Health and integrations

- `GET /api/health` — backend health and integration summary.
- `GET /api/integrations/status` — LIVE/SIMULATED/LOCAL/DISCONNECTED status for provider and edge adapters.

## Authentication

- `POST /api/auth/demo` — creates a judge/demo session.
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/forgot`
- `POST /api/auth/reset`

## Public landing

- `POST /api/waitlist` — persists an early-access signup.

## Entity compatibility API

The converted Base44 UI uses `/api/entities/:entity` for CRUD so its original entity-driven screens remain functional without the Base44 SDK/runtime.

Supported entities:

- `GovernedAgent`
- `Evidence`
- `ActionRequest`
- `AuditEvent`
- `Incident`
- `Approval`
- `User`

## Agent / model integration

- `POST /api/jiuwen/dispatch` — sends an A2A JSON-RPC `SendMessage` request to the configured JiuwenSwarm gateway.
- `POST /api/ai/verify` — sends competing evidence/hypotheses to the OpenAI Evidence Court adapter.

## Governance

- `POST /api/functions/authorizeAction` — runs local deny-by-default policy and, when configured, the Cloudflare Aegis Gate Worker.
- `POST /api/functions/recordApproval` — records a human decision and may issue a signed execution capability.
- `POST /api/functions/recordInvestigationEvent`
- `POST /api/functions/escalatePendingApprovals`
- `GET /api/policies`

## Edge

- `GET /api/edge/status` — returns live Pi status when configured or an explicitly simulated state.
- `POST /api/edge/test` — performs/simulates an LED, buzzer, NFC, or relay test. Relay actuation is simulation-only unless explicitly enabled on the Pi.
- `POST /api/edge/execute` — forwards an approved signed capability to the configured Aegis Edge Pi.

See `server/app.mjs` for the authoritative route implementation.
