export const AGENTS = [
  {agent_key:'commander-01',name:'Commander',role:'Swarm Commander',provider:'openJiuwen',permissions:['orchestration.coordinate','task.assign','incident.state'],denied:['network.write','hardware.execute','account.disable'],tools:['swarm.delegate','incident.decompose','task.queue'],trust_score:98,status:'IDLE',violations:0,quarantined:false},
  {agent_key:'telemetry-03',name:'Telemetry Agent',role:'Telemetry Investigator',provider:'openJiuwen',permissions:['telemetry.read','logs.read','metrics.read'],denied:['network.write','hardware.execute','account.disable'],tools:['cpu.probe','mem.probe','disk.scan','process.list'],trust_score:93,status:'IDLE',violations:0,quarantined:false},
  {agent_key:'security-02',name:'Security Agent',role:'Security Investigator',provider:'openJiuwen',permissions:['security.read','logs.read','threatIntel.read'],denied:['network.write','hardware.execute'],tools:['auth.scan','ip.reputation','process.inspect'],trust_score:96,status:'IDLE',violations:0,quarantined:false},
  {agent_key:'network-01',name:'Network Agent',role:'Network Investigator',provider:'openJiuwen',permissions:['network.read','topology.read','connection.read','isolation.propose'],denied:['network.write','hardware.execute'],tools:['net.connections','route.inspect','topology.map'],trust_score:95,status:'IDLE',violations:0,quarantined:false},
  {agent_key:'change-01',name:'Change Agent',role:'Change Investigator',provider:'openJiuwen',permissions:['change.read','deployments.read','maintenance.read'],denied:['network.write','hardware.execute'],tools:['change.search','maintenance.lookup','deployment.diff'],trust_score:97,status:'IDLE',violations:0,quarantined:false},
  {agent_key:'skeptic-01',name:'Skeptic',role:'Adversarial Reviewer',provider:'openJiuwen',permissions:['evidence.read','hypothesis.challenge'],denied:['network.write','hardware.execute'],tools:['claim.challenge','evidence.compare'],trust_score:99,status:'IDLE',violations:0,quarantined:false},
  {agent_key:'verifier-01',name:'Verifier',role:'Evidence Judge',provider:'OpenAI',permissions:['evidence.read','verdict.write','remediation.propose'],denied:['network.write','hardware.execute'],tools:['evidence.adjudicate','counterfactual.simulate','remediation.plan'],trust_score:99,status:'IDLE',violations:0,quarantined:false},
  {agent_key:'executor-01',name:'Executor',role:'Controlled Executor',provider:'Vanguard',permissions:['action.request','network.isolate','credential.rotate'],denied:['unbounded.execute'],tools:['action.propose','capability.consume'],trust_score:99,status:'IDLE',violations:0,quarantined:false},
];

export function freshState(){
  return {
    meta:{schema:1,created_at:new Date().toISOString()},
    users:[], waitlist:[], resetTokens:[],
    entities:{GovernedAgent:AGENTS.map((a,i)=>({id:`agent-${i+1}`,...a,trust_history:[{date:new Date().toISOString(),trust:a.trust_score,reason:'Initial trust'}],created_date:new Date().toISOString()})),Evidence:[],ActionRequest:[],AuditEvent:[],Incident:[],Approval:[],User:[]}
  };
}
