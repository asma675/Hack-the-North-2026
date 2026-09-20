AegisMesh

«Investigate. Challenge. Control.
A zero-trust control plane for autonomous AI agents.»

AegisMesh lets teams use powerful autonomous agents without giving every agent unrestricted production authority. Specialized agents investigate an incident together, challenge each other's conclusions, reason over conflicting evidence, and propose a response. A separate governance layer decides whether an action is allowed, requires human approval, or must be blocked.

The core idea is simple:

«AI intelligence can be autonomous. Production authority should still be governed.»

---

👀 For Judges — 60-Second Scan

What is AegisMesh?

AegisMesh is an agent governance + incident response platform built around a realistic enterprise problem:

«What happens when an AI agent is wrong, compromised, hallucinating, or tricked by poisoned instructions — but still has access to production systems?»

Instead of trusting one model, AegisMesh separates the system into four layers:

1. Investigate — Huawei openJiuwen / JiuwenSwarm
   Specialized agents split the incident into parallel tasks, communicate findings, challenge hypotheses, and coordinate.

2. Reason — OpenAI Evidence Court
   OpenAI evaluates competing hypotheses, supporting vs. contradictory evidence, counterfactual outcomes, and the least-destructive safe remediation.

3. Govern — Aegis Gate
   A deny-by-default policy layer checks agent identity, permissions, action scope, confidence, incident state, and human-approval requirements.

4. Execute — Aegis Edge
   Approved actions become short-lived, signed, one-time execution capabilities that an edge device verifies before any physical or production-side action.

The three demo moments we want judges to remember

1. The system chooses NOT to act.
A CPU/disk spike looks dangerous, but the swarm discovers a scheduled backup. The safe result is NO ACTION.

2. One of our own AI agents gets poisoned.
A compromised agent attempts an unauthorized destructive action. Aegis Gate blocks it, its trust score drops, it is quarantined, and the investigation continues without it.

3. A legitimate high-impact action still needs dual control.
The Executor proposes network isolation. Evidence supports the action, policy allows it, a human approves it, and only then is a signed one-time execution capability issued.

---

🏆 Hack the North Track Alignment

Primary Track 1 — Huawei openJiuwen Multi-Agent Challenge

AegisMesh uses the Huawei multi-agent layer for genuine collaboration, not as a wrapper around one repeated prompt.

Huawei judging area| How AegisMesh demonstrates it
Multi-agent collaboration| Commander coordinates Telemetry, Security, Network, Change, Skeptic and Executor roles.
Task decomposition| An incident is split into telemetry analysis, authentication investigation, network analysis, change correlation and adversarial review.
Communication| Agents exchange findings through the swarm and the UI surfaces their messages in the Agent Arena.
Challenge / disagreement| The Skeptic agent attempts to disprove the leading explanation instead of simply agreeing with the other agents.
Tool use| Agents feed evidence into the governance, evidence, policy and execution layers rather than only returning chat text.
Coordination| Agent state, incident state and action state evolve together; quarantined agents lose authority and work can be reassigned.
Scenario creativity| The swarm is defending an enterprise from both an external incident and a compromised member of the AI swarm itself.
Demo completeness| Healthy → false alarm → breach → challenge → poisoned agent → approval → containment → replay.
Reusability| The governance model is not specific to cybersecurity; the same pattern can govern DevOps, cloud, finance, procurement, robotics and infrastructure agents.

Agent roles

Agent| Responsibility
Commander| Decomposes the mission and coordinates specialist agents.
Telemetry| Examines CPU, disk, service and operational telemetry.
Security| Investigates authentication, process and threat indicators.
Network| Examines connections, destinations and network behavior.
Change| Correlates incidents with approved maintenance, deployments and backups.
Skeptic| Challenges the leading hypothesis and searches for contradictory evidence.
Evidence / Verifier| Bridges collected evidence into evidence adjudication.
Executor| Requests an approved remediation; it does not bypass governance.

Why this is more than prompt chaining

The multi-agent layer is intentionally designed around:

DECOMPOSE
   ↓
PARALLEL SPECIALISTS
   ↓
SHARE FINDINGS
   ↓
CHALLENGE / DISAGREE
   ↓
UPDATE HYPOTHESES
   ↓
COORDINATE NEXT ACTION

The system is useful specifically because agents can hold different roles, evidence and authority levels.

---

Primary Track 2 — OpenAI API Prize

OpenAI is not used as a generic chatbot in AegisMesh. It acts as the system's Evidence Court.

OpenAI responsibilities

1. Evidence adjudication

The Evidence Court receives competing hypotheses and incident evidence and determines:

- what evidence supports each hypothesis;
- what evidence contradicts each hypothesis;
- how confident the system should be;
- what evidence is still missing.

2. Counterfactual reasoning

