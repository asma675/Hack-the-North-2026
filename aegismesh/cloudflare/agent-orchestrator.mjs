// AegisMesh Autonomous Agent — the "brain" of the system.
// Uses an Agents SDK-compatible tool-calling loop to:
//   1. Understand user goals
//   2. Decompose into agent tasks
//   3. Dispatch via Durable Objects / Queues
//   4. Monitor progress
//   5. Synthesize findings and deliver answers
//
// Can be used with @cloudflare/agents Agent class or standalone.
import { TOOL_SCHEMAS, executeTool } from './agent-tools.mjs';

export class AegisOrchestrator {
  constructor(env) {
    this.env = env;
    this.maxSteps = 10;
    this.model = process.env.AGENT_MODEL || 'gpt-5.6-terra';
    this.systemPrompt = `You are the AegisMesh Orchestrator — the central intelligence coordinating a fleet of 7 specialized AI agents investigating security incidents.

AVAILABLE AGENTS:
- commander-01 (Swarm Commander): Coordinates all agents, assigns tasks, makes final decisions
- security-02 (Security Agent): Auth scans, threat intel, IP reputation
- network-01 (Network Agent): Traffic analysis, topology mapping, isolation proposals
- telemetry-03 (Telemetry Agent): CPU/memory/disk/process monitoring
- change-01 (Change Agent): Deployment tracking, maintenance window analysis
- skeptic-01 (Adversarial Reviewer): Challenges hypotheses, finds flaws in reasoning
- verifier-01 (Evidence Judge): Evidence adjudication, counterfactual analysis, remediation

YOUR TOOLS:
- list_agents: See all agents and their capabilities
- query_agent: Get details about a specific agent
- dispatch_task: Send a task to an agent (returns task_id to monitor)
- get_task_status: Check task progress
- get_system_health: Check all services
- get_incident: Get incident details
- synthesize_findings: Combine agent results into a verdict
- run_scenario: Trigger a full BREACH or FALSE_ALARM investigation

REASONING RULES:
1. Always list_agents first to understand availability
2. Match tasks to agents by their roles/permissions
3. Use dispatch_task for each investigation step
4. Poll get_task_status until tasks complete (max ${this.maxSteps} steps total)
5. Use synthesize_findings when you have enough data
6. Be concise but thorough — each step must produce value
7. If blocked, try a different agent or escalate to commander-01
8. NEVER fabricate results — only report what agents actually found`;
  }

  // Run the agent autonomously — returns a stream of reasoning steps
  async *run(userMessage, signal) {
    const steps = [];
    let currentMessage = userMessage;

    yield { type: 'status', message: '🧠 Analyzing goal...' };

    // Step 1: List available agents
    const agents = await this.executeTool('list_agents', {}, signal);
    steps.push({ type: 'observation', tool: 'list_agents', result: agents });
    yield { type: 'step', step: 1, message: `Found ${agents.count} agents in fleet`, agents: agents.agents };

    // Step 2: Analyze goal and create a plan
    const plan = this.createPlan(userMessage, agents);
    steps.push({ type: 'plan', plan });
    yield { type: 'step', step: 2, message: `Created plan with ${plan.length} steps`, plan };

    // Step 3: Execute plan — dispatch tasks to agents
    let step = 3;
    for (const task of plan) {
      if (signal?.aborted) break;

      yield { type: 'status', message: `⏳ Step ${step}: ${task.description}` };

      const result = await this.executeTool('dispatch_task', {
        agent_key: task.agent_key,
        task: task.description,
        priority: task.priority,
      }, signal);
      steps.push({ type: 'tool_result', tool: 'dispatch_task', result });
      yield { type: 'step', step, message: `Dispatched to ${task.agent_key}`, taskId: result.taskId };

      // Step 4: Monitor task progress (with timeout)
      const taskStatus = await this.pollTask(result.taskId, signal);
      steps.push({ type: 'task_status', taskId: result.taskId, status: taskStatus });

      // Store task result in KV for later synthesis
      if (this.env.AEGIS_KV) {
        await this.env.AEGIS_KV.put(`task:${result.taskId}`, JSON.stringify({
          ...result,
          status: taskStatus,
          completedAt: Date.now(),
        }));
      }

      step++;
      if (step > this.maxSteps) break;
    }

    // Step 5: Synthesize findings
    const agentIds = plan.map(t => t.agent_key);
    yield { type: 'status', message: '🧠 Synthesizing findings...' };

    const synthesis = await this.executeTool('synthesize_findings', {
      agent_ids: agentIds,
      question: userMessage,
    }, signal);
    steps.push({ type: 'synthesis', result: synthesis });

    yield { type: 'step', step, message: 'Analysis complete', synthesis };

    return { steps, summary: synthesis.summary, synthesis };
  }

