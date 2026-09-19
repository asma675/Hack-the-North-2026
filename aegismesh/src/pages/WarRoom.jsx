import { useParams, Link } from 'react-router-dom';
import { useAegis } from '@/lib/useAegis';
import { AgentArena } from '@/components/AgentArena';
import { Panel, StatusBadge, TrustScore, HypothesisBar } from '@/components/aegis';
import { Clock, Shield, Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WarRoom() {
  const { id } = useParams();
  const { incidents, events, agents, evidence, hypotheses } = useAegis();
  const incident = incidents.find(i => i.id === id) || incidents[0];
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!incident?.started_at) return;
    const interval = setInterval(() => {
      const end = incident.contained_at || Date.now();
      setElapsed(Math.floor((end - incident.started_at) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [incident]);

  if (!incident) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No incident found. Start a scenario from <Link to="/app/judge" className="text-primary hover:underline">Judge Mode</Link>.</p>
        </div>
      </div>
    );
  }

  const incEvents = events.filter(e => !e.data.incident_id || e.data.incident_id === incident.id);
  const incEvidence = evidence.filter(ev => ev.incident_id === incident.id);
  const incHypotheses = hypotheses.filter(h => h.incident_id === incident.id);
  const incAgents = agents.filter(a => a.current_incident_id === incident.id || (a.status === 'QUARANTINED' && a.id === 'telemetry-03'));

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={incident.severity} />
            <StatusBadge status={incident.state} />
            <span className="aegis-mono text-xs text-muted-foreground">{incident.id}</span>
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">{incident.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Affected: <span className="aegis-mono">{incident.affected_assets?.join(', ')}</span></p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs aegis-mono">
            <Clock className="w-3.5 h-3.5" /> Elapsed
          </div>
          <div className="text-2xl font-bold aegis-mono mt-1">{mm}:{ss}</div>
        </div>
      </div>

      {/* State machine */}
      <StateMachineBar currentState={incident.state} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: hypotheses + evidence */}
        <div className="space-y-6">
          <Panel title="Hypothesis Confidence" subtitle="Competing explanations">
            {incHypotheses.length === 0 && incident.verdict ? (
              <div className="space-y-2">
                {incident.verdict.hypotheses?.map((h, i) => (
                  <HypothesisBar key={i} title={h.title} confidence={h.confidence} leading={i === 0} />
                ))}
              </div>
            ) : incHypotheses.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">Awaiting investigation...</div>
            ) : (
              <div className="space-y-2">
                {[...incHypotheses].sort((a, b) => b.confidence - a.confidence).map(h => (
                  <HypothesisBar key={h.id} title={h.title} confidence={h.confidence} leading={h.confidence > 0.5} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Evidence Ledger" subtitle={`${incEvidence.length} items`}>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {incEvidence.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">No evidence yet.</div>
              ) : (
                incEvidence.map(ev => (
                  <div key={ev.id} className="p-2 rounded bg-muted/20 border border-border text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ev.title}</span>
                      <span className="aegis-mono text-[10px] text-muted-foreground">{Math.round(ev.confidence * 100)}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 aegis-mono">{ev.type} · {ev.source} · {ev.agent_id}</div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        {/* Center: Agent Arena */}
        <Panel title="Agent Arena" subtitle={`${incAgents.length} agents investigating`} className="lg:col-span-2" bodyClassName="p-2">
          <AgentArena incidentId={incident.id} />
        </Panel>
      </div>

      {/* Event stream + agent roster */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Live Event Stream" subtitle="Realtime incident events">
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {incEvents.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">No events yet.</div>
            ) : (
              incEvents.slice(-30).reverse().map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="aegis-mono text-[10px] text-muted-foreground shrink-0 w-16">
                    {new Date(e.ts).toLocaleTimeString('en-US', { hour12: false }).slice(0, 8)}
                  </span>
                  <span className="aegis-mono text-[10px] text-primary shrink-0 w-32 truncate">{e.type}</span>
                  <span className="text-muted-foreground truncate">{e.data.short || e.data.full || e.data.task || e.data.reason || e.data.state || e.data.verdict || ''}</span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Agent Roster" subtitle={`${incAgents.length} agents on incident`}>
          <div className="space-y-2">
            {incAgents.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded bg-muted/20 border border-border">
                <TrustScore score={a.trust_score} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{a.name}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="text-[10px] text-muted-foreground aegis-mono truncate">{a.current_task || a.role}</div>
                </div>
                <Link to={`/app/agents/${a.id}`} className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  Passport <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center gap-3 text-sm">
        <Link to={`/app/incidents/${incident.id}/evidence`} className="px-3 py-1.5 rounded bg-muted/30 border border-border hover:border-primary/30 transition text-xs">
          Evidence Graph →
        </Link>
        <Link to={`/app/incidents/${incident.id}/replay`} className="px-3 py-1.5 rounded bg-muted/30 border border-border hover:border-primary/30 transition text-xs">
          Attack Replay →
        </Link>
        <Link to="/app/evidence-court" className="px-3 py-1.5 rounded bg-muted/30 border border-border hover:border-primary/30 transition text-xs">
          Evidence Court →
        </Link>
      </div>
    </div>
  );
}

function StateMachineBar({ currentState }) {
  const states = ['DETECTED', 'TRIAGE', 'INVESTIGATING', 'CONTESTING', 'CONSENSUS', 'SIMULATING', 'APPROVAL', 'EXECUTING', 'VERIFYING', 'CONTAINED'];
  const currentIdx = states.indexOf(currentState);
  return (
    <div className="aegis-panel rounded-lg p-4">
      <div className="text-[10px] aegis-mono text-muted-foreground mb-3">INCIDENT STATE MACHINE</div>
      <div className="flex items-center gap-1 overflow-x-auto">
        {states.map((s, i) => (
          <div key={s} className="flex items-center shrink-0">
            <div className={`text-[10px] aegis-mono px-2 py-1 rounded border transition-all ${
              i === currentIdx ? 'bg-primary/20 text-primary border-primary/40 aegis-glow-cyan' :
              i < currentIdx ? 'bg-green-500/10 text-green-400/70 border-green-500/20' :
              'bg-muted/20 text-muted-foreground border-border'
            }`}>
              {s}
            </div>
            {i < states.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground mx-0.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}