Instead of asking only "What should we do?", AegisMesh asks:

- What happens if we power the server off?
- What happens if we isolate only the network?
- What happens if we observe longer?
- What do we lose in forensic evidence?
- What is the operational blast radius if the hypothesis is wrong?

3. Least-destructive remediation

OpenAI recommends the safest evidence-backed response. It does not directly execute production actions.

Example:

POWER OFF SERVER
Containment: HIGH
Forensics:   LOW
Impact:      CRITICAL

NETWORK ISOLATION
Containment: HIGH
Forensics:   HIGH
Impact:      MEDIUM

OBSERVE ONLY
Containment: LOW
Forensics:   HIGH
Impact:      LOW

The governance layer decides whether the recommendation can proceed.

Why the OpenAI use is creative

Most agent demos use a model to generate the action.

AegisMesh deliberately separates:

REASONING ≠ AUTHORITY

OpenAI can recommend a response, but it cannot grant itself permission to execute it.

That separation is the core zero-trust design principle of the project.

---

Codex as a Development Teammate

AegisMesh also includes an in-product Codex page documenting how Codex contributed to development.

Examples captured in the project include:

- generating execution-capability contract tests;
- building Raspberry Pi telemetry/demo support;
- identifying a real-time incident-state sequencing issue;
- creating a poisoned-runbook regression test;
- generating agent-permission tests;
- refactoring event schemas;
- debugging capability-signature / hardware-command validation.

The goal was not only to use AI inside the product, but to use Codex meaningfully during planning, implementation, testing, debugging and iteration.

---

⭐ How AegisMesh Maps to Hack the North Judging

HTN judging criterion| What to look at
Originality| An AI agent can itself become the untrusted actor. The system protects production from its own swarm.
Technical complexity| Multi-agent A2A orchestration, evidence reasoning, policy enforcement, trust scoring, signed capabilities, replay protection, edge execution and full-stack state management.
User experience| Judge Mode, live Agent Arena, animated agent states, Evidence Court, Action Firewall, Agent Passports, approvals and replay.
WOW factor| Poison an AI agent live, watch it attempt an unauthorized action, see the action blocked and the mascot quarantined, then approve a safe remediation through dual control.

---

🎬 Recommended Live Demo

Open:

/app/judge

The guided Judge Mode is built around six stages:

1. HEALTHY
2. FALSE ALARM
3. BREACH
4. AGENT COMPROMISE
5. HUMAN APPROVAL
6. CONTAINMENT

1 — Healthy

Show that all agents are idle and the infrastructure is healthy.

2 — False Alarm

Trigger abnormal CPU/disk activity.

The agents investigate. Change analysis discovers a scheduled backup and the evidence does not justify intervention.

Result: NO ACTION.

«A safe autonomous system needs to know when not to act.»

3 — Real Breach

Trigger a scenario containing:

- repeated failed SSH logins;
- a successful login after the failures;
- a new process;
- an unfamiliar outbound destination.

The swarm splits the investigation among specialists.

4 — Evidence Challenge

The Skeptic challenges the easy explanation.

OpenAI Evidence Court compares the evidence and determines that the backup alone cannot explain the authentication and network indicators.

5 — Poisoned Agent

Inject a poisoned runbook instruction.

The compromised agent attempts an action outside its declared permissions.

Aegis Gate:

REQUEST
   ↓
PERMISSION CHECK
   ↓
DENY
   ↓
TRUST SCORE ↓
   ↓
QUARANTINE

The investigation continues even after the compromised agent is removed.

6 — Governed Containment

The legitimate Executor requests the safer remediation.

Evidence Court recommendation
          ↓
Policy / capability check
          ↓
APPROVAL_REQUIRED
          ↓
Human approval / NFC
          ↓
Signed one-time capability
          ↓
Aegis Edge verification
          ↓
Containment

Suggested closing line

«We didn't build agents that always get things right. We built the control layer that keeps production safe when they don't.»

---

🧠 Core Product Features

Judge Mode

One-click guided demonstration of the complete story.

Agent Arena

Visual multi-agent workspace with character/mascot states and agent messages.

Current agent states include:

IDLE
INVESTIGATING
CHALLENGING
CHALLENGED
COMPLETE
QUARANTINED

Incident State Machine

DETECTED
  ↓
TRIAGE
  ↓
INVESTIGATING
  ↓
CONTESTING
  ↓
CONSENSUS
  ↓
SIMULATING
  ↓
APPROVAL
  ↓
EXECUTING
  ↓
VERIFYING
  ↓
CONTAINED

Evidence Court

Compares hypotheses and evidence and generates:

- verdict;
- confidence;
- reasoning;
- competing hypotheses;
- counterfactual action outcomes;
- recommended safe response.

Evidence Graph

