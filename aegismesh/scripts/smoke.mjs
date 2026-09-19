import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
try { fs.unlinkSync('/tmp/aegismesh-smoke.json'); } catch {}
const api=spawn(process.execPath,['server/dev-api.mjs'],{env:{...process.env,API_PORT:'8799',AUTH_SECRET:'smoke-secret',DATA_FILE:'/tmp/aegismesh-smoke.json'},stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await sleep(900);
 let r=await fetch('http://127.0.0.1:8799/api/health');assert.equal(r.status,200);const health=await r.json();assert.equal(health.ok,true);
 r=await fetch('http://127.0.0.1:8799/api/waitlist',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'smoke@example.com',company:'Aegis Test'})});assert.equal(r.status,201);
 r=await fetch('http://127.0.0.1:8799/api/auth/demo',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});const login=await r.json();assert.ok(login.access_token);
 const H={authorization:`Bearer ${login.access_token}`,'content-type':'application/json'};
 r=await fetch('http://127.0.0.1:8799/api/integrations/status',{headers:H});assert.equal(r.status,200);
 r=await fetch('http://127.0.0.1:8799/api/jiuwen/dispatch',{method:'POST',headers:H,body:JSON.stringify({query:'smoke test'})});assert.equal(r.status,200);const jw=await r.json();assert.equal(jw.mode,'SIMULATED');
 r=await fetch('http://127.0.0.1:8799/api/ai/verify',{method:'POST',headers:H,body:JSON.stringify({incident:'smoke'})});assert.equal(r.status,200);const ai=await r.json();assert.equal(ai.mode,'SIMULATED');
 r=await fetch('http://127.0.0.1:8799/api/edge/status',{headers:H});assert.equal(r.status,200);const edgeStatus=await r.json();assert.equal(edgeStatus.mode,'SIMULATED');
 r=await fetch('http://127.0.0.1:8799/api/edge/test',{method:'POST',headers:H,body:JSON.stringify({test:'LED'})});assert.equal(r.status,200);const edgeTest=await r.json();assert.equal(edgeTest.mode,'SIMULATED');
 r=await fetch('http://127.0.0.1:8799/api/functions/authorizeAction',{method:'POST',headers:H,body:JSON.stringify({request_id:'SMOKE-1',incident_id:'INC-SMOKE',agent_key:'telemetry-03',action:'power.cut',target:'victim',risk:'CRITICAL',verifier_confidence:.4,human_required:true})});const blocked=await r.json();assert.equal(blocked.status,'BLOCKED');assert.equal(blocked.quarantined,true);
 r=await fetch('http://127.0.0.1:8799/api/functions/authorizeAction',{method:'POST',headers:H,body:JSON.stringify({request_id:'SMOKE-2',incident_id:'INC-SMOKE',agent_key:'executor-01',action:'network.isolate',target:'victim',risk:'HIGH',verifier_confidence:.94,human_required:true})});const pending=await r.json();assert.equal(pending.status,'APPROVAL_REQUIRED');
 r=await fetch('http://127.0.0.1:8799/api/functions/recordApproval',{method:'POST',headers:H,body:JSON.stringify({request_id:'SMOKE-2',decision:'APPROVED',method:'NFC',nfc_badge_id:'SMOKE-BADGE'})});const approval=await r.json();assert.ok(approval.capability?.signature);assert.equal(approval.capability.command,'network.isolate');
 r=await fetch('http://127.0.0.1:8799/api/entities/ActionRequest?filter='+encodeURIComponent(JSON.stringify({request_id:'SMOKE-2'})),{headers:H});assert.equal(r.status,200);const actions=await r.json();assert.equal(actions.length,1);assert.equal(actions[0].status,'APPROVED');
 console.log('AegisMesh full-stack backend smoke test: PASS');
} finally { api.kill('SIGTERM'); }
