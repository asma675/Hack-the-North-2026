// Vanguard Sovereign — QVAC local AI inference engine.
// PRIMARY inference provider. No cloud required.
// Three-tier system: QVAC → OpenAI → Deterministic fallback.
// Designed for 150ms test mode (no GPU, fast path).
import { createHash } from 'bare:crypto';

// ── QVAC Model Catalog ─────────────────────────────────────────────
// Each model optimized for specific agent tasks.
export const MODELS = {
  'qvac-1b': {
    name: 'QVAC-1B',
    purpose: 'Fast security analysis, log parsing, classification',
    speed: 'fast',      // <50ms local
    tokens: 1024,
    precision: 'standard',
  },
  'qvac-3b': {
    name: 'QVAC-3B',
    purpose: 'Threat assessment, agent coordination, multi-step reasoning',
    speed: 'medium',    // 50-200ms local
    tokens: 2048,
    precision: 'high',
  },
  'qvac-sec': {
    name: 'QVAC-Sec',
    purpose: 'Security-specific: malware analysis, exploit detection, policy enforcement',
    speed: 'medium',
    tokens: 4096,
    precision: 'maximum',
  },
  'smollm2-360m': {
    name: 'SmolLM2-360M',
    purpose: 'Ultra-fast demo mode, testing, low-resource environments',
    speed: 'fast',
    tokens: 512,
    precision: 'standard',
  },
};

// Default model for each agent role
export const ROLE_MODELS = {
  LEAD: 'qvac-3b',
  GUARD: 'qvac-sec',
  RELAY: 'qvac-1b',
  SCAN: 'qvac-sec',
  SHIFT: 'qvac-1b',
  DOUBT: 'qvac-3b',
  PROOF: 'qvac-3b',
  ACT: 'qvac-1b',
};

// ── Inference Cache ──────────────────────────────────────────────────
// SHA-256 hash of (prompt + model + system) → result
// Eliminates redundant inference for repeated queries.
class InferenceCache {
  constructor(maxSize = 256) {
    this.maxSize = maxSize;
    this.store = new Map();
  }

  key(prompt, model, system, user) {
    const payload = JSON.stringify({ prompt, model, system, user });
    return createHash('sha-256').update(payload).digest('hex');
  }

  get(prompt, model, system, user) {
    const k = this.key(prompt, model, system, user);
    const entry = this.store.get(k);
    if (entry && Date.now() - entry.ts < 300000) { // 5min TTL
      return entry.result;
    }
    if (entry) this.store.delete(k); // expired
    return null;
  }

  set(prompt, model, system, user, result) {
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
    this.store.set(this.key(prompt, model, system, user), { result, ts: Date.now() });
  }

  get size() { return this.store.size; }
}

// ── Metrics ──────────────────────────────────────────────────────────
class Metrics {
  constructor() {
    this.requests = 0;
    this.byProvider = {};
    this.latencies = []; // last 1000
    this.totalTokens = 0;
  }

  record(provider, model, latencyMs, tokens) {
    this.requests++;
    this.byProvider[provider] = (this.byProvider[provider] || 0) + 1;
    this.latencies.push(latencyMs);
    if (this.latencies.length > 1000) this.latencies.shift();
    this.totalTokens += tokens;
  }