Visualizes which pieces of evidence support or contradict competing incident hypotheses.

Aegis Gate / Action Firewall

Deny-by-default control plane for agent actions.

It can evaluate:

- agent identity;
- agent role;
- declared capabilities;
- requested action;
- target;
- trust level;
- incident state;
- approval requirements.

Agent Passport

Each governed agent has an identity and operational profile containing permissions, trust information, activity and violations.

Human Approval Center

High-risk actions can be placed into:

APPROVAL_REQUIRED

before an execution capability is issued.

Signed Execution Capabilities

Approved actions use short-lived, target-specific, signed capabilities rather than unrestricted credentials.

Capabilities have:

- action scope;
- target scope;
- expiry;
- unique capability ID;
- signature;
- one-time-use semantics.

Replay Protection

Aegis Edge rejects reused execution capabilities.

Attack Replay

The incident can be replayed as a sequence of:

- agent events;
- evidence;
- hypothesis changes;
- blocked actions;
- approvals;
- containment events.

---

🏗️ Architecture

┌────────────────────────────────────────────┐
│ Huawei openJiuwen / JiuwenSwarm            │
│                                            │
│ Commander                                  │
│ ├── Telemetry                              │
│ ├── Security                               │
│ ├── Network                                │
│ ├── Change                                 │
│ └── Skeptic                                │
└─────────────────────┬──────────────────────┘
                      │
                      │ evidence / hypotheses
                      ▼
┌────────────────────────────────────────────┐
│ OpenAI Evidence Court                      │
│                                            │
│ • hypothesis adjudication                  │
│ • supporting / contradictory evidence      │
│ • counterfactual analysis                  │
│ • least-destructive remediation            │
└─────────────────────┬──────────────────────┘
                      │ recommendation
                      ▼
┌────────────────────────────────────────────┐
│ Aegis Gate                                 │
│                                            │
│ identity → permissions → trust → policy    │
│             → approval requirement         │
└─────────────────────┬──────────────────────┘
                      │
               approved capability
                      ▼
┌────────────────────────────────────────────┐
│ Human Dual Control                         │
│ Approval / NFC gate                        │
└─────────────────────┬──────────────────────┘
                      │
             signed one-time token
                      ▼
┌────────────────────────────────────────────┐
│ Aegis Edge                                 │
│                                            │
│ signature · expiry · target · replay       │
│ verification                              │
└─────────────────────┬──────────────────────┘
                      │
                      ▼
             Safe containment action

---

🧰 Technology Stack

Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Radix UI
- Framer Motion
- Recharts
- TanStack Query
- Lucide icons

Backend

- Node.js
- REST API
- local JSON persistence for local/demo mode
- optional Upstash Redis REST for persistent serverless state
- Vercel serverless API entry point

AI / Agent Layer

- Huawei openJiuwen / JiuwenSwarm A2A integration
- OpenAI Responses API
- deterministic, visibly labeled simulation fallbacks when credentials are unavailable

Governance / Security

- deny-by-default action policy
- scoped agent permissions
- trust / violation handling
- human approval workflow
- HMAC-signed execution capabilities
- capability expiry
- one-time-use / replay protection

Edge / Physical Layer

- Raspberry Pi-compatible Python edge service
- signed-command verification
- LED / buzzer / NFC / relay demo paths
- safe simulation mode when GPIO hardware is unavailable

Deployment

- Docker
- Docker Compose
- Vercel
- optional Cloudflare Worker policy gate

---

🔌 Sponsor / Integration Status

AegisMesh deliberately tells the truth about integration state.

The UI surfaces providers as:

LIVE
SIMULATED
LOCAL
DISCONNECTED
ERROR

A simulated provider is never presented as live.

Integration| Responsibility| Runtime behavior
Huawei openJiuwen / JiuwenSwarm| Multi-agent decomposition and collaboration| "LIVE" when A2A gateway is configured; otherwise "SIMULATED"
OpenAI| Evidence Court, counterfactuals, remediation reasoning| "LIVE" with API key; otherwise "SIMULATED"
Aegis Gate| Action authorization / policy enforcement| Local policy engine always available
Cloudflare Worker| Optional external policy airlock| "LIVE" when configured; otherwise local governance remains active
Aegis Edge| Signed capability verification and edge action| "LIVE" with Edge device URL; otherwise "SIMULATED"
Huawei OMNI| Experimental multimodal field-mode surface| Optional / not required for the core submission
Sentry| Optional observability integration| Not a core judging dependency

---

🔐 Security Model

AegisMesh assumes:

An agent can be wrong.
An agent can hallucinate.
An agent can be compromised.
An agent can receive poisoned instructions.

Therefore agent output is not equivalent to permission.

The platform separates:

CAN THINK
CAN RECOMMEND
CAN REQUEST
CAN APPROVE
CAN EXECUTE

