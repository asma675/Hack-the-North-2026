import { useState } from 'react';
import { Panel, StatusBadge } from '@/components/aegis';
import { FileText, Activity, BarChart3, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'LOGS', icon: FileText },
  { key: 'TRACES', icon: Activity },
  { key: 'METRICS', icon: BarChart3 },
  { key: 'AGENT_CALLS', icon: Bot },
];

export default function Observability() {
  const [tab, setTab] = useState('TRACES');

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Observability</h1>
        <p className="text-sm text-muted-foreground mt-1">Full system tracing across the incident response pipeline</p>
      </div>

      {/* Integration slots */}
      <div className="grid grid-cols-2 gap-3">
        <div className="aegis-panel p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs aegis-mono text-amber-400">E</div>
            <div>
              <div className="text-sm font-medium">Elastic</div>
              <div className="text-[10px] text-muted-foreground">Evidence search & historical incidents</div>
            </div>
          </div>
          <StatusBadge status="SIMULATED" />
        </div>
        <div className="aegis-panel p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs aegis-mono text-amber-400">S</div>
            <div>
              <div className="text-sm font-medium">Sentry</div>
              <div className="text-[10px] text-muted-foreground">Distributed tracing & agent observability</div>
            </div>
          </div>
          <StatusBadge status="SIMULATED" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/20 border border-border w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs aegis-mono transition',
            tab === t.key ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
          )}>
            <t.icon className="w-3.5 h-3.5" /> {t.key}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'TRACES' && <TraceView />}
      {tab === 'LOGS' && <LogsView />}
      {tab === 'METRICS' && <MetricsView />}
      {tab === 'AGENT_CALLS' && <AgentCallsView />}
    </div>
  );
}

