import crypto from 'node:crypto';
import { mutate, loadState, newId } from './store.mjs';
const SECRET=process.env.AUTH_SECRET||'dev-only-change-me-before-production';
const b64=v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url');
function sign(data){ return crypto.createHmac('sha256',SECRET).update(data).digest('base64url'); }
export function issueToken(user, ttlSec=60*60*24*7){ const payload=b64({uid:user.id,email:user.email,role:user.role||'user',exp:Math.floor(Date.now()/1000)+ttlSec}); return `${payload}.${sign(payload)}`; }
export function verifyToken(token){ if(!token) return null; const [p,s]=String(token).split('.'); if(!p||!s) return null; const expected=Buffer.from(sign(p)); const provided=Buffer.from(s); if(expected.length!==provided.length || !crypto.timingSafeEqual(expected,provided)) return null; try{ const obj=JSON.parse(Buffer.from(p,'base64url').toString('utf8')); if(obj.exp<Date.now()/1000) return null; return obj; }catch{return null;} }
export function getBearer(req){ const h=req.headers.authorization||''; return h.startsWith('Bearer ')?h.slice(7):null; }
export async function requireUser(req){ const p=verifyToken(getBearer(req)); if(!p) throw Object.assign(new Error('Unauthorized'),{status:401}); const st=await loadState(); const u=st.users.find(x=>x.id===p.uid); if(!u) throw Object.assign(new Error('Unauthorized'),{status:401}); return {...u,passwordHash:undefined,salt:undefined,otp:undefined}; }
export function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){ return {salt,hash:crypto.scryptSync(password,salt,64).toString('hex')}; }
export function checkPassword(password,user){ const h=crypto.scryptSync(password,user.salt,64); return crypto.timingSafeEqual(h,Buffer.from(user.passwordHash,'hex')); }
export async function ensureDemoUser(){ return mutate(state=>{ let u=state.users.find(x=>x.email==='judge@vanguard.ai'); if(!u){ const {salt,hash}=hashPassword('demo1234'); u={id:newId('usr'),email:'judge@vanguard.ai',role:'admin',verified:true,salt,passwordHash:hash,created_at:new Date().toISOString()}; state.users.push(u); state.entities.User.push({id:u.id,email:u.email,role:u.role,created_date:u.created_at}); } return u; }); }
