// Persistence bridge — streams Vanguard engine events into the real backend
// (entities + server-side authorization functions), so incidents, evidence,
// action requests, approvals and audit history survive refreshes.
// Best-effort: a persistence failure must never break the live demo.
import { base44 } from '@/api/base44Client';
import { engine } from '@/lib/aegisEngine';

const INVESTIGATION_EVENTS = new Set([
  'incident.created',
  'incident.state_changed',
  'incident.contained',
  'hypothesis.updated',
  'verifier.verdict',
  'evidence.created',
  'agent.quarantined',
]);

// 'action.requested' goes through the real server-side Aegis Gate pipeline.
// 'approval.received' is persisted by the recordApproval function invoked from
// the approval controls, so it is intentionally not handled here.
function persistEvent(event) {
  if (event.type === 'action.requested') {
    const d = event.data || {};
    return base44.functions.invoke('authorizeAction', {
      request_id: d.id,
      incident_id: d.incident_id,
      agent_key: d.agent_id,
      action: d.action,
      target: d.target,
      risk: d.risk,
      blast_radius: d.blast_radius,
      reversible: d.reversible,
      required_permission: d.required_permission,
      verifier_confidence: d.verifier_confidence,
      human_required: d.human_required,
    });
  }
  if (INVESTIGATION_EVENTS.has(event.type)) {
    return base44.functions.invoke('recordInvestigationEvent', {
      type: event.type,
      data: event.data || {},
    });
  }
  return null;
}

export function startAegisPersistence() {
  return engine.onEvent(async (event) => {
    try {
      await persistEvent(event);
    } catch (e) {
      // Persistence is best-effort — the simulation keeps running regardless.
    }
  });
}