  avgLatency() {
    if (!this.latencies.length) return 0;
    return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  summary() {
    return {
      totalRequests: this.requests,
      byProvider: { ...this.byProvider },
      avgLatencyMs: Math.round(this.avgLatency() * 100) / 100,
      totalTokens: this.totalTokens,
      cacheSize: cache.size,
    };
  }
}

const cache = new InferenceCache();
const metrics = new Metrics();

export { cache, metrics };

// ── Test Mode (150ms, no GPU) ────────────────────────────────────────
// Returns deterministic, context-aware response in <5ms for testing.
function testMode(prompt, model, system) {
  const words = prompt.split(/\s+/).filter(Boolean).slice(0, 30);
  const hash = createHash('sha-256').update(prompt).digest('hex');
  const threatWords = ['malware', 'exploit', 'breach', 'attack', 'phishing', 'ransomware', 'exfiltrate', 'unauthorized', 'rootkit', 'trojan'];
  const isThreat = threatWords.some(w => prompt.toLowerCase().includes(w));
  const confidence = isThreat ? '87-94%' : '91-99%';
  const modelInfo = MODELS[model] || MODELS['qvac-1b'];

  let reasoning = 'Pattern analysis complete';
  if (isThreat) {
    reasoning = `Threat vector identified in prompt tokens: ${words.join(', ')}. Anomaly score: 0.${hash.slice(0, 2)}`;
  } else {
    reasoning = `Analyzed ${words.length} signal streams. Confidence: ${confidence}`;
  }

  return {
    provider: 'qvac',
    model: modelInfo.name,
    text: `${reasoning} | ${system?.slice(0, 60) || 'Security analysis'} | verdict: NO_ACTION (confidence ${confidence})`,
    usage: { promptTokens: words.length, completionTokens: 40 },
    latencyMs: Math.round(Math.random() * 12 + 5), // 5-17ms simulated
    testMode: true,
  };
}

// ── QVAC Inference (Primary) ─────────────────────────────────────────
export async function infer(prompt, options = {}) {
  const {
    model = 'qvac-1b',
    system,
    user,
    maxTokens = 1024,
    temperature = 0.3,
    forceTestMode = false,
  } = options;

  const modelInfo = MODELS[model] || MODELS['qvac-1b'];
  const startTime = Date.now();

  // 1. Check cache first
  const cached = cache.get(prompt, model, system, user);
  if (cached) {
    metrics.record('qvac-cache', model, 0, cached.usage?.completionTokens || 0);
    return { ...cached, fromCache: true };
  }

  // 2. Test mode (150ms demo, no GPU required)
  if (forceTestMode || process.env.QVAC_TEST_MODE === '1') {
    const result = testMode(prompt, model, system);
    cache.set(prompt, model, system, user, result);
    metrics.record('qvac-test', model, result.latencyMs, result.usage.completionTokens);
    return result;
  }

  // 3. Primary: QVAC local inference
  try {
    const { runQvac } = await import('@tetherto/qvac');
    const qvacResponse = await runQvac({
      model,
      system,
      user,
      maxTokens,
      temperature,
    });
    const latency = Date.now() - startTime;
    const result = {
      provider: 'qvac',
      model: modelInfo.name,
      text: qvacResponse.text,
      usage: qvacResponse.usage,
      latencyMs: latency,
      testMode: false,
    };
    cache.set(prompt, model, system, user, result);
    metrics.record('qvac', model, latency, result.usage?.completionTokens || 0);
    return result;
  } catch (e) {
    console.warn(`[QVAC ${modelInfo.name}] Unavailable:`, e.message);
  }

  // 4. Fallback: OpenAI-compatible API
  const openaiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  try {
    const response = await fetch(`${openaiBase}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.OPENAI_API_KEY ? { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
        input: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...(user ? [{ role: 'user', content: user }] : []),
        ],
        max_output_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(Number(process.env.OPENAI_TIMEOUT_MS || 20000)),
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const data = await response.json();
    const text = data.output?.text || data.output?.map?.(c => c.text || '').join('\n') || '';
    const latency = Date.now() - startTime;
    const result = {
      provider: 'openai',
      model: data.model || process.env.OPENAI_MODEL,
      text,
      usage: data.usage,
      latencyMs: latency,
      testMode: false,
    };
    cache.set(prompt, model, system, user, result);
    metrics.record('openai', model, latency, result.usage?.completionTokens || 0);
    return result;
  } catch (e) {
    console.warn('[OpenAI] Unavailable:', e.message);
  }

  // 5. Final fallback: Deterministic (always works)
  const latency = Date.now() - startTime;
  const result = {
    provider: 'deterministic',
    model: modelInfo.name,
    text: `[LOCAL-FALLBACK] Analyzed: "${prompt.slice(0, 150)}" — inference unavailable. Install QVAC or set OPENAI_API_KEY for full capability.`,
    usage: { promptTokens: prompt.split(/\s+/).length, completionTokens: 20 },
    latencyMs: latency,
    testMode: false,
  };
  metrics.record('deterministic', model, latency, result.usage.completionTokens);
  return result;
}

// ── Agent-aware inference (auto-selects model by role) ────────────────
export async function inferForAgent(agentId, agentRole, prompt, options = {}) {
  const model = options.model || ROLE_MODELS[agentRole] || 'qvac-1b';
  const system = options.system || `You are Vanguard ${agentRole} agent (${agentId}). Zero-trust, local-first. Report findings concisely with confidence scores.`;
  return infer(prompt, { ...options, model, system });
}

// ── Multi-Agent Decomposition (Jiuwen A2A gateway) ──────────────────
export async function jiuwenDispatch(query, contextId = 'aegis-demo') {
  const url = process.env.JIUWEN_A2A_URL;
  if (!url) {
    return { provider: 'simulated', text: `JiuwenSwarm decomposition of: ${query.slice(0, 200)}` };
  }
  const body = {
    jsonrpc: '2.0',
    id: `aegis-${Date.now()}`,
    method: 'SendMessage',
    params: { message: { messageId: `aegis-${Date.now()}`, contextId, role: 'ROLE_USER', parts: [{ text: query }] } },
  };
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.JIUWEN_A2A_TOKEN) headers.Authorization = `Bearer ${process.env.JIUWEN_A2A_TOKEN}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Jiuwen ${res.status}`);
  const data = await res.json();
  return { provider: 'jiuwen', text: data.result?.text || JSON.stringify(data.result).slice(0, 2000) };
}

export { testMode };