function TraceView() {
  const trace = [
    { step: 'Incident Detection', duration: '2ms', status: 'OK' },
    { step: 'openJiuwen Swarm Launch', duration: '120ms', status: 'OK' },
    { step: 'Evidence Search (parallel)', duration: '1.2s', status: 'OK' },
    { step: 'Skeptic Challenge', duration: '340ms', status: 'OK' },
    { step: 'OpenAI Evidence Court', duration: '380ms', status: 'OK' },
    { step: 'Aegis Gate Policy Check', duration: '18ms', status: 'OK' },
    { step: 'Human Approval (NFC)', duration: '2.5s', status: 'OK' },
    { step: 'Edge Execution', duration: '8ms', status: 'OK' },
  ];
  return (
    <Panel title="System Trace" subtitle="Incident → Detection → Containment">
      <div className="space-y-1">
        {trace.map((t, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] aegis-mono text-primary shrink-0">{i + 1}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t.step}</span>
                <span className="aegis-mono text-xs text-muted-foreground">{t.duration}</span>
              </div>
              <div className="h-1 rounded-full bg-muted/30 mt-1 overflow-hidden">
                <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.min(100, (i + 1) * 12)}%` }} />
              </div>
            </div>
            {i < trace.length - 1 && <div className="w-px h-4 bg-border absolute ml-3 mt-8" />}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LogsView() {
  const logs = [
    { ts: '02:14:02', level: 'WARN', src: 'victim-pi', msg: 'CPU sustained 94% for 3min' },
    { ts: '02:14:04', level: 'INFO', src: 'openjiuwen', msg: 'Swarm launched: 7 agents assigned' },
    { ts: '02:14:07', level: 'INFO', src: 'change-01', msg: 'Backup hypothesis proposed (88%)' },
    { ts: '02:14:10', level: 'WARN', src: 'skeptic-01', msg: 'Challenge issued to change-01' },
    { ts: '02:14:12', level: 'CRIT', src: 'network-01', msg: 'New outbound to 45.137.x.x:8443' },
    { ts: '02:14:16', level: 'CRIT', src: 'verifier-01', msg: 'Credential compromise confidence 93%' },
    { ts: '02:14:19', level: 'CRIT', src: 'telemetry-03', msg: 'Consumed poisoned runbook instruction' },
    { ts: '02:14:20', level: 'BLOCK', src: 'aegis-gate', msg: 'power.cut DENIED — capability mismatch' },
    { ts: '02:14:21', level: 'CRIT', src: 'aegis-engine', msg: 'telemetry-03 QUARANTINED, trust 93→28' },
    { ts: '02:14:32', level: 'OK', src: 'nfc-reader', msg: 'Badge BADGE-CMDR-001 verified' },
    { ts: '02:14:33', level: 'OK', src: 'cloudflare', msg: 'Capability CAP-2026-0919-001 issued' },
    { ts: '02:14:34', level: 'OK', src: 'edge-enforcement', msg: 'network.isolate executed, relay engaged' },
    { ts: '02:14:35', level: 'OK', src: 'aegis-engine', msg: 'INC-2026-0919-001 CONTAINED' },
  ];
  return (
    <Panel title="System Logs" subtitle="Real-time log stream">
      <div className="space-y-1 max-h-[500px] overflow-y-auto aegis-mono text-xs">
        {logs.map((l, i) => (
          <div key={i} className="flex items-start gap-2 py-1 border-b border-border/30">
            <span className="text-muted-foreground shrink-0">{l.ts}</span>
            <span className={cn('shrink-0 w-12', l.level === 'CRIT' || l.level === 'BLOCK' ? 'text-red-400' : l.level === 'WARN' ? 'text-amber-400' : 'text-green-400')}>
              {l.level}
            </span>
            <span className="text-primary shrink-0">{l.src}</span>
            <span className="text-muted-foreground">{l.msg}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MetricsView() {
  return (
    <Panel title="System Metrics" subtitle="Telemetry from victim-pi-01">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'CPU', value: 94, unit: '%', color: '#f87171' },
          { label: 'Memory', value: 67, unit: '%', color: '#fbbf24' },
          { label: 'Disk I/O', value: 82, unit: '%', color: '#22d3ee' },
          { label: 'Network Out', value: 18, unit: 'MB/s', color: '#a78bfa' },
        ].map(m => (
          <div key={m.label} className="p-4 rounded bg-muted/20 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{m.label}</span>
              <span className="text-lg font-bold aegis-mono" style={{ color: m.color }}>{m.value}{m.unit}</span>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${m.unit === '%' ? m.value : m.value * 5}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AgentCallsView() {
  const calls = [
    { agent: 'commander-01', tool: 'incident.decompose', duration: '45ms', status: 'OK' },
    { agent: 'security-02', tool: 'auth.audit', duration: '120ms', status: 'OK' },
    { agent: 'network-01', tool: 'flow.analyze', duration: '89ms', status: 'OK' },
    { agent: 'telemetry-03', tool: 'process.list', duration: '67ms', status: 'OK' },
    { agent: 'change-01', tool: 'schedule.lookup', duration: '34ms', status: 'OK' },
    { agent: 'skeptic-01', tool: 'counterfactual.test', duration: '210ms', status: 'OK' },
    { agent: 'verifier-01', tool: 'evidence.bundle', duration: '180ms', status: 'OK' },
    { agent: 'telemetry-03', tool: 'runbook.read', duration: '12ms', status: 'BLOCKED' },
  ];
  return (
    <Panel title="Agent Tool Calls" subtitle="Every agent invocation logged">
      <div className="space-y-1.5">
        {calls.map((c, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/20 border border-border text-xs">
            <span className="aegis-mono text-primary shrink-0">{c.agent}</span>
            <span className="aegis-mono shrink-0">{c.tool}</span>
            <span className="aegis-mono text-muted-foreground shrink-0">{c.duration}</span>
            <span className={`ml-auto ${c.status === 'BLOCKED' ? 'text-red-400' : 'text-green-400'}`}>{c.status}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}