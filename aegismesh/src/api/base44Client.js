// Compatibility client for the original export, backed by the standalone AegisMesh REST API.
// Existing Base44-generated pages keep the same `base44.auth/entities/functions/app`
// shape while requests now go to our own AegisMesh backend.
const TOKEN_KEY='aegis_access_token';
const apiBase=import.meta.env.VITE_API_URL || '';

function getToken(){ return localStorage.getItem(TOKEN_KEY)||''; }
function setToken(token){ if(token)localStorage.setItem(TOKEN_KEY,token); else localStorage.removeItem(TOKEN_KEY); }
async function request(path,{method='GET',body,auth=true}={}){
  const headers={'Content-Type':'application/json'}; const token=getToken(); if(auth&&token)headers.Authorization=`Bearer ${token}`;
  const r=await fetch(`${apiBase}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  let data=null; try{data=await r.json();}catch{}
  if(!r.ok){const e=new Error(data?.error||`Request failed (${r.status})`);e.status=r.status;e.data=data;throw e;} return data;
}

const auth={
  getToken,setToken,hasToken:()=>!!getToken(),isAuthenticated:()=>!!getToken(),
  async me(){return request('/api/auth/me');},
  async loginViaEmailPassword(email,password){const out=await request('/api/auth/login',{method:'POST',body:{email,password},auth:false});setToken(out.access_token);return out;},
  async demoLogin(){const out=await request('/api/auth/demo',{method:'POST',body:{},auth:false});setToken(out.access_token);return out;},
  async register(payload){return request('/api/auth/register',{method:'POST',body:payload,auth:false});},
  async verifyOtp(payload){const out=await request('/api/auth/verify-otp',{method:'POST',body:payload,auth:false});if(out.access_token)setToken(out.access_token);return out;},
  async resendOtp(email){return request('/api/auth/resend-otp',{method:'POST',body:{email},auth:false});},
  async resetPasswordRequest(email){return request('/api/auth/forgot',{method:'POST',body:{email},auth:false});},
  async resetPassword({resetToken,newPassword}){return request('/api/auth/reset',{method:'POST',body:{resetToken,newPassword},auth:false});},
  logout(redirect){setToken('');if(redirect)window.location.href='/';},
  redirectToLogin(returnTo=window.location.href){const u=new URL(returnTo,window.location.origin);window.location.href=`/login?returnTo=${encodeURIComponent(u.pathname+u.search)}`;},
  loginWithProvider(provider,returnTo='/app'){window.alert(`${provider} OAuth is optional in this standalone build. Use email login or Launch Demo.`);window.location.href=`/login?returnTo=${encodeURIComponent(returnTo)}`;},
};

function entity(name){return {
  list:(sort='-created_date',limit=500)=>request(`/api/entities/${name}?sort=${encodeURIComponent(sort||'')}&limit=${Number(limit)||500}`),
  filter:(filter={})=>request(`/api/entities/${name}?filter=${encodeURIComponent(JSON.stringify(filter))}`),
  create:(data)=>request(`/api/entities/${name}`,{method:'POST',body:data}),
  update:(id,data)=>request(`/api/entities/${name}/${encodeURIComponent(id)}`,{method:'PATCH',body:data}),
  delete:(id)=>request(`/api/entities/${name}/${encodeURIComponent(id)}`,{method:'DELETE'}),
};}
const entityNames=['GovernedAgent','Evidence','ActionRequest','AuditEvent','Incident','Approval','User'];
const entities=Object.fromEntries(entityNames.map(n=>[n,entity(n)]));
export const base44={
  auth,entities,
  functions:{invoke:(name,body)=>request(`/api/functions/${encodeURIComponent(name)}`,{method:'POST',body})},
  app:{getPublicSettings:()=>request('/api/public-settings',{auth:false})},
  api:{request,waitlist:(body)=>request('/api/waitlist',{method:'POST',body,auth:false}),integrations:()=>request('/api/integrations/status'),verify:(body)=>request('/api/ai/verify',{method:'POST',body}),jiuwen:(body)=>request('/api/jiuwen/dispatch',{method:'POST',body}),edgeStatus:()=>request('/api/edge/status'),edgeTest:(body)=>request('/api/edge/test',{method:'POST',body}),edgeExecute:(body)=>request('/api/edge/execute',{method:'POST',body})}
};
