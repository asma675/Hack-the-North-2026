// AegisMesh Sovereign — Pear runtime integration layer.
// Manages P2P peer discovery, OTA updates, distributed agent registry,
// and Pear lifecycle hooks. No cloud required.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'bare:fs';
import { join } from 'bare:path';
import { createHash } from 'bare:crypto';

// ── Pear App Identity ────────────────────────────────────────────────
export const APP_ID = 'aegismesh-sovereign';
export const APP_VERSION = '1.0.0';
export const PEAR_KEY = process.env.PEAR_KEY || '';

// ── Peer Registry ────────────────────────────────────────────────────
// Tracks all known peers in the P2P network (Hyperswarm).
class PeerRegistry {
  constructor() {
    this.peers = new Map(); // peerId → { status, agents, lastSeen, version }
    this.localPeerId = this.generatePeerId();
  }

  generatePeerId() {
    const data = `${Date.now()}-${Math.random()}-${navigator?.userAgent || 'node'}`;
    return createHash('sha-256').update(data).digest('hex').slice(0, 16);
  }

  addPeer(peerId, info = {}) {
    this.peers.set(peerId, {
      peerId,
      status: 'connected',
      agents: info.agents || [],
      version: info.version || APP_VERSION,
      lastSeen: Date.now(),
      ...info,
    });
  }

  removePeer(peerId) {
    this.peers.delete(peerId);
  }

  updatePeer(peerId, updates) {
    const peer = this.peers.get(peerId);
    if (peer) Object.assign(peer, updates, { lastSeen: Date.now() });
  }

  getPeer(peerId) { return this.peers.get(peerId); }
  getAllPeers() { return Array.from(this.peers.values()); }
  getConnectedCount() { return Array.from(this.peers.values()).filter(p => p.status === 'connected').length; }
  getPeersWithAgents() { return Array.from(this.peers.values()).filter(p => p.agents.length > 0); }

  // Broadcast capability to all peers
  getNetworkCapabilities() {
    const capabilities = new Set();
    for (const peer of this.peers.values()) {
      for (const agent of peer.agents) {
        capabilities.add(`${agent.role}:${agent.model}`);
      }
    }
    return Array.from(capabilities);
  }
}

// ── OTA Update System ────────────────────────────────────────────────
class OTASystem {
  constructor() {
    this.currentVersion = APP_VERSION;
    this.updateHistory = [];
    this.pendingUpdate = null;
  }

  checkForUpdate(version) {
    if (!version) return { available: false, current: this.currentVersion };
    if (version > this.currentVersion) {
      this.pendingUpdate = { from: this.currentVersion, to: version, timestamp: Date.now() };
      return { available: true, from: this.currentVersion, to: version };
    }
    return { available: false, current: this.currentVersion };
  }

  applyUpdate(version, payload) {
    if (!this.pendingUpdate || this.pendingUpdate.to !== version) {
      return { applied: false, reason: 'No pending update for this version' };
    }
    const record = {
      from: this.currentVersion,
      to: version,
      timestamp: Date.now(),
      payloadSize: JSON.stringify(payload || {}).length,
      status: 'applied',
    };
    this.updateHistory.push(record);
    this.currentVersion = version;
    this.pendingUpdate = null;
    return { applied: true, version, record };
  }

  getHistory() { return [...this.updateHistory]; }
  getStatus() {
    return {
      currentVersion: this.currentVersion,
      pendingUpdate: this.pendingUpdate,
      totalUpdates: this.updateHistory.length,
      appId: APP_ID,
      pearKey: PEAR_KEY ? PEAR_KEY.slice(0, 8) + '...' : 'not-set',
    };
  }
}

// ── Distributed Agent Registry ───────────────────────────────────────
// Tracks which agents are running on which peers.
class AgentDistributor {
  constructor(peers) {
    this.peers = peers;
    this.localAgents = new Map(); // agentId → { status, role, model, lastTask }
  }

  registerLocalAgent(agentId, config) {
    this.localAgents.set(agentId, {
      agentId,
      status: 'active',
      role: config.role || 'UNKNOWN',
      model: config.model || 'qvac-1b',
      trustLevel: config.trustLevel || 'verified',
      peerId: this.peers.localPeerId,
      tasksCompleted: 0,
      createdAt: Date.now(),
    });
  }

  unregisterAgent(agentId) {
    this.localAgents.delete(agentId);
  }

  getAgents() { return Array.from(this.localAgents.values()); }
  getAgent(agentId) { return this.localAgents.get(agentId); }
  getActiveCount() { return Array.from(this.localAgents.values()).filter(a => a.status === 'active').length; }

  // Find best peer/agent for a task based on role matching
  findBestAgent(taskType) {
    // 1. Check local agents
    for (const agent of this.localAgents.values()) {
      if (agent.status === 'active' && agent.role?.toLowerCase().includes(taskType.toLowerCase())) {
        return { agent, local: true, peerId: agent.peerId };
      }
    }
    // 2. Check remote peers
    for (const peer of this.peers.getAllPeers()) {
      for (const agent of peer.agents) {
        if (agent.role?.toLowerCase().includes(taskType.toLowerCase())) {
          return { agent, local: false, peerId: peer.peerId };
        }
      }
    }
    return null;
  }
}

// ── Lifecycle Hooks ──────────────────────────────────────────────────
export function createLifecycleHooks(onInstall, onUpgrade, onUninstall) {
  return {
    onInstall: onInstall || (async (env) => { console.log(`[Pear] ${APP_ID} v${APP_VERSION} installed`, env?.installPath || ''); }),
    onUpgrade: onUpgrade || (async (from, to) => { console.log(`[Pear] ${APP_ID} upgraded ${from} → ${to}`); }),
    onUninstall: onUninstall || (async () => { console.log(`[Pear] ${APP_ID} uninstalled`); }),
  };
}

// ── Pear Runtime Check ───────────────────────────────────────────────
export function isPearRuntime() {
  try {
    return typeof pear !== 'undefined' && pear.runtime !== undefined;
  } catch { return false; }
}

export function pearStatus() {
  return {
    isPearRuntime: isPearRuntime(),
    appId: APP_ID,
    version: APP_VERSION,
    key: PEAR_KEY ? PEAR_KEY.slice(0, 8) + '...' : 'not-set',
    localPeerId: peers?.localPeerId || 'initializing',
    connectedPeers: peers?.getConnectedCount() || 0,
    peersWithAgents: peers?.getPeersWithAgents().length || 0,
    networkCapabilities: peers?.getNetworkCapabilities() || [],
  };
}

// ── Module Init ──────────────────────────────────────────────────────
export const peers = new PeerRegistry();
export const ota = new OTASystem();
export const distributor = new AgentDistributor(peers);
export const lifecycle = createLifecycleHooks();
