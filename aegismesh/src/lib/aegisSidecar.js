import { engine } from '@/lib/aegisEngine';

const PHASE_MAP = {
  IDLE: 'IDLE',
  DETECTED: 'DETECTED',
  TRIAGE: 'TRIAGE',
  INVESTIGATING: 'INVESTIGATING',
  CONTESTING: 'CONTESTING',
  CONSENSUS: 'CONSENSUS',
  SIMULATING: 'SIMULATING',
  APPROVAL: 'APPROVAL',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  CONTAINED: 'CONTAINED',
};

const AGENT_STATE_MAP = {
  IDLE: 'IDLE',
  INVESTIGATING: 'INVESTIGATING',
  CHALLENGING: 'INVESTIGATING',
  CHALLENGED: 'INVESTIGATING',
  COMPLETE: 'IDLE',
  QUARANTINED: 'QUARANTINED',
  VERIFYING: 'INVESTIGATING',
};

function getIncidentState(snapshot) {
  const incidents = snapshot.incidents || [];
  const incident = incidents[incidents.length - 1];
  const hasPendingAction = snapshot.actionRequests?.some(a => a.status === 'APPROVAL_REQUIRED');
  if (hasPendingAction) return PHASE_MAP.APPROVAL;
  return PHASE_MAP[incident?.state] || PHASE_MAP.IDLE;
}

function getAgentState(agent) {
  return AGENT_STATE_MAP[agent.status] || 'IDLE';
}

export function buildSidecarPayload(snapshot) {
  const incidentState = getIncidentState(snapshot);
  const agentsState = {};
  (snapshot.agents || []).forEach(a => {
    agentsState[a.id] = getAgentState(a);
  });
  return { incidentState, agents: agentsState };
}

export function startSidecar(approveActionFn) {
  const postState = () => {
    fetch('http://localhost:8788/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildSidecarPayload(engine._snapshot())),
    }).catch(() => {});
  };

  const unsubscribe = engine.onEvent(postState);
  const heartbeatTimer = setInterval(postState, 1000);

  const approvalTimer = setInterval(async () => {
    try {
      const res = await fetch('http://localhost:8788/approvals');
      const data = await res.json();
      if (!data.approvals || data.approvals.length === 0) return;
      const pendingAction = [...engine.actionRequests.values()].find(ar => ar.status === 'APPROVAL_REQUIRED');
      if (!pendingAction || !approveActionFn) return;
      for (const approval of data.approvals) {
        approveActionFn(pendingAction.id, approval.source);
      }
    } catch {}
  }, 500);

  return {
    stop: () => {
      clearInterval(heartbeatTimer);
      clearInterval(approvalTimer);
    },
  };
}

export { PHASE_MAP, AGENT_STATE_MAP };
