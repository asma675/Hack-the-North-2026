// Tool definitions for the AegisMesh autonomous orchestrator agent.
// Each tool has a schema compatible with @cloudflare/agents tool-calling protocol.

export const TOOL_SCHEMAS = [
  {
    name: 'list_agents',
    description: 'List all available agents in the fleet with their roles, status, trust scores, and capabilities. Use this when you need to know who is available for a task.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'query_agent',
    description: 'Get detailed status, capabilities, trust score, and recent activity of a specific agent. Pass the agent_key (e.g. "security-02").',
    parameters: {
      type: 'object',
      properties: {
        agent_key: { type: 'string', description: 'The agent identifier, e.g. security-02' },
      },
      required: ['agent_key'],
    },
  },
  {
    name: 'dispatch_task',
    description: 'Assign a task to a specific agent by agent_key. The agent will process the task asynchronously via Queue. Returns a task_id for monitoring.',
    parameters: {
      type: 'object',
      properties: {
        agent_key: { type: 'string', description: 'The agent identifier to assign the task to' },
        task: { type: 'string', description: 'The task description/instruction for the agent' },
        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], description: 'Task priority level' },
      },
      required: ['agent_key', 'task'],
    },
  },
  {
    name: 'get_task_status',
    description: 'Check the status and result of a dispatched task using its task_id.',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The task ID returned by dispatch_task' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'get_system_health',
    description: 'Check the health status of all AegisMesh services (API, AI providers, edge, integrations).',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_incident',
    description: 'Get details about a specific incident including severity, state, affected assets, and current investigation status.',
    parameters: {
      type: 'object',
      properties: {
        incident_id: { type: 'string', description: 'The incident identifier' },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'synthesize_findings',
    description: 'Combine findings from multiple agents into a comprehensive analysis with a verdict, recommendation, and confidence score. Use this when you have gathered enough information to deliver a final answer.',
    parameters: {
      type: 'object',
      properties: {
        agent_ids: { type: 'array', items: { type: 'string' }, description: 'List of agent IDs whose findings to synthesize' },
        question: { type: 'string', description: 'The question or goal being investigated' },
      },
      required: ['agent_ids', 'question'],
    },
  },
  {
    name: 'run_scenario',
    description: 'Execute a predefined scenario (BREACH or FALSE_ALARM) which triggers the full multi-agent investigation workflow.',
    parameters: {
      type: 'object',
      properties: {
        scenario: { type: 'string', enum: ['BREACH', 'FALSE_ALARM'], description: 'The scenario to run' },
      },
      required: ['scenario'],
    },
  },
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

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function loadAgentState(env) {
  const { loadState } = await import('./kv-store.mjs');
  return loadState();
}