  // Create a task plan by matching user intent to agent capabilities
  createPlan(userMessage, agents) {
    const msg = userMessage.toLowerCase();
    const plan = [];

    if (msg.includes('investigate') || msg.includes('incident') || msg.includes('breach') || msg.includes('attack')) {
      plan.push({ agent_key: 'commander-01', description: 'Coordinate investigation of the incident — assess scope, assign roles, and establish investigation framework', priority: 'CRITICAL' });
      plan.push({ agent_key: 'telemetry-03', description: 'Scan system telemetry for anomalies — CPU spikes, memory pressure, unexpected processes, disk activity', priority: 'HIGH' });
      plan.push({ agent_key: 'security-02', description: 'Run security assessment — check for unauthorized access, threat indicators, authentication anomalies', priority: 'HIGH' });
      plan.push({ agent_key: 'network-01', description: 'Analyze network activity — identify unusual connections, data exfiltration attempts, topology changes', priority: 'HIGH' });
      plan.push({ agent_key: 'skeptic-01', description: 'Challenge all findings — identify assumptions, alternative explanations, and gaps in evidence', priority: 'MEDIUM' });
      plan.push({ agent_key: 'verifier-01', description: 'Adjudicate evidence and provide verdict with confidence score and recommended remediation', priority: 'HIGH' });
      if (plan.some(p => p.agent_key === 'executor-01')) {
        plan.push({ agent_key: 'executor-01', description: 'Prepare execution plan for recommended remediation actions', priority: 'MEDIUM' });
      }
    } else if (msg.includes('monitor') || msg.includes('watch') || msg.includes('status')) {
      plan.push({ agent_key: 'telemetry-03', description: 'Provide current system health monitoring snapshot', priority: 'MEDIUM' });
      plan.push({ agent_key: 'security-02', description: 'Check security posture and active threats', priority: 'MEDIUM' });
      plan.push({ agent_key: 'commander-01', description: 'Summarize overall fleet status and flag any concerns', priority: 'MEDIUM' });
    } else if (msg.includes('scenario')) {
      plan.push({ agent_key: 'commander-01', description: 'Coordinate scenario execution across all agents', priority: 'CRITICAL' });
    } else {
      // Default: investigate with a broad scope
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
        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          return status;
        }
      } catch {}
    }
    return { status: 'TIMEOUT', taskId };
  }

  async executeTool(toolName, args, signal) {
    return executeTool(toolName, args, this.env);
  }
}

// Agent-compatible run function for @cloudflare/agents integration.
// When the SDK is available, the Agent class calls this for each user message.
export async function runAgent(userMessage, env) {
  const orchestrator = new AegisOrchestrator(env);
  const result = await orchestrator.run(userMessage, { signal: AbortSignal.timeout(60000) });
  return result;
}

// Stream-compatible version for Server-Sent Events or streaming responses
export async function streamAgent(userMessage, env) {
  const orchestrator = new AegisOrchestrator(env);
  return orchestrator.run(userMessage, { signal: AbortSignal.timeout(60000) });
}
