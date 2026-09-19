// Tool definitions for the Vanguard autonomous orchestrator agent.
// Each tool has a schema compatible with @cloudflare/agents tool-calling protocol.

import { loadSkills, searchSkills, matchSkills } from './skill-registry.mjs';
import { getConversationId } from './a2a-protocol.mjs';
import { loadState } from './kv-store.mjs';

export const TOOL_SCHEMAS = [
  { name: 'list_agents', description: 'List all available agents in the fleet with their roles, status, trust scores, and capabilities.', parameters: { type: 'object', properties: {}, required: [] } },
  { name: 'query_agent', description: 'Get detailed status, capabilities, trust score, and recent activity of a specific agent. Pass the agent_key (e.g. "security-02").', parameters: { type: 'object', properties: { agent_key: { type: 'string', description: 'The agent identifier, e.g. security-02' } }, required: ['agent_key'] } },
  { name: 'dispatch_task', description: 'Assign a task to a specific agent by agent_key. Returns a task_id for monitoring.', parameters: { type: 'object', properties: { agent_key: { type: 'string' }, task: { type: 'string' }, priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } }, required: ['agent_key', 'task'] } },
  { name: 'get_task_status', description: 'Check the status and result of a dispatched task.', parameters: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] } },
  { name: 'get_system_health', description: 'Check health status of all Vanguard services.', parameters: { type: 'object', properties: {}, required: [] } },
  { name: 'get_incident', description: 'Get incident details.', parameters: { type: 'object', properties: { incident_id: { type: 'string' } }, required: ['incident_id'] } },
  { name: 'synthesize_findings', description: 'Combine findings from multiple agents into a comprehensive analysis.', parameters: { type: 'object', properties: { agent_ids: { type: 'array', items: { type: 'string' } }, question: { type: 'string' } }, required: ['agent_ids', 'question'] } },
  { name: 'run_scenario', description: 'Execute a predefined BREACH or FALSE_ALARM scenario.', parameters: { type: 'object', properties: { scenario: { type: 'string', enum: ['BREACH', 'FALSE_ALARM'] } }, required: ['scenario'] } },
  { name: 'list_skills', description: 'List all available skills. Use to understand what agents can do.', parameters: { type: 'object', properties: { agent_id: { type: 'string' }, category: { type: 'string' }, query: { type: 'string' } }, required: [] } },
  { name: 'find_skills_for_task', description: 'Find skills relevant to a task description. Use when planning how to accomplish a goal.', parameters: { type: 'object', properties: { task_description: { type: 'string' } }, required: ['task_description'] } },
  { name: 'a2a_send', description: 'Send a message directly to another agent via A2A protocol. Use for agent-to-agent collaboration.', parameters: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, content: { type: 'string' }, type: { type: 'string', enum: ['text', 'request', 'response', 'announcement'] } }, required: ['from', 'to', 'content'] } },
  { name: 'a2a_get_messages', description: 'Retrieve A2A messages for an agent.', parameters: { type: 'object', properties: { agent: { type: 'string' }, limit: { type: 'number', default: 50 } }, required: ['agent'] } },
  { name: 'a2a_broadcast', description: 'Broadcast a message to all agents in a conversation.', parameters: { type: 'object', properties: { from: { type: 'string' }, content: { type: 'string' }, type: { type: 'string', default: 'announcement' } }, required: ['from', 'content'] } },
  { name: 'run_jiuwen', description: 'Dispatch a query to JiuwenSwarm/WorkSwarm for multi-agent decomposition.', parameters: { type: 'object', properties: { query: { type: 'string' }, context_id: { type: 'string' } }, required: ['query'] } },

  // Browserbase tools — external threat intel verification (cloud, optional)
  { name: 'browserbase_search_intel', description: 'Search the web via Browserbase Search API for threat intel, CVEs, security advisories, vendor documentation, and SOC 2 trust centers. Returns structured results with URLs. Use when agents need external verification or public security data.', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query (e.g. "CVE-2024-XXXX impact Cloudflare")' }, numResults: { type: 'number', description: 'Number of results (1-25, default 5)' } }, required: ['query'] } },
  { name: 'browserbase_verify_web_target', description: 'Use Browserbase cloud browser (with CAPTCHA solving and verified mode) to navigate, inspect, and extract data from anti-bot protected security pages like vendor trust centers, SOC 2 dashboards, and CVE databases. Runs autonomous browser agent in plain English.', parameters: { type: 'object', properties: { url: { type: 'string', description: 'URL to investigate or inspect' }, task: { type: 'string', description: 'Action for the browser agent to perform on the page (e.g. "Extract SOC 2 status and check for public disclosure notices")' }, solveCaptchas: { type: 'boolean', description: 'Enable CAPTCHA solving (default true)' }, verified: { type: 'boolean', description: 'Use verified browser mode (default true)' } }, required: ['url', 'task'] } },
  { name: 'browserbase_fetch_page', description: 'Fetch any page content reliably via Browserbase Fetch API — bypasses rate limits, anti-bot blocks, and CAPTCHAs without a browser session. Use for static pages, APIs, and sitemaps that do not need JavaScript rendering.', parameters: { type: 'object', properties: { url: { type: 'string', description: 'URL to fetch' }, allowRedirects: { type: 'boolean', description: 'Follow redirects (default true)' }, proxies: { type: 'boolean', description: 'Enable proxy support (default false)' } }, required: ['url'] } },
];

