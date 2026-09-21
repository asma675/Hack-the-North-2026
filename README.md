# AegisMesh

> **Investigate. Challenge. Control.**  
> *A zero-trust control plane for autonomous AI agents.*

🏆 **Winner of Tether's "The Best Sovereign App" Track at Hack the North 2026**

---

## 🌟 Overview

As autonomous AI agents become more capable, giving them unrestricted authority over production systems creates major security and operational risks. What happens when an agent hallucinates, makes a miscalculation, gets compromised, or is tricked by poisoned instructions—yet still holds access to critical infrastructure?

**AegisMesh** solves this problem by separating AI intelligence from production authority. It provides a governance and incident response platform where specialized agents collaborate, challenge hypotheses, and propose remediations—while a strict zero-trust control plane evaluates and governs every action before execution.

> *"AI intelligence can be autonomous. Production authority should still be governed."*

---

## 🏗️ How It Works

AegisMesh enforces a four-layer zero-trust architecture:

1. **Investigate (Multi-Agent Swarm)** — Specialized agents break down an incident into parallel tasks, share findings, challenge assumptions, and coordinate investigation.
2. **Reason (Evidence Court)** — Evaluates competing hypotheses, weighs supporting versus contradictory evidence, analyzes counterfactual outcomes, and determines the safest, least-destructive response.
3. **Govern (Action Firewall / Policy Engine)** — A deny-by-default policy layer checks agent identity, permission scope, trust scores, incident state, and human dual-control approval requirements.
4. **Execute (Signed Capabilities)** — Approved actions generate short-lived, target-specific, HMAC-signed execution tokens verified at the edge before any physical or production system change can take place.

---

## 🔑 Key Features

- **Agent Arena & Passports:** Live multi-agent workspace tracking agent states (*Investigating*, *Challenging*, *Quarantined*) with strict permission boundaries and identity profiles.
- **Evidence Court & Graph:** Visualized hypothesis adjudication showing supporting/contradictory evidence, confidence scores, and counterfactual risk assessments.
- **Deny-by-Default Aegis Gate:** Policy engine that blocks unauthorized or out-of-scope actions and automatically quarantines compromised or degraded agents.
- **Human Dual Control:** Forces mandatory human or hardware verification for high-impact actions.
- **Cryptographic Edge Execution:** Short-lived signed capabilities with built-in replay protection to ensure safe execution on edge devices and infrastructure.
- **Guided Judge & Replay Modes:** Complete interactive workflows showcasing healthy monitoring, false alarm detection, live breaches, agent compromise, and governed containment.

---

## 💼 Cross-Domain Applications

While cybersecurity serves as the core demonstration scenario, AegisMesh's control plane is designed to govern autonomous agents across multiple domains:

* **Cloud & DevOps:** Safe incident mitigation and infrastructure changes.
* **Finance & Procurement:** Multi-agent trade, transfer, or purchase authorization.
* **Robotics & Infrastructure:** Keeping physical hardware execution strictly separated from autonomous reasoning layers.
* **Healthcare Operations:** Workflow coordination without risk of unauthorized permission expansion.
