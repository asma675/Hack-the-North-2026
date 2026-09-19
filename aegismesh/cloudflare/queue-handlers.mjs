// Cloudflare Queue consumer — processes background agent tasks asynchronously.
// Queued by worker-entry.mjs for: AI verification, event processing, scenario execution, agent tasks.
export default {
  async queue(message, env, ctx) {
    const body = message.body;
    const taskType = body?.type || 'unknown';

    try {
      switch (taskType) {
        case 'ai-verify':
          return await this.processAIVerify(body, env, ctx);
        case 'event-process':
          return await this.processEvent(body, env, ctx);
        case 'scenario-run':
          return await this.processScenario(body, env, ctx);
        case 'gate-check':
          return await this.processGateCheck(body, env, ctx);
        case 'agent-task':
          return await this.processAgentTask(body, env, ctx);
        default:
          console.warn('[Queue] Unknown task type:', taskType);
          return new Response(JSON.stringify({ error: 'unknown task type' }), { status: 400, headers: { 'content-type': 'application/json' } });
      }
    } catch (err) {
      console.error(`[Queue] Task ${taskType} failed:`, err);
      throw err;
    }
  },

  async processAIVerify(body, env, ctx) {
    const { payload, requestId } = body;
    if (!payload) return;
    const { openAIVerify } = await import('../server/integrations.mjs');
    const result = await openAIVerify(payload);
    console.log(`[Queue] AI verify ${requestId}: ${result.mode}`);
    if (env.AEGIS_KV) {
      await env.AEGIS_KV.put(`ai-verify:${requestId}`, JSON.stringify({ ...result, processedAt: Date.now() }));
    }
    if (body.agentKey && env.AEGIS_AGENT_DO) {
      try {
        const agentDo = env.AEGIS_AGENT_DO.get(body.agentKey);
        await agentDo.fetch(new Request('https://internal/addEvent?action=addEvent', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'verifier.verdict', data: { verdict: result.verdict, confidence: result.confidence } }),
        }));
      } catch {}
    }
    return new Response(JSON.stringify({ ok: true, requestId }), { headers: { 'content-type': 'application/json' } });
  },

  async processEvent(body, env, ctx) {
    const { event, agentKey } = body;
    if (!event) return;
    if (agentKey && env.AEGIS_AGENT_DO) {
      try {
        const agentDo = env.AEGIS_AGENT_DO.get(agentKey);
        await agentDo.fetch(new Request('https://internal/addEvent?action=addEvent', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(event),
        }));
      } catch {}
    }
    if (env.AEGIS_KV) {
      const raw = await env.AEGIS_KV.get('events:log') || '[]';
      const log = JSON.parse(raw);
      log.push({ ...event, processedAt: Date.now() });
      if (log.length > 500) log.splice(0, log.length - 500);
      await env.AEGIS_KV.put('events:log', JSON.stringify(log));
    }
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  },

  async processScenario(body, env, ctx) {
    const { scenario, agentIds } = body;
    console.log(`[Queue] Scenario run: ${scenario}`);
    if (agentIds && env.AEGIS_QUEUE) {
      for (const agentId of agentIds) {
        await env.AEGIS_QUEUE.send({
          type: 'event-process',
          agentKey: agentId,
          event: { type: 'scenario.assign', data: { scenario, agentId }, ts: Date.now() },
        });
      }
    }
    return new Response(JSON.stringify({ ok: true, scenario, agentsQueued: agentIds?.length || 0 }), { headers: { 'content-type': 'application/json' } });
  },

  async processGateCheck(body, env, ctx) {
    const { action, agentKey, risk, verifierConfidence, humanRequired } = body;
    const policies = {
      'network.isolate': { roles: ['executor'], min: .85, human: true },
      'credential.rotate': { roles: ['executor'], min: .80, human: true },
      'power.cut': { roles: ['executor'], min: .95, human: true },
      'account.disable': { roles: ['executor'], min: .90, human: true },
      'service.restart': { roles: ['executor'], min: .85, human: true },
    };
    const p = policies[action];
    const role = String(agentKey || '').split('-')[0];
    const checks = [
      { name: 'policy_found', pass: !!p },
      { name: 'role_allowed', pass: !!p && p.roles.includes(role) },
      { name: 'confidence_sufficient', pass: !!p && Number(verifierConfidence || 0) >= (p?.min || 0) },
    ];
    const failed = checks.find(c => !c.pass);
    const status = failed ? 'BLOCKED' : (p?.human && humanRequired !== false ? 'APPROVAL_REQUIRED' : 'APPROVED');
    if (env.AEGIS_KV) {
      await env.AEGIS_KV.put(`gate:${Date.now()}`, JSON.stringify({ action, agentKey, status, checks, at: Date.now() }));
    }
    return new Response(JSON.stringify({ status, reason: failed ? failed.name : 'Gate policy passed', checks }), { headers: { 'content-type': 'application/json' } });
  },

  async processAgentTask(body, env, ctx) {
    const { taskId, agentKey, task, priority } = body;
    console.log(`[Queue] Agent task ${taskId}: ${task?.slice(0, 60)}`);
    // Process the agent task — simulate work then mark complete
    await new Promise(r => setTimeout(r, 200));
    if (env.AEGIS_KV) {
      await env.AEGIS_KV.put(`task:${taskId}`, JSON.stringify({
        taskId, agentKey, task, priority,
        status: 'COMPLETED',
        result: `Task "${task}" executed by ${agentKey} at ${new Date().toISOString()}`,
        completedAt: Date.now(),
      }));
    }
    if (env.AEGIS_AGENT_DO) {
      try {
        const agentDo = env.AEGIS_AGENT_DO.get(agentKey);
        await agentDo.fetch(new Request('https://internal/update?action=addEvent', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'task.completed', data: { taskId, result: 'success' }, ts: Date.now() }),
        }));
      } catch {}
    }
    return new Response(JSON.stringify({ ok: true, taskId, status: 'COMPLETED' }), { headers: { 'content-type': 'application/json' } });
  },
};
