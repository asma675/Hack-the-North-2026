# Contributing to AegisMesh

AegisMesh was built for Hack the North as a zero-trust control plane for autonomous agents. Keep integrations modular and preserve the separation between **investigation**, **verification**, **authorization**, and **execution**.

## Local workflow

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npm run dev`.
4. Use `npm run smoke` before committing backend changes.
5. Use `npm run check:server` for a fast syntax validation of serverless/backend entry points.

## Integration rules

- Never expose provider secrets to the browser.
- Never mark simulated provider output as live.
- openJiuwen owns swarm collaboration; OpenAI owns evidence adjudication/counterfactual reasoning; Aegis Gate owns authorization.
- High-impact hardware commands must be short-lived, target-specific, signed, and one-time-use.
- Preserve the deterministic demo fallback so judging can continue during a provider outage.

## Pull requests

Describe the user-visible behavior, the API contract changed, and how you tested both live and simulated modes.
