import crypto from 'node:crypto';
const SECRET=process.env.EDGE_SHARED_SECRET||'aegis-edge-demo-secret-change-me';
export function issueCapability({actionRequest,approval}){
  const now=Date.now(); const payload={capability_id:`CAP-${now}`,action_id:actionRequest.request_id,incident_id:actionRequest.incident_id,target:actionRequest.target,command:actionRequest.action,approved_by:approval.approver_email,issued_at:new Date(now).toISOString(),expires_at:new Date(now+10000).toISOString(),nonce:crypto.randomBytes(8).toString('hex')};
  const canonical=JSON.stringify(payload); const signature=crypto.createHmac('sha256',SECRET).update(canonical).digest('hex'); return {...payload,signature,status:'ISSUED',used:false};
}