// Execute a tool call — these are called by the orchestrator agent during its reasoning loop.
export async function executeTool(toolName, args, env) {
  switch (toolName) {
    case 'list_agents': {
      const state = await loadAgentState(env);
      const agents = state.entities?.GovernedAgent?.map(a => ({
        agent_key: a.agent_key,
        name: a.name,
        role: a.role,
        status: a.status,
        trust_score: a.trust_score,
        tools: a.tools || [],
        permissions: a.permissions || [],
      })) || [];
      return { agents, count: agents.length };
    }

    case 'query_agent': {
      const { agent_key } = args;
      if (env.AEGIS_AGENT_DO) {
        const agentDo = env.AEGIS_AGENT_DO.get(agent_key);
        const res = await agentDo.fetch(new Request(`https://internal/summary?action=getSummary`));
        return await res.json();
      }
      const state = await loadAgentState(env);
      const agent = state.entities?.GovernedAgent?.find(a => a.agent_key === agent_key);
      return agent || { error: `Agent ${agent_key} not found` };
    }

    case 'dispatch_task': {
      const { agent_key, task, priority = 'MEDIUM' } = args;
      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const taskBody = {
        type: 'event-process',
        taskId,
        agentKey: agent_key,
        task: { description: task, priority, assignedAt: Date.now() },
      };
      if (env.AEGIS_QUEUE) {
        await env.AEGIS_QUEUE.send(taskBody);
      }
      if (env.AEGIS_AGENT_DO) {
        try {
          const agentDo = env.AEGIS_AGENT_DO.get(agent_key);
          await agentDo.fetch(new Request('https://internal/update?action=addEvent', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type: 'task.assigned', data: { taskId, task, priority }, ts: Date.now() }),
          }));
        } catch {}
      }
      return { taskId, agent_key, task, priority, status: 'QUEUED' };
    }

    case 'get_task_status': {
      if (env.AEGIS_KV) {
        const raw = await env.AEGIS_KV.get(`task:${args.task_id}`);
        if (raw) return JSON.parse(raw);
      }
      return { task_id: args.task_id, status: 'UNKNOWN', error: 'Task not found in KV' };
    }

    case 'get_system_health': {
      const { integrationStatus } = await import('../server/integrations.mjs');
      return {
        api: 'HEALTHY',
        runtime: 'cloudflare-workers',
        integrations: integrationStatus(),
        timestamp: new Date().toISOString(),
      };
    }

    case 'get_incident': {
      const { incident_id } = args;
      if (env.AEGIS_KV) {
        const raw = await env.AEGIS_KV.get(`incident:${incident_id}`);
        if (raw) return JSON.parse(raw);
      }
      const state = await loadAgentState(env);
      const incident = state.entities?.Incident?.find(i => i.incident_id === incident_id);
      return incident || { error: `Incident ${incident_id} not found` };
    }

    case 'synthesize_findings': {
      const { agent_ids, question } = args;
      const findings = [];
      if (env.AEGIS_KV) {
        for (const id of agent_ids) {
          try {
            const raw = await env.AEGIS_KV.get(`agent:${id}:events`);
            if (raw) {
              const events = JSON.parse(raw);
              findings.push({ agentId: id, recentEvents: events.slice(-5), eventCount: events.length });
            }
          } catch {}
        }
      }
      return {
        question,
        findings,
        summary: `${findings.length} agents contributed data. Synthesized analysis pending LLM review.`,
        synthesizedAt: Date.now(),
      };
    }

    case 'run_scenario': {
      const { scenario } = args;
      const state = await loadAgentState(env);
      const incident = {
        id: scenario,
        title: scenario === 'BREACH' ? 'Credential Compromise Investigation' : 'Resource Spike Analysis',
        severity: 'HIGH',
        state: 'DETECTED',
        scenario,
        createdAt: Date.now(),
      };
      if (env.AEGIS_KV) {
        await env.AEGIS_KV.put(`incident:${scenario}`, JSON.stringify(incident));
        await env.AEGIS_KV.put('state:global', JSON.stringify(state));
      }
      if (env.AEGIS_QUEUE) {
        const activeAgents = state.entities?.GovernedAgent
          ?.filter(a => a.status !== 'IDLE' && a.status !== 'QUARANTINED')
          .map(a => a.agent_key) || [];
        await env.AEGIS_QUEUE.send({
          type: 'scenario-run',
          scenario,
          agentIds: activeAgents,
        });
      }
      return { scenario, status: 'RUNNING', activeAgents: state.entities?.GovernedAgent?.length || 0 };
    }

    case 'list_skills': {
      const { agent_id, category, query: q } = args;
      let skills = await loadSkills(env.AEGIS_KV);
      if (agent_id) skills = skills.filter(s => s.agent === agent_id);
      if (category) skills = skills.filter(s => s.category === category);
      if (q) skills = await searchSkills(env.AEGIS_KV, q);
      return { skills, count: skills.length };
    }

    case 'find_skills_for_task': {
      const matches = await matchSkills(env.AEGIS_KV, args.task_description);
      return { matched: matches, suggestion: matches.length > 0 ? `Use ${matches.map(m => m.name).join(', ')} for this task` : 'No matching skills found — consider dispatching to a generalist agent' };
    }

    case 'a2a_send': {
      const { from, to, content, type: msgType = 'text' } = args;
      const convId = getConversationId(from, to);
      if (env.AEGIS_AGENT_DO) {
        try {
          const conv = env.AEGIS_AGENT_DO.get(convId);
          const res = await conv.fetch(new Request('https://internal/sendMessage?action=sendMessage', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ from, to, content, type: msgType }),
          }));
          return await res.json();
        } catch { return { ok: false, error: 'Conversation DO unavailable' }; }
      }
      return { ok: false, error: 'A2A not configured — set AEGIS_AGENT_DO binding' };
    }

    case 'a2a_get_messages': {
      if (env.AEGIS_AGENT_DO) {
        try {
          const convs = [getConversationId(args.agent, 'commander-01'), getConversationId(args.agent, 'security-02'), getConversationId(args.agent, 'network-01'), getConversationId(args.agent, 'telemetry-03'), getConversationId(args.agent, 'change-01'), getConversationId(args.agent, 'skeptic-01'), getConversationId(args.agent, 'verifier-01'), getConversationId(args.agent, 'executor-01')];
          const all = [];
          for (const c of convs) {
            try {
              const conv = env.AEGIS_AGENT_DO.get(c);
              const res = await conv.fetch(new Request(`https://internal/getMessages?action=getMessages&agent=${encodeURIComponent(args.agent)}&limit=${args.limit || 50}`));
              const msgs = await res.json();
              all.push(...msgs);
            } catch {}
          }
          all.sort((a, b) => b.timestamp - a.timestamp);
          return { messages: all.slice(0, args.limit || 50), count: all.length };
        } catch { return { messages: [], count: 0 }; }
      }
      return { messages: [], count: 0 };
    }

    case 'a2a_broadcast': {
      const { from, content, type: msgType = 'announcement' } = args;
      if (env.AEGIS_AGENT_DO) {
        try {
          const state = await loadState(env);
          const agents = (state.entities?.GovernedAgent || []).map(a => a.agent_key).filter(a => a !== from);
          let delivered = 0;
          for (const agent of agents) {
            const convId = getConversationId(from, agent);
            const conv = env.AEGIS_AGENT_DO.get(convId);
            try {
              await conv.fetch(new Request('https://internal/sendMessage?action=sendMessage', {
                method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ from, to: agent, content, type: msgType }),
              }));
              delivered++;
            } catch {}
          }
          return { ok: true, deliveredTo: delivered, totalAgents: agents.length };
        } catch { return { ok: false, error: 'Broadcast failed' }; }
      }
      return { ok: false, error: 'A2A not configured' };
    }

    case 'run_jiuwen': {
      const { query, context_id } = args;
      try {
        const { jiuwenDispatch } = await import('../server/integrations.mjs');
        const result = await jiuwenDispatch({ query, contextId: context_id || 'aegis-demo' });
        return { ok: true, mode: result.mode, text: result.text?.slice(0, 2000) || 'No text returned', raw: result.raw };
      } catch (e) {
        return { ok: false, mode: 'ERROR', error: e.message };
      }
    }

    // ── Browserbase Tools (cloud, optional) ──────────────────
    case 'browserbase_search_intel': {
      const bbApiKey = process.env.BROWSERBASE_API_KEY;
      if (!bbApiKey) return { ok: false, error: 'BROWSERBASE_API_KEY not set', mode: 'SIMULATED' };
      const { query, numResults = 5 } = args;
      try {
        const res = await fetch('https://api.browserbase.com/v1/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BB-API-Key': bbApiKey,
          },
          body: JSON.stringify({ query, numResults }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) return { ok: false, error: `Browserbase search ${res.status}`, mode: 'BROWSERBASE' };
        const data = await res.json();
        console.log(`[Browserbase] Search: "${query}" → ${data.results?.length || 0} results`);
        return { ok: true, mode: 'BROWSERBASE', query, results: data.results || [], requestId: data.requestId };
      } catch (e) {
        return { ok: false, error: e.message, mode: 'BROWSERBASE' };
      }
    }

    case 'browserbase_verify_web_target': {
      const bbApiKey = process.env.BROWSERBASE_API_KEY;
      if (!bbApiKey) return { ok: false, error: 'BROWSERBASE_API_KEY not set', mode: 'SIMULATED' };
      const { url, task, solveCaptchas = true, verified = true } = args;
      try {
        const res = await fetch('https://api.browserbase.com/v1/agents/runs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BB-API-Key': bbApiKey,
          },
          body: JSON.stringify({
            task: `Navigate to ${url}. ${task}`,
            browserSettings: { solveCaptchas, verified },
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
        if (!res.ok) return { ok: false, error: `Browserbase agent ${res.status}`, mode: 'BROWSERBASE', runId: null };
        const data = await res.json();
        console.log(`[Browserbase] Verify: ${url} → runId: ${data.runId}, status: ${data.status}`);
        return { ok: true, mode: 'BROWSERBASE', runId: data.runId, status: data.status, task: data.task };
      } catch (e) {
        return { ok: false, error: e.message, mode: 'BROWSERBASE' };
      }
    }

    case 'browserbase_fetch_page': {
      const bbApiKey = process.env.BROWSERBASE_API_KEY;
      if (!bbApiKey) return { ok: false, error: 'BROWSERBASE_API_KEY not set', mode: 'SIMULATED' };
      const { url, allowRedirects = true, proxies = false } = args;
      try {
        const res = await fetch('https://api.browserbase.com/v1/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BB-API-Key': bbApiKey,
          },
          body: JSON.stringify({ url, allowRedirects, proxies }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) return { ok: false, error: `Browserbase fetch ${res.status}`, mode: 'BROWSERBASE' };
        const data = await res.json();
        console.log(`[Browserbase] Fetch: ${url} → ${data.statusCode}, ${data.content?.length || 0} bytes`);
        return { ok: true, mode: 'BROWSERBASE', url, statusCode: data.statusCode, contentType: data.contentType, content: (data.content || '').slice(0, 5000) };
      } catch (e) {
        return { ok: false, error: e.message, mode: 'BROWSERBASE' };
      }
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
