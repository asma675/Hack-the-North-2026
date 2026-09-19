// AegisMesh Autonomous Agent — the "brain" of the system.
// Decomposes goals, dispatches tasks, monitors progress, synthesizes findings.
import { TOOL_SCHEMAS, executeTool } from './agent-tools.mjs';

export class AegisOrchestrator {
  constructor(env) {
    this.env = env;
    this.maxSteps = 10;
    this.model = process.env.AGENT_MODEL || 'gpt-5.6-terra';
    this.systemPrompt = `You are the AegisMesh Orchestrator — the central intelligence coordinating a fleet of 7 specialized AI agents investigating security incidents.

AVAILABLE AGENTS:
- commander-01 (Swarm Commander): Coordinates all agents, assigns roles, makes final decisions
- security-02 (Security Agent): Auth scans, threat intel, IP reputation
- network-01 (Network Agent): Traffic analysis, topology mapping, isolation proposals
- telemetry-03 (Telemetry Agent): CPU/memory/disk/process monitoring
- change-01 (Change Agent): Deployment tracking, maintenance window analysis
- skeptic-01 (Adversarial Reviewer): Challenges hypotheses, finds flaws in reasoning
- verifier-01 (Evidence Judge): Evidence adjudication, counterfactual analysis, remediation
- executor-01 (Controlled Executor): Executes authorized actions with capability verification

YOUR TOOLS:
- list_agents, query_agent, dispatch_task, get_task_status, get_system_health
- get_incident, synthesize_findings, run_scenario
- list_skills, find_skills_for_task — discover what agents can do
- a2a_send, a2a_get_messages, a2a_broadcast — direct agent-to-agent communication
- run_jiuwen — dispatch to JiuwenSwarm/WorkSwarm for complex decomposition
- browserbase_search_intel, browserbase_fetch_page, browserbase_verify_web_target — external web verification (BROWSERBASE_API_KEY required)

EXTERNAL VERIFICATION RULE: When incidents involve suspicious domains, CVEs, vendor trust centers, or zero-day exploits:
1. FIRST dispatch browserbase_search_intel to find public intel and related CVEs
2. THEN dispatch browserbase_fetch_page to retrieve page content reliably
3. THEN dispatch browserbase_verify_web_target to inspect behind anti-bot walls
4. THEN local agents synthesize all evidence

REASONING RULES:
1. Always list_agents first to understand availability
2. find_skills_for_task to match skills to the goal
3. list_skills if skills are relevant — use them to guide agent selection
4. Match tasks to agents by their roles/permissions/skills
5. For complex investigations, call run_jiuwen BEFORE dispatching individual tasks
6. Use dispatch_task for each investigation step
7. Poll get_task_status until tasks complete (max ${this.maxSteps} steps total)
8. Use a2a_send when agents need to share findings directly
9. Use synthesize_findings when you have enough data
10. Be concise but thorough — each step must produce value
11. NEVER fabricate results — only report what agents actually found`;
  }

  async *run(userMessage, signal) {
    const steps = [];
    yield { type: 'status', message: '🧠 Analyzing goal...' };

    // Step 1: List agents
    const agents = await this.executeTool('list_agents', {}, signal);
    steps.push({ type: 'observation', tool: 'list_agents', result: agents });
    yield { type: 'step', step: 1, message: `Found ${agents.count} agents in fleet`, agents: agents.agents };

    // Step 2: Discover relevant skills
    const skills = await this.executeTool('find_skills_for_task', { task_description: userMessage }, signal);
    steps.push({ type: 'observation', tool: 'find_skills_for_task', result: skills });
    if (skills.matched?.length > 0) {
      yield { type: 'step', step: 2, message: `Found ${skills.matched.length} relevant skills: ${skills.matched.map(m => m.name).join(', ')}`, skills: skills.matched };
    }

    // Step 3: Check if JiuwenSwarm should handle this
    const useJiuwen = userMessage.toLowerCase().includes('investigate') ||
      userMessage.toLowerCase().includes('decompose') ||
      userMessage.toLowerCase().includes('complex') ||
      skills.matched?.length >= 4;

    if (useJiuwen) {
      yield { type: 'status', message: '🔀 Dispatching to JiuwenSwarm for decomposition...' };
      const jiuwen = await this.executeTool('run_jiuwen', { query: userMessage, context_id: 'aegis-demo' }, signal);
      steps.push({ type: 'tool_result', tool: 'run_jiuwen', result: jiuwen });
      if (jiuwen.ok && jiuwen.mode === 'LIVE') {
        yield { type: 'step', step: 3, message: 'JiuwenSwarm decomposition received', summary: jiuwen.text?.slice(0, 200) };
      }
    }

    // Step 4: Create plan
    const plan = this.createPlan(userMessage, agents, skills.matched || []);
    steps.push({ type: 'plan', plan });
    yield { type: 'step', step: plan.length + (useJiuwen ? 3 : 2), message: `Created plan with ${plan.length} steps`, plan };

    // Step 5: Execute plan
    let step = plan.length + (useJiuwen ? 4 : 3);
    for (const task of plan) {
      if (signal?.aborted) break;
      yield { type: 'status', message: `⏳ Step: ${task.description}` };

      const result = await this.executeTool('dispatch_task', {
        agent_key: task.agent_key,
        task: task.description,
        priority: task.priority,
      }, signal);
      steps.push({ type: 'tool_result', tool: 'dispatch_task', result });
      yield { type: 'step', step, message: `Dispatched to ${task.agent_key}`, taskId: result.taskId };

      const taskStatus = await this.pollTask(result.taskId, signal);
      steps.push({ type: 'task_status', taskId: result.taskId, status: taskStatus });

      if (this.env.AEGIS_KV) {
        await this.env.AEGIS_KV.put(`task:${result.taskId}`, JSON.stringify({
          ...result, status: taskStatus, completedAt: Date.now(),
        }));
      }

      step++;
      if (step > this.maxSteps) break;
    }

    // Step 6: Synthesize findings
    const agentIds = plan.map(t => t.agent_key);
    yield { type: 'status', message: '🧠 Synthesizing findings...' };

    const synthesis = await this.executeTool('synthesize_findings', {
      agent_ids: agentIds, question: userMessage,
    }, signal);
    steps.push({ type: 'synthesis', result: synthesis });
    yield { type: 'step', step, message: 'Analysis complete', synthesis };

    return { steps, summary: synthesis.summary, synthesis, jiuwenUsed: useJiuwen };
  }

