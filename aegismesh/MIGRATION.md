# Base44 → standalone full-stack migration

This repository was converted from the supplied Base44 export while preserving the original AegisMesh product experience.

## Preserved

- Original React/Vite information architecture and product pages
- Mascot Agent Arena and deterministic judge scenarios
- War Room, Evidence Court, Evidence Graph, Attack Replay
- Aegis Gate / Action Firewall / Policy surfaces
- Agent Fleet, Agent Passports, Trust Center
- Infrastructure, Edge, Integrations, Observability, Resources
- Authentication screens and entity-driven UI patterns

## Replaced

The Base44 hosted runtime, SDK dependency, entity backend, functions, and auth runtime were replaced by:

- `server/` Node API
- `api/[...path].js` Vercel serverless entrypoint
- JSON/Redis persistence adapter
- standalone password/demo authentication
- server-side Huawei openJiuwen A2A adapter
- server-side OpenAI Responses API adapter
- optional Cloudflare Worker policy gate
- Raspberry Pi Aegis Edge service

`src/api/base44Client.js` retains the old object name only as a **compatibility facade** so the existing UI did not need a risky wholesale rewrite. It contains no Base44 SDK and sends requests to our own `/api/*` endpoints.

## Added

- Public B2B landing page and persistent waitlist
- hard-edge glow visual system
- light/dark mode
- one-click judge demo authentication
- provider truth badges (`LIVE`, `SIMULATED`, `LOCAL`, `DISCONNECTED`, `ERROR`)
- live-provider contract smoke tests
- signed one-time hardware execution capabilities
- Docker, Vercel, Cloudflare Worker, and Raspberry Pi deployment paths
