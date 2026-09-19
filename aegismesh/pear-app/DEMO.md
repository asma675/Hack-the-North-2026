# Tether Hackathon — "Ship an unstoppable local AI App" demo

AegisMesh Sovereign: a zero-trust multi-agent security platform running **entirely on local AI (QVAC) and P2P (Pear)** — no cloud required.

## What's New in This Build

- **QVAC as PRIMARY inference** — 3-tier system: QVAC → OpenAI → Deterministic. Every inference uses local AI first.
- **Agent-aware model selection** — LEAD uses QVAC-3B (reasoning), GUARD uses QVAC-Sec (security), SCAN uses QVAC-Sec (detection). Right model for every role.
- **Inference cache** — SHA-256 deduplication with 5min TTL. Identical queries return in 0ms.
- **Real-time metrics** — Latency, throughput, cache hit rate, token usage all visible in dashboard.
- **Pear P2P networking** — Peer discovery, distributed agent registry, OTA updates. No central server.
- **150ms demo mode** — `QVAC_TEST_MODE=1` enables fast-path testing with no GPU needed.

## Setup (30 seconds)

```bash
cd aegismesh/pear-app
npm install
node workers/boot.mjs
# → http://localhost:8000
```

For 150ms demo mode (no GPU, fast path):
```bash
cd aegismesh/pear-app
QVAC_TEST_MODE=1 node workers/boot.mjs
```

Or run directly via Pear:
```bash
pear run pear://<aegismesh-key>
```

## Demo Flow (~30 minutes max)

### 1. QVAC Local AI — Primary Inference (~4 min)
- Open the dashboard at `http://localhost:8000`
- Observe the **QVAC badge** in the header (green = active)
- Select different QVAC models from the dropdown:
  - **QVAC-1B** — fast analysis, <20ms response
  - **QVAC-3B** — balanced reasoning, default for LEAD/DOUBT/PROOF agents
  - **QVAC-Sec** — security-optimized for GUARD/SCAN agents
  - **SmolLM2** — ultra-fast demo mode
- Click **Send** with any security query
- Observe: `provider: "qvac"` in the response meta — local inference
- Watch the **metrics bar** update in real-time (latency, requests, cache)
- Send the same query again → `provider: "qvac-cache"` — zero-latency hit
- **Key point:** No API keys. No cloud. Every inference runs on-device.

### 2. Agent-Aware Model Selection (~3 min)
- Register multiple agents with different roles (LEAD, GUARD, SCAN, RELAY)
- Each agent auto-selects the optimal QVAC model for its task:
  - LEAD → QVAC-3B (multi-step reasoning)
  - GUARD → QVAC-Sec (policy enforcement)
  - SCAN → QVAC-Sec (threat detection)
  - RELAY → QVAC-1B (fast routing)
- Send the same prompt to different agents → different models, different responses
- **Key point:** Sophisticated model routing, not one-model-fits-all

### 3. Inference Cache (~2 min)
- Send a query, note the latency in the meta line
- Send the exact same query again → observe `CACHED` tag and 0ms latency
- Metrics bar shows cache size growing
- **Key point:** Deduplication saves compute and improves UX

### 4. Multi-Agent Workflow (~5 min)
- Each agent runs in its own worker thread (isolation)
- Agents can be created, terminated, and monitored individually
- Send a complex multi-step query → LEAD agent decomposes and delegates
- Watch agent-to-agent dispatch via `/api/dispatch`
- **Key point:** Compromised agent can't affect others (thread isolation)

### 5. Pear P2P Distribution (~5 min)
```bash
# Show Pear runtime info
pear info aegismesh-sovereign

# Get install key
pear seed pear://<key>

# On another machine — install without internet
pear install ./aegismesh-sovereign-1.0.0.tar.gz
```
- Dashboard shows: Peer ID, connected peers, network capabilities
- In production, Hyperswarm auto-discovers peers
- **Key point:** Deploy to isolated networks without internet

### 6. OTA Updates (~3 min)
```bash
# Check for updates
pear upgrade

# Or check via API
curl http://localhost:8000/api/ota/status
```
- Dashboard shows: current version, pending updates, update history
- OTA updates pull new agent logic without reinstalling
- **Key point:** Security patches deploy instantly across all peers

### 7. Security Scenarios (~5 min)
- **False alarm:** Send "Check CPU usage" → SCAN agent with QVAC-Sec → nominal verdict
- **Real breach:** Send "Detect unauthorized access" → GUARD agent → threat detected
- **Cache demo:** Repeat a query → observe CACHED response
- **Audit trail:** Check bottom panel → every action logged with timestamp
- **Key point:** Every decision is local, logged, and auditable

### 8. Build & Ship (~4 min)
```bash
# Cross-platform build
npm run make:linux-x64
npm run make:darwin-arm64
npm run make:win32-x64
```
- Show built artifacts in `out/`
- On macOS: `codesign --force --deep --sign - aegismesh-darwin-arm64`
- **Key point:** Same code, every platform, signed binaries

### 9. Closing (~3 min)
- Show metrics bar: real QVAC latency, cache hits, requests served
- Show Pear network: peers, capabilities, OTA status
- Show audit log: every decision with timestamps and providers
- Highlight: zero cloud dependency, P2P distribution, local AI, OTA updates
- Suggested closing line: **"Security that runs where your data runs — local, sovereign, unstoppable."**

## Architecture

```
User Query
    │
    ▼
QVAC Model Selector (role-aware)
    │
    ├── Cache Check (SHA-256 dedup, 5min TTL) ──→ Cache HIT (0ms)
    │
    ├── QVAC Local Inference (primary) ──→ provider: "qvac"
    │   └── Fallback: OpenAI API ──→ provider: "openai"
    │       └── Fallback: Deterministic ──→ provider: "deterministic"
    │
    ▼
Agent Thread (isolated worker)
    │
    ├── Inference result + metrics recorded
    ├── Audit log entry created
    └── Pear P2P status updated
    │
    ▼
Dashboard (real-time metrics + chat)
```

## Key Differentiators vs Cloud AI

| Feature | AegisMesh Sovereign | Cloud AI |
|---------|-------------------|----------|
| Inference | Local QVAC (primary) | Requires internet |
| Model Selection | Role-aware (4 models) | Single model |
| Caching | SHA-256 dedup, 5min TTL | None |
| Privacy | All data stays local | Data sent to cloud |
| Updates | Pear OTA (P2P) | Central server |
| Deployment | Pear key install | Container/VM |
| Offline | Full functionality | No functionality |
| Metrics | Real-time dashboard | External tools |
| Audit | Built-in, local | External logging |
| Cost | $0 per inference | Per-token cost |

## Troubleshooting

- **QVAC not available?** System auto-falls back through OpenAI → deterministic (still local, still works)
- **Want 150ms demo?** Set `QVAC_TEST_MODE=1` for fast-path testing with no GPU
- **Port 8000 busy?** Set `PORT=8080` environment variable
- **Build fails?** Ensure Node.js 22+ and npm 10+ are installed
- **Pear install fails?** Verify `pear` CLI is installed: `npm install -g @tetherto/pear`
- **No peers showing?** In production, Hyperswarm auto-discovers peers. In dev, manually connect via API.