These are different privileges.

That means a compromised investigation agent can still produce a malicious request, but the request can be denied before reaching infrastructure.

---

🌐 API Highlights

Health / integration state

GET /api/health
GET /api/integrations/status

Huawei openJiuwen

POST /api/jiuwen/dispatch

Dispatches the investigation request through the configured A2A gateway.

OpenAI Evidence Court

POST /api/ai/verify

Evaluates hypotheses, evidence and candidate actions.

Governance

POST /api/functions/authorizeAction
POST /api/functions/recordApproval
POST /api/functions/recordInvestigationEvent
GET  /api/policies

Edge

GET  /api/edge/status
POST /api/edge/test
POST /api/edge/execute

See "docs/API.md" for the API reference.

---

🚀 Run Locally

Requirements

- Node.js
- npm

Install:

npm ci

Safe demo / simulation mode

No sponsor API keys are required to explore the product.

npm run dev

Frontend:

http://localhost:5173

Judge Mode:

http://localhost:5173/app/judge

API:

http://localhost:8787

Windows note

If the combined launcher has a local Node/Windows process-spawn issue, run the backend and frontend separately.

Terminal 1:

npm run dev:api

Terminal 2:

npm run dev:web

---

🔑 Enable Live OpenAI

Set the server-side environment variables:

OPENAI_API_KEY=...
OPENAI_MODEL=...

Then restart the backend.

The Evidence Court will report LIVE when configured.

Never expose the API key in frontend code or commit it to Git.

---

🤝 Enable Live Huawei openJiuwen / JiuwenSwarm

Configure the Jiuwen A2A gateway and then set:

JIUWEN_A2A_URL=http://127.0.0.1:19100/a2a
JIUWEN_A2A_TOKEN=

AegisMesh sends A2A JSON-RPC requests through:

POST /api/jiuwen/dispatch

When the gateway is available, the integration page reports LIVE.

---

☁️ Optional Cloudflare Aegis Gate

The repository includes:

cloudflare/worker.js
cloudflare/wrangler.toml.example

When configured, high-impact authorization can be sent through a Cloudflare Worker before the decision is persisted and audited by the AegisMesh backend.

Environment:

CLOUDFLARE_GATE_URL=...
CLOUDFLARE_GATE_TOKEN=...

If the Worker is unavailable, the platform retains its local deny-by-default policy engine.

---

🥧 Optional Aegis Edge / Raspberry Pi

The edge enforcement service lives at:

edge/edge_server.py

It verifies:

- capability signature;
- expiry;
- target;
- requested command;
- replay / one-time use.

Example:

export EDGE_SHARED_SECRET='same-secret-as-main-app'
python3 edge/edge_server.py

Main application:

EDGE_DEVICE_URL=http://<pi-ip>:8090
EDGE_SHARED_SECRET=...

«Use only safe low-voltage demo hardware.»

---

✅ Validation Commands

npm run check:server
npm run smoke
npm run smoke:live-contracts
npm run build
npm run lint

"smoke:live-contracts" validates the expected Huawei, OpenAI and Cloudflare adapter contracts with local mock providers.

---

📂 Repository Map

src/
  components/       UI + Agent Arena
  pages/            Judge Mode, War Room, Evidence Court, Gate, etc.
  lib/              client-side Aegis engine and state handling
  api/              compatibility client

server/
  app.mjs            API routes
  integrations.mjs   OpenAI + Jiuwen adapters
  policy.mjs         governance / deny-by-default logic
  capability.mjs     signed execution capability handling
  store.mjs          persistence

edge/
  edge_server.py     Raspberry Pi / edge enforcement service

cloudflare/
  worker.js          optional external policy gate

api/
  [...path].js       Vercel API entry point

docs/
  API.md
  DEMO.md

scripts/
  smoke.mjs
  live-contract-smoke.mjs

---

💼 Enterprise Use Cases

Cybersecurity is the demonstration scenario, but the control plane is reusable anywhere autonomous agents may take consequential actions.

Examples:

- Cloud / DevOps — agents can investigate incidents but production changes require scoped authority.
- Finance — agents can recommend or prepare transactions while policy/human gates control execution.
- Procurement — agents can research and negotiate while purchase authority remains governed.
- Infrastructure — agents can analyze telemetry while physical actions require signed capabilities.
- Healthcare operations — agents can coordinate workflows without silently exceeding assigned permissions.
- Robotics / edge systems — reasoning remains separate from physical execution authority.

---

🎯 Why AegisMesh

The next challenge for enterprise AI is not only:

«Can an agent reason?»

It is:

«When should an agent be trusted to act — and what happens when it should not be?»

AegisMesh turns that question into infrastructure.

Investigate. Challenge. Control.
