export const POLICIES = [
  { id:'pol-isolation', name:'Production Host Isolation', action:'network.isolate', minimumConfidence:.85, allowedRoles:['executor'], humanRequired:true, enabled:true },
  { id:'pol-cred-rotation', name:'Credential Rotation', action:'credential.rotate', minimumConfidence:.80, allowedRoles:['executor'], humanRequired:true, enabled:true },
  { id:'pol-power', name:'Power Control', action:'power.cut', minimumConfidence:.95, allowedRoles:['executor'], humanRequired:true, enabled:true },
  { id:'pol-account-disable', name:'Account Disable', action:'account.disable', minimumConfidence:.90, allowedRoles:['executor'], humanRequired:true, enabled:true },
  { id:'pol-restart', name:'Production Restart', action:'service.restart', minimumConfidence:.85, allowedRoles:['executor'], humanRequired:true, enabled:true },
  { id:'pol-readonly', name:'Read-only Investigation', action:'telemetry.read', minimumConfidence:0, allowedRoles:['telemetry','security','network','change'], humanRequired:false, enabled:true },
];
export const RISK_LEVELS = ['LOW','MEDIUM','HIGH','CRITICAL'];
export const roleKeyFromAgentKey = key => String(key||'').split('-')[0];
export function evaluateAuthorization(agent, request) {
  const checks=[];
  const agentRegistered=!!agent && !agent.quarantined && agent.status!=='QUARANTINED';
  checks.push({name:'agent_identity',pass:agentRegistered,detail:agent?(agentRegistered?`Agent ${agent.agent_key} registered, trust ${agent.trust_score}`:`Agent ${agent.agent_key} is quarantined`):'Agent not registered in governed fleet'});
  const policy=POLICIES.find(p=>p.enabled&&p.action===request.action);
  checks.push({name:'policy_found',pass:!!policy,detail:policy?`Matched policy ${policy.id}`:`No enabled policy authorizes ${request.action}`});
  const role=agent?roleKeyFromAgentKey(agent.agent_key):'unknown';
  const roleAllowed=!!policy&&policy.allowedRoles.includes(role);
  checks.push({name:'role_allowed',pass:roleAllowed,detail:policy?(roleAllowed?`Role ${role} allowed`:`Role ${role} not allowed; expected ${policy.allowedRoles.join(', ')}`):'No policy'});
  const confidence=Number(request.verifierConfidence)||0;
  const confidenceOk=!!policy&&confidence>=policy.minimumConfidence;
  checks.push({name:'confidence_sufficient',pass:confidenceOk,detail:policy?`${Math.round(confidence*100)}% vs ${Math.round(policy.minimumConfidence*100)}% minimum`:'No policy'});
  const failed=checks.find(c=>!c.pass);
  if(failed) return {status:'BLOCKED',reason:`${failed.name}: ${failed.detail}`,checks};
  const humanRequired=request.humanRequired!==false && policy.humanRequired;
  checks.push({name:'human_authorization',pass:true,detail:humanRequired?'Human approval required':'No human approval required'});
  return {status:humanRequired?'APPROVAL_REQUIRED':'APPROVED',reason:humanRequired?'Automated checks passed — awaiting dual-control approval':'All checks passed',checks};
}
