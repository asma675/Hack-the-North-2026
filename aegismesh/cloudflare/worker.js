// Aegis Gate Cloudflare Worker — policy enforcement gateway.
// Deployed separately or as a Worker bound to CLOUDFLARE_GATE_URL.
const policies = {
  'network.isolate': { roles: ['executor'], min: .85, human: true },
  'credential.rotate': { roles: ['executor'], min: .80, human: true },
  'power.cut': { roles: ['executor'], min: .95, human: true },
  'account.disable': { roles: ['executor'], min: .90, human: true },
  'service.restart': { roles: ['executor'], min: .85, human: true },
  'telemetry.read': { roles: ['telemetry', 'security', 'network', 'change'], min: 0, human: false },
};

const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });

export default {
  async fetch(request, env) {
    const u = new URL(request.url);

    // Health check with DO state
    if (u.pathname === '/health') {
      const info = { ok: true, service: 'Aegis Gate Cloudflare Worker', time: new Date().toISOString() };
      if (env.GATE_KV) {
        try {
          const gateLog = await env.GATE_KV.get('gate:health') || '{}';
          Object.assign(info, JSON.parse(gateLog));
        } catch {}
      }
      return j(info);
    }

    // Policy check endpoint
    if (u.pathname === '/authorize' && request.method === 'POST') {
      if (env.GATE_TOKEN && request.headers.get('authorization') !== `Bearer ${env.GATE_TOKEN}`) {
        return j({ error: 'unauthorized' }, 401);
      }

      const body = await request.json();
      const p = policies[body.action];
      const role = String(body.agent_key || '').split('-')[0];
      const checks = [
        { name: 'policy_found', pass: !!p },
        { name: 'role_allowed', pass: !!p && p.roles.includes(role) },
        { name: 'confidence_sufficient', pass: !!p && Number(body.verifier_confidence || 0) >= (p?.min || 0) },
      ];
      const failed = checks.find(c => !c.pass);

      // Log gate decision to KV for audit trail
      if (env.GATE_KV) {
        const logKey = `gate:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await env.GATE_KV.put(logKey, JSON.stringify({
          action: body.action, agent_key: body.agent_key, role,
          verdict: failed ? 'BLOCKED' : 'PASSED', checks,
          at: Date.now(),
        }));
      }

      if (failed) return j({ status: 'BLOCKED', reason: failed.name, checks });

      const status = p?.human && body.human_required !== false ? 'APPROVAL_REQUIRED' : 'APPROVED';
      return j({
        status,
        reason: 'Cloudflare Aegis Gate policy passed',
        checks: [...checks, { name: 'worker_execution', pass: true, detail: 'Ran on Cloudflare Workers' }],
      });
    }

    // Batch policy evaluation
    if (u.pathname === '/batch-authorize' && request.method === 'POST') {
      if (env.GATE_TOKEN && request.headers.get('authorization') !== `Bearer ${env.GATE_TOKEN}`) {
        return j({ error: 'unauthorized' }, 401);
      }
      const body = await request.json();
      const results = body.actions?.map(action => {
        const p = policies[action];
        const role = String(body.agent_key || '').split('-')[0];
        const pass = !!p && p.roles.includes(role);
        return { action, status: pass ? 'ALLOWED' : 'BLOCKED', reason: pass ? 'ok' : 'role_forbidden' };
      }) || [];
      return j({ results });
    }

    return j({ error: 'not found' }, 404);
  },
};
