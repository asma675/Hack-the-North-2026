import { Worker } from 'worker_threads';
import EventEmitter from 'bare-events';
import { MODELS, ROLE_MODELS, inferForAgent, metrics, cache } from './qvac.js';
import { peers, ota, distributor, lifecycle } from './pear-integration.mjs';

export class AgentWorkerPool extends EventEmitter {
  constructor(size = 4) {
    super();
    this.size = size;
    this.pool = new Map();
    this.queue = [];
  }

  spawn(agentId, agentConfig) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./agent-thread.mjs', import.meta.url), {
        workerData: {
          agentId,
          config: {
            ...agentConfig,
            model: agentConfig.model || ROLE_MODELS[agentConfig.role] || 'qvac-1b',
          },
        },
      });
      worker.on('message', (msg) => {
        if (msg.type === 'ready') {
          distributor.registerLocalAgent(agentId, agentConfig);
          resolve({ worker, agentId });
        }
        this.emit('message', { agentId, ...msg });
      });
      worker.on('error', reject);
      worker.on('exit', (code) => {
        distributor.unregisterAgent(agentId);
        this.pool.delete(agentId);
        this.emit('exit', { agentId, code });
      });
      this.pool.set(agentId, worker);
    });
  }

  terminate(agentId) {
    const worker = this.pool.get(agentId);
    if (worker) {
      worker.terminate();
      distributor.unregisterAgent(agentId);
      this.pool.delete(agentId);
    }
  }

  broadcast(agentId, signal) {
    const worker = this.pool.get(agentId);
    if (worker) worker.postMessage(signal);
  }

  getActiveAgents() {
    return distributor.getAgents();
  }

  findAgentForTask(taskType) {
    return distributor.findBestAgent(taskType);
  }

  destroy() {
    for (const [id, worker] of this.pool) {
      worker.terminate();
    }
    this.pool.clear();
  }
}

// PEAR OTA update handler for agents
export async function applyAgentUpdate(updateManifest, store) {
  const { agentId, version, payload } = updateManifest;
  const result = ota.checkForUpdate(version);
  if (!result.available) return { updated: false, agentId, reason: 'no-update' };

  const key = `agent:${agentId}:config`;
  const existing = store ? store.get(key) : null;
  if (existing && existing.version >= version) return { updated: false, agentId, reason: 'already-current' };

  const next = { version, config: payload, updatedAt: Date.now() };
  if (store) store.set(key, next);
  const applyResult = ota.applyUpdate(version, payload);
  return { updated: applyResult.applied, agentId, version, config: next };
}

export { MODELS, ROLE_MODELS, inferForAgent, metrics, cache, peers, ota, distributor, lifecycle };
