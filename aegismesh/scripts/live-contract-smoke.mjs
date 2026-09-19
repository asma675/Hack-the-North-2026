import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const mockPort=8810, apiPort=8798, dataFile='/tmp/vanguard-live-contract-smoke.json';
try{fs.unlinkSync(dataFile);}catch{}

const read=req=>new Promise((resolve,reject)=>{let b='';req.on('data',d=>b+=d);req.on('end',()=>{try{resolve(b?JSON.parse(b):{})}catch(e){reject(e)}});req.on('error',reject)});
const send=(res,obj,status=200)=>{const b=JSON.stringify(obj);res.writeHead(status,{'content-type':'application/json','content-length':Buffer.byteLength(b)});res.end(b)};
const mock=http.createServer(async(req,res)=>{
  if(req.url==='/v1/responses'&&req.method==='POST'){
    await read(req);
    return send(res,{output_text:JSON.stringify({verdict:'Credential compromise with possible data exfiltration',confidence:.94,reason:'Auth anomaly plus novel outbound destination outweighs backup explanation.',recommended:'network.isolate',hypotheses:[{title:'Credential compromise',confidence:.94},{title:'Normal backup',confidence:.12}],counterfactuals:[{option:'NETWORK ISOLATION',containment:'HIGH',forensics:'HIGH',impact:'MEDIUM'}]})});
  }
  if(req.url==='/a2a'&&req.method==='POST'){
    const body=await read(req); assert.equal(body.method,'SendMessage');
    return send(res,{jsonrpc:'2.0',id:body.id,result:{artifacts:[{name:'response',parts:[{text:'Commander decomposed the incident. Security found suspicious logins; Network found a novel outbound destination; Skeptic rejected backup-only explanation.'}]}]}});
  }
  if(req.url==='/authorize'&&req.method==='POST'){
    const b=await read(req); const role=String(b.agent_key||'').split('-')[0];
    if(role!=='executor')return send(res,{status:'BLOCKED',reason:'role_allowed: false',checks:[{name:'role_allowed',pass:false}]});
    return send(res,{status:'APPROVAL_REQUIRED',reason:'Cloudflare mock gate passed',checks:[{name:'role_allowed',pass:true},{name:'human_authorization',pass:true}]});
  }
  send(res,{error:'not found'},404);
});
await new Promise(r=>mock.listen(mockPort,'127.0.0.1',r));

const api=spawn(process.execPath,['server/dev-api.mjs'],{env:{...process.env,API_PORT:String(apiPort),AUTH_SECRET:'live-smoke-secret',DATA_FILE:dataFile,OPENAI_API_KEY:'test',OPENAI_API_BASE:`http://127.0.0.1:${mockPort}/v1`,JIUWEN_A2A_URL:`http://127.0.0.1:${mockPort}/a2a`,CLOUDFLARE_GATE_URL:`http://127.0.0.1:${mockPort}`},stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
  await sleep(800);
  let r=await fetch(`http://127.0.0.1:${apiPort}/api/auth/demo`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});assert.equal(r.status,200);const login=await r.json();const H={authorization:`Bearer ${login.access_token}`,'content-type':'application/json'};
  r=await fetch(`http://127.0.0.1:${apiPort}/api/integrations/status`,{headers:H});const integrations=await r.json();assert.equal(integrations.find(x=>x.id==='jiuwen').status,'LIVE');assert.equal(integrations.find(x=>x.id==='openai').status,'LIVE');assert.equal(integrations.find(x=>x.id==='cloudflare').status,'LIVE');
  r=await fetch(`http://127.0.0.1:${apiPort}/api/jiuwen/dispatch`,{method:'POST',headers:H,body:JSON.stringify({query:'Investigate incident'})});const jw=await r.json();assert.equal(jw.mode,'LIVE');assert.match(jw.text,/Security found suspicious logins/);
  r=await fetch(`http://127.0.0.1:${apiPort}/api/ai/verify`,{method:'POST',headers:H,body:JSON.stringify({incident:'test',observations:['failed logins','novel outbound']})});const ai=await r.json();assert.equal(ai.mode,'LIVE');assert.equal(ai.recommended,'network.isolate');assert.equal(ai.confidence,.94);
  r=await fetch(`http://127.0.0.1:${apiPort}/api/functions/authorizeAction`,{method:'POST',headers:H,body:JSON.stringify({request_id:'LIVE-BLOCK',incident_id:'INC-LIVE',agent_key:'telemetry-03',action:'power.cut',target:'victim',risk:'CRITICAL',verifier_confidence:.99,human_required:true})});const blocked=await r.json();assert.equal(blocked.status,'BLOCKED');
  r=await fetch(`http://127.0.0.1:${apiPort}/api/functions/authorizeAction`,{method:'POST',headers:H,body:JSON.stringify({request_id:'LIVE-ALLOW',incident_id:'INC-LIVE',agent_key:'executor-01',action:'network.isolate',target:'victim',risk:'HIGH',verifier_confidence:.94,human_required:true})});const allowed=await r.json();assert.equal(allowed.status,'APPROVAL_REQUIRED');
  console.log('Vanguard live-provider contract smoke test: PASS');
} finally {
  api.kill('SIGTERM');
  await new Promise(r=>mock.close(r));
}
