import { useEffect,useState,useCallback,useContext,createContext } from 'react';
import { base44 } from '@/api/base44Client';
import { engine,SCENARIO } from '@/lib/aegisEngine';
import { startAegisPersistence } from '@/lib/aegisPersistence';
import { startSidecar } from '@/lib/aegisSidecar';
const AegisContext=createContext(null);
const breachEvidence={incident:'Possible Credential Compromise',observations:['14 failed SSH logins followed by successful login','New outbound destination absent from baseline','Unknown process spawned after login','Nightly backup is scheduled but does not explain authentication/network anomalies'],hypotheses:['Credential compromise','Possible exfiltration','Normal nightly backup'],objective:'Contain possible exfiltration while preserving forensic evidence and minimizing service impact'};
export function AegisProvider({children}){
 const [state,setState]=useState(engine._snapshot()); const [integrations,setIntegrations]=useState([]); const [liveNotes,setLiveNotes]=useState([]);
 useEffect(()=>engine.subscribe(setState),[]); useEffect(()=>startAegisPersistence(),[]);
 const refreshIntegrations=useCallback(async()=>{try{setIntegrations(await base44.api.integrations());}catch{}},[]);useEffect(()=>{refreshIntegrations();const t=setInterval(refreshIntegrations,15000);return()=>clearInterval(t);},[refreshIntegrations]);
 const runLiveSidecars=useCallback(async(name)=>{
   if(name!==SCENARIO.FALSE_ALARM&&name!==SCENARIO.BREACH)return;
   try{const j=await base44.api.jiuwen({contextId:name==='BREACH'?'INC-2026-0919-001':'INC-2026-0919-000',query:name===SCENARIO.BREACH?'Vanguard incident: repeated failed SSH logins, then a successful login, an unknown process, and a new outbound destination. Decompose this investigation among telemetry, security, network, change, and skeptic roles. Report concise findings and disagreements.':'Vanguard anomaly: CPU/disk/process spike during a scheduled backup window. Decompose the investigation and determine whether evidence supports a benign backup or compromise.'});setLiveNotes(n=>[{provider:'openJiuwen',mode:j.mode,text:j.text,at:Date.now()},...n].slice(0,10));if(j.mode==='LIVE')engine.ingestExternalEvent('agent.message',{agent_id:'commander-01',short:String(j.text||'Live openJiuwen swarm response').replace(/\s+/g,' ').slice(0,170),full:j.text,confidence:null,tool:'A2A.SendMessage'});}catch(e){setLiveNotes(n=>[{provider:'openJiuwen',mode:'ERROR',text:e.message,at:Date.now()},...n].slice(0,10));}
   const verifyPayload=name===SCENARIO.BREACH?breachEvidence:{incident:'Scheduled resource spike',observations:['CPU and disk activity spike at the scheduled backup time','Process hash matches approved backup-runner','No authentication anomalies','No new outbound destination','Pattern matches 14 prior backup windows within 2% variance'],hypotheses:['Normal nightly backup','Suspicious workload'],objective:'Avoid unnecessary production action when evidence supports expected behavior'};
   setTimeout(async()=>{try{const v=await base44.api.verify(verifyPayload);setLiveNotes(n=>[{provider:'OpenAI',mode:v.mode,text:v.reason,at:Date.now()},...n].slice(0,10));if(v.mode==='LIVE')engine.ingestExternalEvent('verifier.verdict',{incident_id:name===SCENARIO.BREACH?'INC-2026-0919-001':'INC-2026-0919-000',verdict:v.verdict,confidence:Number(v.confidence)||.9,recommended:v.recommended||(name===SCENARIO.BREACH?'NETWORK ISOLATION':'NO ACTION'),reason:v.reason,hypotheses:v.hypotheses||[{title:v.verdict,confidence:Number(v.confidence)||.9}],counterfactuals:v.counterfactuals||[]});}catch(e){setLiveNotes(n=>[{provider:'OpenAI',mode:'ERROR',text:e.message,at:Date.now()},...n].slice(0,10));}},name===SCENARIO.BREACH?11500:7700);
 },[]);
  const runScenario=useCallback(name=>{engine.runScenario(name);runLiveSidecars(name);},[runLiveSidecars]);
  const runDynamic=useCallback(()=>{engine.runDynamic();},[]);
 const injectPoison=useCallback(()=>engine.injectPoison(),[]);
 const approveAction=useCallback(async(id,source='NFC')=>{try{const out=await base44.functions.invoke('recordApproval',{request_id:id,decision:'APPROVED',method:source,nfc_badge_id:'BADGE-CMDR-001'});if(out?.capability){const edge=await base44.api.edgeExecute({capability:out.capability});setLiveNotes(n=>[{provider:'Aegis Edge',mode:edge.mode||'LIVE',text:edge.result||'Execution capability accepted',at:Date.now()},...n].slice(0,10));}}catch(e){setLiveNotes(n=>[{provider:'Aegis Edge',mode:'ERROR',text:e.message,at:Date.now()},...n].slice(0,10));}engine.approveAction(id,source);},[]);
 const rejectAction=useCallback(async id=>{try{await base44.functions.invoke('recordApproval',{request_id:id,decision:'REJECTED',method:'MANUAL'});}catch{}engine.rejectAction(id);},[]);
 const reset=useCallback(()=>engine.reset(),[]),setDemoMode=useCallback(v=>engine.setDemoMode(v),[]);
 useEffect(()=>startSidecar(approveAction).stop, [approveAction]);
 return <AegisContext.Provider value={{...state,runScenario,runDynamic,injectPoison,approveAction,rejectAction,reset,setDemoMode,SCENARIO,integrations,liveNotes,refreshIntegrations}}>{children}</AegisContext.Provider>;
}
export function useAegis(){const c=useContext(AegisContext);if(!c)throw new Error('useAegis must be used within AegisProvider');return c;}
