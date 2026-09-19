import { freshState } from './seed.mjs';

let cfEnv = null;
let memory = null;
let useRedis = false;
let redisUrl = '';
let redisToken = '';
let redisKey = 'vanguard:state';
let kv = null;
let fsModule = null;
let pathModule = null;

export function setCFEnv(env) {
  cfEnv = env;
  if (env?.AEGIS_KV) {
    kv = env.AEGIS_KV;
  }
  if (env?.AEGIS_REDIS_URL) {
    redisUrl = env.AEGIS_REDIS_URL;
    redisToken = env.AEGIS_REDIS_TOKEN || '';
    useRedis = true;
  } else if (cfEnv && process?.env?.UPSTASH_REDIS_REST_URL) {
    redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
    useRedis = true;
  }
}

async function ensureFs() {
  if (!fsModule) {
    const mod = await import('node:fs/promises');
    fsModule = mod.default || mod;
    const pmod = await import('node:path');
    pathModule = pmod.default || pmod;
  }
}

async function redisCommand(args) {
  if (!redisUrl) return null;
  const r = await fetch(redisUrl, { method: 'POST', headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`Redis ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

export async function loadState() {
  if (kv) {
    try {
      const raw = await kv.get('state:global');
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('KV read failed, using memory:', e.message); }
  }
  if (memory) return structuredClone(memory);
  if (cfEnv) {
    memory = freshState();
    await persistState(memory);
    return structuredClone(memory);
  }
  try {
    await ensureFs();
    const filePath = pathModule.resolve(process.cwd(), 'data', 'vanguard.json');
    memory = JSON.parse(await fsModule.readFile(filePath, 'utf8'));
  } catch {
    memory = freshState();
    await persistState(memory);
  }
  return structuredClone(memory);
}

export async function persistState(state) {
  memory = structuredClone(state);
  if (kv) {
    try { await kv.put('state:global', JSON.stringify(state)); return; }
    catch (e) { console.warn('KV write failed:', e.message); }
  }
  if (useRedis) {
    try { await redisCommand(['SET', redisKey, JSON.stringify(state)]); return; }
    catch (e) { console.warn('Redis write failed:', e.message); }
  }
  try {
    await ensureFs();
    const filePath = pathModule.resolve(process.cwd(), 'data', 'vanguard.json');
    await fsModule.mkdir(pathModule.dirname(filePath), { recursive: true });
    await fsModule.writeFile(filePath, JSON.stringify(state, null, 2));
  } catch { /* in-memory state still serves this warm instance */ }
}

export async function mutate(fn) {
  const state = await loadState();
  const result = await fn(state);
  await persistState(state);
  return result;
}

export const entityNames = ['GovernedAgent', 'Evidence', 'ActionRequest', 'AuditEvent', 'Incident', 'Approval', 'User'];
export function entityCollection(state, name) {
  if (!entityNames.includes(name)) throw Object.assign(new Error('Unknown entity'), { status: 404 });
  return state.entities[name];
}
export function newId(prefix = 'rec') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
