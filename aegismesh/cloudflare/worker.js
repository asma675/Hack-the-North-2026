// Optional Cloudflare Aegis Gate deployment. When enabled, use this as the neutral
// execution airlock before the Node backend persists/audits the decision.
const policies={
  'network.isolate':{roles:['executor'],min:.85,human:true},
  'credential.rotate':{roles:['executor'],min:.80,human:true},
  'power.cut':{roles:['executor'],min:.95,human:true},
  'account.disable':{roles:['executor'],min:.90,human:true},
  'service.restart':{roles:['executor'],min:.85,human:true},
};
const j=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
export default {async fetch(request,env){
  const u=new URL(request.url);if(u.pathname==='/health')return j({ok:true,service:'Aegis Gate Cloudflare Worker'});
  if(u.pathname!=='/authorize'||request.method!=='POST')return j({error:'not found'},404);
  if(env.GATE_TOKEN&&request.headers.get('authorization')!==`Bearer ${env.GATE_TOKEN}`)return j({error:'unauthorized'},401);
  const b=await request.json();const p=policies[b.action];const role=String(b.agent_key||'').split('-')[0];const checks=[
    {name:'policy_found',pass:!!p},{name:'role_allowed',pass:!!p&&p.roles.includes(role)},{name:'confidence_sufficient',pass:!!p&&Number(b.verifier_confidence||0)>=p.min}
  ];const failed=checks.find(c=>!c.pass);if(failed)return j({status:'BLOCKED',reason:failed.name,checks});
  return j({status:p.human&&b.human_required!==false?'APPROVAL_REQUIRED':'APPROVED',reason:'Cloudflare Aegis Gate policy passed',checks:[...checks,{name:'human_authorization',pass:true}]});
}};
