function extractResponseText(data){
  if(typeof data?.output_text==='string') return data.output_text;
  const chunks=[]; for(const item of data?.output||[]) for(const c of item?.content||[]) if(typeof c?.text==='string') chunks.push(c.text); return chunks.join('\n');
}

function parseJsonLoose(text){
  const cleaned=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  return JSON.parse(cleaned);
}

function extractA2AText(value){
  const chunks=[]; const seen=new Set();
  const visit=v=>{
    if(v==null)return;
    if(typeof v==='string')return;
    if(typeof v!=='object'||seen.has(v))return;
    seen.add(v);
    if(typeof v.text==='string'&&v.text.trim())chunks.push(v.text.trim());
    if(Array.isArray(v))for(const x of v)visit(x);else for(const [k,x] of Object.entries(v))if(k!=='text')visit(x);
  };
  visit(value);
  return [...new Set(chunks)].join('\n').slice(0,8000);
}
export async function openAIVerify(payload){
  if(!process.env.OPENAI_API_KEY) return {mode:'SIMULATED',verdict:'Credential compromise with possible data exfiltration',confidence:.93,reason:'Backup explains resource usage but not the successful login after failures or new outbound destination.',recommended:'network.isolate',hypotheses:[{title:'Credential compromise',confidence:.93},{title:'Possible exfiltration',confidence:.81},{title:'Normal backup',confidence:.14}],counterfactuals:[{option:'POWER OFF SERVER',containment:'HIGH',forensics:'LOW',impact:'CRITICAL'},{option:'NETWORK ISOLATION',containment:'HIGH',forensics:'HIGH',impact:'MEDIUM'},{option:'OBSERVE ONLY',containment:'LOW',forensics:'HIGH',impact:'LOW'}]};
  const model=process.env.OPENAI_MODEL||'gpt-5.6-terra';
  const system='You are the Aegis Evidence Court. Adjudicate competing incident hypotheses. Prefer evidence-backed, least-destructive remediation. Return ONLY compact JSON with keys verdict, confidence (0-1), reason, recommended, hypotheses (array of title and confidence), counterfactuals (array of option, containment, forensics, impact).';
  const openaiBase=(process.env.OPENAI_API_BASE||'https://api.openai.com/v1').replace(/\/$/,'');
  const r=await fetch(`${openaiBase}/responses`,{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(Number(process.env.OPENAI_TIMEOUT_MS||20000)),body:JSON.stringify({model,max_output_tokens:Number(process.env.OPENAI_MAX_OUTPUT_TOKENS||1400),input:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}]})});
  if(!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0,300)}`);
  const data=await r.json(); const text=extractResponseText(data).trim();
  try{ return {mode:'LIVE',...parseJsonLoose(text)}; }catch{ return {mode:'LIVE',verdict:'Evidence reviewed',confidence:.8,reason:text,recommended:'request_more_evidence',counterfactuals:[]}; }
}

export async function jiuwenDispatch({query,contextId='aegis-demo'}){
  const url=process.env.JIUWEN_A2A_URL;
  if(!url) return {mode:'SIMULATED',text:'Jiuwen swarm decomposed the incident across telemetry, security, network, change, and skeptic roles.'};
  const id=`aegis-${Date.now()}`;
  const body={jsonrpc:'2.0',id,method:'SendMessage',params:{message:{messageId:id,contextId,role:'ROLE_USER',parts:[{text:query}]}}};
  const headers={'Content-Type':'application/json'}; if(process.env.JIUWEN_A2A_TOKEN) headers.Authorization=`Bearer ${process.env.JIUWEN_A2A_TOKEN}`;
  const r=await fetch(url,{method:'POST',headers,signal:AbortSignal.timeout(Number(process.env.JIUWEN_TIMEOUT_MS||20000)),body:JSON.stringify(body)}); if(!r.ok) throw new Error(`openJiuwen ${r.status}: ${(await r.text()).slice(0,300)}`); const data=await r.json();
  const text=extractA2AText(data.result??data)||JSON.stringify(data.result??data).slice(0,8000);
  return {mode:'LIVE',text,raw:data};
}

export function integrationStatus(){
  return [
    {id:'jiuwen',provider:'Huawei openJiuwen / WorkSwarm',status:process.env.JIUWEN_A2A_URL?'LIVE':'SIMULATED',features:['Multi-agent orchestration','A2A gateway','Task decomposition']},
    {id:'openai',provider:'OpenAI',status:process.env.OPENAI_API_KEY?'LIVE':'SIMULATED',features:['Evidence Court','Counterfactual reasoning','Safe remediation']},
    {id:'cloudflare',provider:'Cloudflare Aegis Gate',status:process.env.CLOUDFLARE_GATE_URL?'LIVE':'LOCAL',features:['Worker policy gate','Zero-trust authorization','Deny-by-default enforcement']},
    {id:'edge',provider:'Aegis Edge',status:process.env.EDGE_DEVICE_URL?'LIVE':'SIMULATED',features:['NFC approval','Capability verification','Relay enforcement']},
    {id:'omni',provider:'Huawei OMNI',status:process.env.OMNI_API_URL?'LIVE':'SIMULATED',features:['Vision','Speech','Language']},
    {id:'sentry',provider:'Sentry',status:process.env.SENTRY_DSN?'LIVE':'DISCONNECTED',features:['Tracing','Logs','Agent observability']},
  ];
}
