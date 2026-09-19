// AegisMesh Agent Thread — runs in worker_threads for isolation.
// Each agent gets its own thread, QVAC inference context.
import { parentPort, workerData } from 'worker_threads';
import { infer, ROLE_MODELS } from './qvac.js';

const { agentId, config } = workerData;

let alive = true;
let currentModel = config.model || ROLE_MODELS[config.role] || 'qvac-1b';
let temperature = config.temperature ?? 0.3;
let maxTokens = config.maxTokens ?? 1024;
let systemPrompt = config.system || `You are AegisMesh ${config.role || 'UNKNOWN'} agent (${agentId}). Zero-trust, local-first.`;
let trustLevel = config.trustLevel || 'verified';

parentPort.on('message', async (signal) => {
  if (signal.type === 'terminate') {
    alive = false;
    parentPort.postMessage({ type: 'terminated', agentId });
    return;
  }
  if (signal.type === 'update') {
    if (signal.model) currentModel = signal.model;
    if (signal.temperature !== undefined) temperature = signal.temperature;
    if (signal.maxTokens) maxTokens = signal.maxTokens;
    if (signal.system) systemPrompt = signal.system;
    if (signal.trustLevel) trustLevel = signal.trustLevel;
    parentPort.postMessage({ type: 'updated', agentId, config: { currentModel, trustLevel } });
    return;
  }
  if (signal.type === 'infer') {
    try {
      const startTime = Date.now();
      const result = await infer(signal.prompt || '', {
        model: currentModel,
        system: systemPrompt,
        user: signal.user || agentId,
        maxTokens,
        temperature,
        forceTestMode: signal.forceTestMode || false,
      });
      const totalLatency = Date.now() - startTime;
      parentPort.postMessage({
        type: 'infer-result',
        agentId,
        result: { ...result, agentId, trustLevel, totalLatencyMs: totalLatency },
      });
    } catch (e) {
      parentPort.postMessage({ type: 'infer-error', agentId, error: e.message });
    }
    return;
  }
  if (signal.type === 'heartbeat') {
    parentPort.postMessage({ type: 'heartbeat-ack', agentId, ts: Date.now() });
    return;
  }
  if (signal.type === 'peer-status') {
    parentPort.postMessage({
      type: 'peer-status',
      agentId,
      note: 'Peer info managed by main thread',
    });
    return;
  }
});

parentPort.postMessage({ type: 'ready', agentId });

const heartbeat = setInterval(() => {
  if (!alive) { clearInterval(heartbeat); return; }
  parentPort.postMessage({ type: 'heartbeat', agentId, ts: Date.now() });
}, 10000);
