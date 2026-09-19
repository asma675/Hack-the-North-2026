import { useParams, Link } from 'react-router-dom';
import { Panel, MetricCard } from '@/components/aegis';
import { Clock, Users, Ban, Shield, AlertTriangle, UserCheck, Zap } from 'lucide-react';

const TIMELINE = [
  { ts: '02:14:02', event: 'Anomaly detected', type: 'detect' },
  { ts: '02:14:04', event: 'openJiuwen swarm launched', type: 'swarm' },
  { ts: '02:14:07', event: 'Backup hypothesis proposed', type: 'hypothesis' },
  { ts: '02:14:10', event: 'Skeptic challenges backup hypothesis', type: 'challenge' },
  { ts: '02:14:12', event: 'Unknown outbound destination detected', type: 'evidence' },
  { ts: '02:14:16', event: 'Credential compromise confidence → 93%', type: 'verdict' },
  { ts: '02:14:19', event: 'Telemetry-Agent-03 consumes poisoned instruction', type: 'poison' },
  { ts: '02:14:20', event: 'Unauthorized hardware action requested', type: 'block' },
  { ts: '02:14:20', event: 'AEGIS GATE BLOCKS REQUEST', type: 'block' },
  { ts: '02:14:21', event: 'Agent quarantined', type: 'quarantine' },
  { ts: '02:14:23', event: 'Task reassigned to Telemetry-Agent-04', type: 'reassign' },
  { ts: '02:14:27', event: 'OpenAI Evidence Court recommends isolation', type: 'verdict' },
  { ts: '02:14:29', event: 'Human approval requested', type: 'approval' },
  { ts: '02:14:32', event: 'NFC identity verified', type: 'nfc' },
  { ts: '02:14:33', event: 'Execution capability issued', type: 'capability' },
  { ts: '02:14:34', event: 'Edge command executed', type: 'execute' },
  { ts: '02:14:35', event: 'Threat contained', type: 'contained' },
];

const TYPE_COLORS = {
  detect: '#22d3ee', swarm: '#a78bfa', hypothesis: '#fbbf24', challenge: '#f472b6',
  evidence: '#60a5fa', verdict: '#34d399', poison: '#f87171', block: '#f87171',
  quarantine: '#f87171', reassign: '#fb923c', approval: '#a78bfa', nfc: '#a78bfa',
  capability: '#22d3ee', execute: '#34d399', contained: '#34d399',
};

export default function AttackReplay() {
  const { id } = useParams();

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <Link to={`/app/incidents/${id}`} className="text-xs text-muted-foreground hover:text-foreground">← Back to War Room</Link>
        <h1 className="text-2xl font-display font-bold tracking-tight mt-2">Attack Replay</h1>
        <p className="text-sm text-muted-foreground mt-1">Full timeline from detection to containment</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard label="Time to Detect" value="2s" tone="cyan" icon={Clock} />
        <MetricCard label="Time to Contain" value="33s" tone="green" icon={Clock} />
        <MetricCard label="Agents" value="7" tone="cyan" icon={Users} />
        <MetricCard label="Challenges" value="4" tone="amber" icon={AlertTriangle} />
        <MetricCard label="Unsafe Actions" value="1" tone="red" icon={Zap} />
        <MetricCard label="Blocked" value="1" tone="red" icon={Ban} />
        <MetricCard label="Human Approvals" value="1" tone="green" icon={UserCheck} />
      </div>

      {/* Timeline */}
      <Panel title="Incident Timeline" subtitle="02:14:02 → 02:14:35 (33 seconds)">
        <div className="relative">
          <div className="absolute left-[88px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {TIMELINE.map((e, i) => {
              const color = TYPE_COLORS[e.type];
              return (
                <div key={i} className="flex items-start gap-4 relative animate-aegis-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="aegis-mono text-xs text-muted-foreground shrink-0 w-16 text-right">{e.ts}</span>
                  <div className="w-3 h-3 rounded-full shrink-0 mt-1 border-2 border-background" style={{ background: color, boxShadow: `0 0 8px ${color}66` }} />
                  <div className="flex-1 pb-2">
                    <span className="text-sm" style={{ color: e.type === 'block' || e.type === 'poison' || e.type === 'quarantine' ? '#f87171' : e.type === 'contained' || e.type === 'execute' || e.type === 'verdict' ? '#34d399' : 'inherit' }}>
                      {e.event}
                    </span>
                    <span className="text-[10px] aegis-mono text-muted-foreground ml-2" style={{ color }}>{e.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* Memory capsule */}
      <Panel title="Incident Memory Capsule" subtitle="Generated after containment — retrievable by future incidents">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <Field label="Incident" value="INC-2026-0919-001" />
            <Field label="Root Cause" value="Credential compromise" />
            <Field label="Containment" value="Network isolation" />
            <Field label="Detection" value="02:14:02" />
            <Field label="Contained" value="02:14:35" />
          </div>
          <div className="space-y-2">
            <Field label="Agents Used" value="7" />
            <Field label="Rejected Hypotheses" value="2" />
            <Field label="Unsafe Actions Blocked" value="1" />
            <Field label="Human Approvals" value="1" />
            <Field label="Agents Quarantined" value="1" />
          </div>
        </div>
        <div className="mt-4 p-3 rounded bg-muted/20 border border-border text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
          This memory capsule is stored and can be retrieved by later incidents with similar patterns, enabling the swarm to learn from past investigations.
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="aegis-mono text-sm">{value}</span>
    </div>
  );
}