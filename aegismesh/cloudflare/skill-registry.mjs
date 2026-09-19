// Skill Registry — agents declare capabilities as reusable skills stored in KV.
// Skills are discoverable by the orchestrator and other agents.

export const SKILL_CATEGORIES = {
  INVESTIGATION: 'investigation',
  ANALYSIS: 'analysis',
  EXECUTION: 'execution',
  COMMUNICATION: 'communication',
  VERIFICATION: 'verification',
};

// Seed skills for all agents
export const SEED_SKILLS = [
  // Commander skills
  { id: 'cmd-coordinate', name: 'Coordinate Investigation', agent: 'commander-01', category: 'INVESTIGATION', description: 'Coordinate multi-agent investigation, assign roles, synthesize findings', parameters: ['goal', 'priority', 'agent_blacklist'], icon: '⚔' },
  { id: 'cmd-escalate', name: 'Escalate Decision', agent: 'commander-01', category: 'EXECUTION', description: 'Escalate a decision to human dual-control when risk exceeds threshold', parameters: ['action', 'risk_level', 'justification'], icon: '⚔' },

  // Security skills
  { id: 'sec-threat-scan', name: 'Threat Scan', agent: 'security-02', category: 'INVESTIGATION', description: 'Scan for unauthorized access, threat indicators, authentication anomalies', parameters: ['scope', 'depth'], icon: '🛡' },
  { id: 'sec-auth-audit', name: 'Auth Audit', agent: 'security-02', category: 'VERIFICATION', description: 'Audit authentication logs and access patterns', parameters: ['time_window', 'user_filter'], icon: '🛡' },

  // Network skills
  { id: 'net-traffic-analyze', name: 'Traffic Analysis', agent: 'network-01', category: 'ANALYSIS', description: 'Analyze network traffic for unusual connections, data exfiltration', parameters: ['time_window', 'asset_filter'], icon: '🌐' },
  { id: 'net-isolate', name: 'Propose Isolation', agent: 'network-01', category: 'EXECUTION', description: 'Propose network isolation with blast radius analysis', parameters: ['target', 'reason'], icon: '🌐' },

  // Telemetry skills
  { id: 'tel-system-scan', name: 'System Scan', agent: 'telemetry-03', category: 'INVESTIGATION', description: 'Scan CPU, memory, disk, process list for anomalies', parameters: ['scope', 'metric_types'], icon: '📡' },
  { id: 'tel-monitor', name: 'Continuous Monitor', agent: 'telemetry-03', category: 'INVESTIGATION', description: 'Set up continuous monitoring with alert thresholds', parameters: ['metrics', 'thresholds', 'duration'], icon: '📡' },

  // Change skills
  { id: 'chg-diff', name: 'Change Diff', agent: 'change-01', category: 'ANALYSIS', description: 'Analyze recent deployments and configuration changes', parameters: ['time_window', 'scope'], icon: '⚙' },
  { id: 'chg-rollback', name: 'Plan Rollback', agent: 'change-01', category: 'EXECUTION', description: 'Create a rollback plan for risky changes', parameters: ['target_change', 'reason'], icon: '⚙' },

  // Skeptic skills
  { id: 'sck-challenge', name: 'Challenge Hypothesis', agent: 'skeptic-01', category: 'VERIFICATION', description: 'Challenge a hypothesis with counter-evidence and alternative explanations', parameters: ['hypothesis', 'evidence'], icon: '🔍' },
  { id: 'sck-review', name: 'Peer Review', agent: 'skeptic-01', category: 'VERIFICATION', description: 'Review another agent findings for logical flaws', parameters: ['agent_id', 'findings'], icon: '🔍' },

  // Verifier skills
  { id: 'ver-adjudicate', name: 'Adjudicate Evidence', agent: 'verifier-01', category: 'VERIFICATION', description: 'Adjudicate evidence reliability and render verdict', parameters: ['evidence_items', 'question'], icon: '✓' },
  { id: 'ver-counterfactual', name: 'Counterfactual Analysis', agent: 'verifier-01', category: 'ANALYSIS', description: 'Run counterfactual scenarios for remediation options', parameters: ['scenario', 'alternatives'], icon: '✓' },

  // Executor skills
  { id: 'exe-execute', name: 'Execute Action', agent: 'executor-01', category: 'EXECUTION', description: 'Execute an authorized action with capability verification', parameters: ['action', 'capability', 'target'], icon: '⚡' },
  { id: 'exe-propose', name: 'Propose Action', agent: 'executor-01', category: 'EXECUTION', description: 'Propose an action with risk assessment and blast radius', parameters: ['suggested_action', 'context'], icon: '⚡' },
];

// Load skills from KV (or seed if not present)
export async function loadSkills(kv) {
  if (!kv) return SEED_SKILLS;
  const raw = await kv.get('skills:registry');
  if (raw) return JSON.parse(raw);
  await kv.put('skills:registry', JSON.stringify(SEED_SKILLS));
  return SEED_SKILLS;
}

// Register a new skill (for dynamic skill creation)
export async function registerSkill(kv, skill) {
  const skills = await loadSkills(kv);
  if (!skill.id) skill.id = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  skills.push(skill);
  await kv.put('skills:registry', JSON.stringify(skills));
  return skill;
}

// Get skills for a specific agent
export async function getAgentSkills(kv, agentId) {
  const all = await loadSkills(kv);
  return all.filter(s => s.agent === agentId);
}

// Search skills by query
export async function searchSkills(kv, query) {
  const all = await loadSkills(kv);
  const q = query.toLowerCase();
  return all.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q) ||
    s.agent.toLowerCase().includes(q)
  );
}

// Get skills matching a task description (for orchestrator planning)
export async function matchSkills(kv, taskDescription) {
  const all = await loadSkills(kv);
  const desc = taskDescription.toLowerCase();
  return all.filter(s =>
    s.description.toLowerCase().includes(desc.slice(0, 30)) ||
    s.name.toLowerCase().includes(desc.slice(0, 20)) ||
    s.parameters.some(p => desc.includes(p.toLowerCase()))
  ).slice(0, 5);
}