  createPlan(userMessage, agents, matchedSkills) {
    const msg = userMessage.toLowerCase();
    const plan = [];
    const skillAgents = new Set(matchedSkills.map(s => s.agent));
    const needsBrowserbase = msg.includes('http') || msg.includes('url') || msg.includes('domain') ||
      msg.includes('cve') || msg.includes('soc 2') || msg.includes('trust center') ||
      msg.includes('vendor') || msg.includes('patch') || msg.includes('advisory') ||
      msg.includes('zero-day') || msg.includes('website') || msg.includes('web') ||
      msg.includes('fetch') || msg.includes('search') || msg.includes('investigate');

    if (msg.includes('investigate') || msg.includes('incident') || msg.includes('breach') || msg.includes('attack')) {
      plan.push({ agent_key: 'commander-01', description: 'Coordinate investigation — assess scope, assign roles, establish framework', priority: 'CRITICAL' });
      plan.push({ agent_key: 'telemetry-03', description: 'Scan system telemetry for anomalies', priority: 'HIGH' });
      plan.push({ agent_key: 'security-02', description: 'Run security assessment — check for unauthorized access', priority: 'HIGH' });
      plan.push({ agent_key: 'network-01', description: 'Analyze network activity — unusual connections, exfiltration', priority: 'HIGH' });
      if (needsBrowserbase) {
        plan.push({ agent_key: 'verifier-01', description: 'BROWSERBASE: Search web for threat intel and related CVEs', priority: 'HIGH' });
        plan.push({ agent_key: 'verifier-01', description: 'BROWSERBASE: Fetch reliable page content from suspicious targets', priority: 'HIGH' });
        plan.push({ agent_key: 'verifier-01', description: 'BROWSERBASE: Verify external vendor/security pages behind anti-bot', priority: 'HIGH' });
      }
      plan.push({ agent_key: 'skeptic-01', description: 'Challenge all findings — identify assumptions and gaps', priority: 'MEDIUM' });
      plan.push({ agent_key: 'verifier-01', description: 'Adjudicate evidence — verdict with confidence and remediation', priority: 'HIGH' });
    } else if (msg.includes('monitor') || msg.includes('watch') || msg.includes('status')) {
      plan.push({ agent_key: 'telemetry-03', description: 'Provide current system health monitoring snapshot', priority: 'MEDIUM' });
      plan.push({ agent_key: 'security-02', description: 'Check security posture and active threats', priority: 'MEDIUM' });
      plan.push({ agent_key: 'commander-01', description: 'Summarize overall fleet status and flag concerns', priority: 'MEDIUM' });
    } else if (msg.includes('skill') || msg.includes('capability')) {
      const relevant = matchedSkills.slice(0, 5);
      return relevant.map(s => ({
        agent_key: s.agent,
        description: `Execute skill: ${s.name} — ${s.description}`,
        priority: 'MEDIUM',
      }));
    } else {
      plan.push({ agent_key: 'commander-01', description: `Investigate: ${userMessage}`, priority: 'HIGH' });
      plan.push({ agent_key: 'security-02', description: `Security perspective on: ${userMessage}`, priority: 'HIGH' });
      plan.push({ agent_key: 'telemetry-03', description: `Telemetry analysis for: ${userMessage}`, priority: 'MEDIUM' });
    }

    return plan;
  }

  async pollTask(taskId, signal, maxPolls = 5, delayMs = 500) {
    for (let i = 0; i < maxPolls; i++) {
      if (signal?.aborted) return { status: 'CANCELLED' };
      await new Promise(r => setTimeout(r, delayMs));
      try {
        const status = await this.executeTool('get_task_status', { task_id: taskId }, signal);
        if (status.status === 'COMPLETED' || status.status === 'FAILED') return status;
      } catch {}
    }
    return { status: 'TIMEOUT', taskId };
  }

  async executeTool(toolName, args, signal) {
    return executeTool(toolName, args, this.env);
  }
}

export async function runAgent(userMessage, env) {
  const orchestrator = new AegisOrchestrator(env);
  return await orchestrator.run(userMessage, { signal: AbortSignal.timeout(60000) });
}

export async function* streamAgent(userMessage, env) {
  const orchestrator = new AegisOrchestrator(env);
  yield* orchestrator.run(userMessage, { signal: AbortSignal.timeout(60000) });
}
