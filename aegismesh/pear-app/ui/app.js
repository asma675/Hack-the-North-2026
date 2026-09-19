export default async function start({ port = 8000, host = '0.0.0.0', root } = {}) {
  const { default: createServer } = await import('bare:http');
  const { resolve } = await import('bare:path');
  const { readFileSync, existsSync } = await import('bare:fs');

  // ── State ──────────────────────────────────────────
  const state = {
    agents: new Map(),        // agentId → agent info
    peers: [],                // discovered P2P peers
    auditLog: [],             // all actions with timestamps
    qvacTestMode: process.env.QVAC_TEST_MODE === '1',
    totalRequests: 0,
    startedAt: Date.now(),
  };

  // ── Import QVAC & Pear integration ─────────────────
  let infer, inferForAgent, qvacModels, qvacRoleModels, qvacMetrics, qvacCache;
  let pearPeers, pearOTA, pearDistributor, pearLifecycle, isPearRuntimeFlag;
  let bbApiKey, bbAvailable;
  try {
    const qvac = await import('../workers/qvac.js');
    infer = qvac.infer;
    inferForAgent = qvac.inferForAgent;
    qvacModels = qvac.MODELS;
    qvacRoleModels = qvac.ROLE_MODELS;
    qvacMetrics = qvac.metrics;
    qvacCache = qvac.cache;
  } catch (e) { console.warn('[QVAC] import failed:', e.message); }
  try {
    const pear = await import('../workers/pear-integration.mjs');
    pearPeers = pear.peers;
    pearOTA = pear.ota;
    pearDistributor = pear.distributor;
    pearLifecycle = pear.lifecycle;
    isPearRuntimeFlag = pear.isPearRuntime ? pear.isPearRuntime() : false;
  } catch (e) { console.warn('[Pear] import failed:', e.message); }
  bbApiKey = process.env.BROWSERBASE_API_KEY || '';
  bbAvailable = !!bbApiKey;

  // ── Helpers ────────────────────────────────────────
  function logAudit(entry) {
    state.auditLog.push({ ts: Date.now(), ...entry });
    if (state.auditLog.length > 5000) state.auditLog.shift();
  }

  function json(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  function getBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
    });
  }

  // ── Server ─────────────────────────────────────────
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // ═══ HEALTH ═══
    if (pathname === '/health') {
      json(res, 200, {
        status: 'ok',
        runtime: 'pear',
        a2a: 'active',
        qvac: !!infer,
        pear: !!pearPeers,
        browserbase: bbAvailable,
        version: '1.0.0',
        uptime: Date.now() - state.startedAt,
      });
      return;
    }

    // ═══ BROWSERBASE STATUS ═══
    if (pathname === '/api/browserbase/status') {
      json(res, 200, {
        available: bbAvailable,
        configured: !!bbApiKey,
        keyPreview: bbApiKey ? bbApiKey.slice(0, 4) + '...' : 'not-set',
        mode: bbAvailable ? 'BROWSERBASE' : 'LOCAL-ONLY',
      });
      return;
    }

    // ═══ BROWSERBASE INVESTIGATION ═══
    if (pathname === '/api/browserbase/investigate' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      if (!bbAvailable) {
        json(res, 503, { error: 'Browserbase not configured', mode: 'LOCAL-ONLY' });
        return;
      }
      const { url, task } = body;
      if (!url || !task) { json(res, 400, { error: 'url and task required' }); return; }

      const startTime = Date.now();
      try {
        const bbRes = await fetch('https://api.browserbase.com/v1/agents/runs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BB-API-Key': bbApiKey,
          },
          body: JSON.stringify({
            task: `Navigate to ${url}. ${task}`,
            browserSettings: { solveCaptchas: true, verified: true },
            resultSchema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                findings: { type: 'array', items: { type: 'string' } },
                threats: { type: 'array', items: { type: 'string' } },
                soc2Status: { type: 'string' },
                disclosures: { type: 'array', items: { type: 'string' } },
              },
            },
          }),
          signal: AbortSignal.timeout(120000),
        });
        const data = await bbRes.json();
        const elapsed = Date.now() - startTime;
        const result = {
          ok: bbRes.ok,
          mode: 'BROWSERBASE',
          url,
          task,
          runId: data.runId,
          status: data.status,
          latencyMs: elapsed,
        };
        console.log(`[Browserbase] Investigate: ${url} → ${data.status}`);
        state.totalRequests++;
        json(res, 200, result);
      } catch (e) {
        json(res, 400, { error: e.message });
      }
      return;
    }

    // ═══ BROWSERBASE FETCH ═══
    if (pathname === '/api/browserbase/fetch' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      if (!bbAvailable) {
        json(res, 503, { error: 'Browserbase not configured', mode: 'LOCAL-ONLY' });
        return;
      }
      const { url, allowRedirects = true, proxies = false } = body;
      if (!url) { json(res, 400, { error: 'url required' }); return; }

      try {
        const bbRes = await fetch('https://api.browserbase.com/v1/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BB-API-Key': bbApiKey,
          },
          body: JSON.stringify({ url, allowRedirects, proxies }),
          signal: AbortSignal.timeout(30000),
        });
        const data = await bbRes.json();
        console.log(`[Browserbase] Fetch: ${url} → ${data.statusCode}`);
        json(res, 200, {
          ok: bbRes.ok,
          mode: 'BROWSERBASE',
          url,
          statusCode: data.statusCode,
          contentType: data.contentType,
          content: (data.content || '').slice(0, 5000),
        });
      } catch (e) {
        json(res, 400, { error: e.message });
      }
      return;
    }

    // ═══ QVAC METRICS ═══
    if (pathname === '/api/qvac/metrics') {
      json(res, 200, {
        models: qvacModels,
        roleModels: qvacRoleModels,
        summary: qvacMetrics?.summary() || { totalRequests: 0, byProvider: {}, avgLatencyMs: 0, totalTokens: 0, cacheSize: 0 },
        testMode: state.qvacTestMode,
      });
      return;
    }

    // ═══ QVAC INFERENCE (direct) ═══
    if (pathname === '/api/qvac/infer' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      if (!infer) { json(res, 503, { error: 'QVAC not available' }); return; }
      try {
        const result = await infer(body.prompt || '', {
          model: body.model || 'qvac-1b',
          system: body.system,
          user: body.user,
          maxTokens: body.maxTokens || 1024,
          temperature: body.temperature ?? 0.3,
          forceTestMode: body.forceTestMode || state.qvacTestMode,
        });
        logAudit({ action: 'qvac-infer', model: result.provider, latencyMs: result.latencyMs });
        state.totalRequests++;
        json(res, 200, result);
      } catch (e) {
        json(res, 400, { error: e.message });
      }
      return;
    }

    // ═══ AGENT INFERENCE (role-aware) ═══
    if (pathname === '/api/agent/infer' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      if (!inferForAgent) { json(res, 503, { error: 'QVAC not available' }); return; }
      try {
        const result = await inferForAgent(body.agentId, body.role, body.prompt || '', {
          model: body.model,
          forceTestMode: body.forceTestMode || state.qvacTestMode,
        });
        logAudit({ action: 'agent-infer', agentId: body.agentId, model: result.provider, latencyMs: result.latencyMs });
        state.totalRequests++;
        json(res, 200, result);
      } catch (e) {
        json(res, 400, { error: e.message });
      }
      return;
    }

    // ═══ PEAR STATUS ═══
    if (pathname === '/api/pear/status') {
      let pearInfo = { isPearRuntime: false, appId: 'vanguard-sovereign', version: '1.0.0', key: 'local-dev' };
      try {
        if (pearPeers) {
          pearInfo = {
            isPearRuntime: typeof pear !== 'undefined',
            appId: 'vanguard-sovereign',
            version: '1.0.0',
            key: process.env.PEAR_KEY ? process.env.PEAR_KEY.slice(0, 8) + '...' : 'local-dev',
            localPeerId: pearPeers.localPeerId,
            connectedPeers: pearPeers.getConnectedCount(),
            peersWithAgents: pearPeers.getPeersWithAgents().length,
            networkCapabilities: pearPeers.getNetworkCapabilities(),
            peers: pearPeers.getAllPeers(),
          };
        }
      } catch {}
      json(res, 200, pearInfo);
      return;
    }

    // ═══ PEER DISCOVERY ═══
    if (pathname === '/api/pear/peers' && req.method === 'GET') {
      const peerList = pearPeers ? pearPeers.getAllPeers() : [];
      json(res, 200, { peers: peerList, count: peerList.length, connected: pearPeers?.getConnectedCount() || 0 });
      return;
    }

    if (pathname === '/api/pear/peers' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      if (pearPeers && body.peerId) {
        pearPeers.addPeer(body.peerId, body.info || {});
        logAudit({ action: 'peer-connect', peerId: body.peerId });
      }
      json(res, 200, { ok: true });
      return;
    }

    // ═══ OTA UPDATES ═══
    if (pathname === '/api/ota/status') {
      let otaInfo = { currentVersion: '1.0.0', pendingUpdate: null, totalUpdates: 0, appId: 'vanguard-sovereign' };
      try {
        if (pearOTA) otaInfo = pearOTA.getStatus();
      } catch {}
      json(res, 200, otaInfo);
      return;
    }

    if (pathname === '/api/ota/check' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      let result = { available: false };
      try {
        if (pearOTA && body.version) result = pearOTA.checkForUpdate(body.version);
      } catch {}
      json(res, 200, result);
      return;
    }

    if (pathname === '/api/ota/apply' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      let result = { applied: false };
      try {
        if (pearOTA) result = pearOTA.applyUpdate(body.version, body.payload);
      } catch {}
      logAudit({ action: 'ota-apply', ...result });
      json(res, 200, result);
      return;
    }

    // ═══ AGENT MANAGEMENT ═══
    if (pathname === '/api/agent' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      if (!body.agentId) { json(res, 400, { error: 'agentId required' }); return; }
      const agent = {
        id: body.agentId,
        status: 'active',
        role: body.role || 'GUARD',
        model: body.model || 'qvac-1b',
        trustLevel: body.trustLevel || 'verified',
        system: body.system || 'Vanguard guard agent',
        createdAt: Date.now(),
        tasksCompleted: 0,
        peerId: pearPeers?.localPeerId || 'local',
      };
      state.agents.set(body.agentId, agent);
      logAudit({ action: 'agent-create', agentId: body.agentId, role: agent.role });
      state.totalRequests++;
      json(res, 201, { ok: true, agentId: body.agentId, agent });
      return;
    }

    if (pathname === '/api/agent' && req.method === 'DELETE') {
      const { agentId } = Object.fromEntries(url.searchParams);
      const existed = state.agents.has(agentId);
      state.agents.delete(agentId);
      logAudit({ action: 'agent-remove', agentId, existed });
      json(res, existed ? 200 : 404, { ok: existed, agentId });
      return;
    }

    if (pathname === '/api/agents') {
      json(res, 200, { agents: Array.from(state.agents.values()), count: state.agents.size });
      return;
    }

    // ═══ DISPATCH (agent-to-agent) ═══
    if (pathname === '/api/dispatch' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      if (!body.from || !body.to || !body.message) { json(res, 400, { error: 'from, to, message required' }); return; }
      const target = state.agents.get(body.to);
      const logEntry = { action: 'dispatch', from: body.from, to: body.to, msgSize: body.message.length };
      logAudit(logEntry);
      state.totalRequests++;
      json(res, 200, { ok: true, from: body.from, to: body.to, echo: `[${body.from}] → [${body.to}]: ${body.message.slice(0, 100)}`, timestamp: Date.now() });
      return;
    }

    // ═══ AUDIT LOG ═══
    if (pathname === '/api/audit') {
      const since = Number(url.searchParams.get('since') || 0);
      const entries = state.auditLog.filter(e => e.ts >= since);
      json(res, 200, { entries, count: entries.length });
      return;
    }

    // ═══ SYSTEM STATUS (combined) ═══
    if (pathname === '/api/status') {
      json(res, 200, {
        system: {
          uptime: Date.now() - state.startedAt,
          totalRequests: state.totalRequests,
          agents: state.agents.size,
          qvacTestMode: state.qvacTestMode,
          pearRuntime: isPearRuntimeFlag,
        },
        qvac: qvacMetrics?.summary() || { totalRequests: 0, byProvider: {}, avgLatencyMs: 0, totalTokens: 0, cacheSize: 0 },
        agents: Array.from(state.agents.values()),
        auditCount: state.auditLog.length,
      });
      return;
    }

    // ═══ SERVE UI ═══
    if (pathname === '/' || pathname === '/index.html') {
      const indexPath = resolve(root || process.cwd(), 'ui', 'index.html');
      if (existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(readFileSync(indexPath));
        return;
      }
    }

    json(res, 404, { error: 'not found', pathname });
  });

  server.listen(port, host);
  console.log(`Vanguard Sovereign listening on http://${host}:${port}`);
  return server;
}
