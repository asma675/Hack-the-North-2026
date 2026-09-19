import fs from 'node:fs/promises';
import path from 'node:path';
import { freshState } from './seed.mjs';

const filePath=process.env.DATA_FILE||path.resolve(process.cwd(),'data','aegismesh.json');
let memory=null;
const redisUrl=process.env.UPSTASH_REDIS_REST_URL;
const redisToken=process.env.UPSTASH_REDIS_REST_TOKEN;
const redisKey=process.env.AEGIS_REDIS_KEY||'aegismesh:state';

async function redisCommand(args){
  const r=await fetch(redisUrl,{method:'POST',headers:{Authorization:`Bearer ${redisToken}`,'Content-Type':'application/json'},body:JSON.stringify(args)});
  if(!r.ok)throw new Error(`Redis ${r.status}: ${(await r.text()).slice(0,200)}`);
  return r.json();
}
export async function loadState(){
  if(redisUrl&&redisToken){try{const out=await redisCommand(['GET',redisKey]);if(out.result)return JSON.parse(out.result);}catch(e){console.warn('Redis unavailable, using local fallback:',e.message);}}
  if(memory)return structuredClone(memory);
  try{memory=JSON.parse(await fs.readFile(filePath,'utf8'));}catch{memory=freshState();await persistState(memory);}return structuredClone(memory);
}
export async function persistState(state){
  memory=structuredClone(state);
  if(redisUrl&&redisToken){try{await redisCommand(['SET',redisKey,JSON.stringify(state)]);return;}catch(e){console.warn('Redis write failed, writing local:',e.message);}}
  try{await fs.mkdir(path.dirname(filePath),{recursive:true});await fs.writeFile(filePath,JSON.stringify(state,null,2));}catch{/* Vercel filesystem may be read-only; in-memory state still serves this warm instance. */}
}
export async function mutate(fn){const state=await loadState();const result=await fn(state);await persistState(state);return result;}
export const entityNames=['GovernedAgent','Evidence','ActionRequest','AuditEvent','Incident','Approval','User'];
export function entityCollection(state,name){if(!entityNames.includes(name))throw Object.assign(new Error('Unknown entity'),{status:404});return state.entities[name];}
export function newId(prefix='rec'){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
