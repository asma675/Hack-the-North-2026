import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAegis } from '@/lib/useAegis';
import { Panel } from '@/components/aegis';
import { cn } from '@/lib/utils';

const NODE_TYPES = {
  observation: { color: '#22d3ee', label: 'OBS' },
  log: { color: '#60a5fa', label: 'LOG' },
  process: { color: '#a78bfa', label: 'PROC' },
  IP: { color: '#f472b6', label: 'IP' },
  user: { color: '#fbbf24', label: 'USER' },
  scheduled_task: { color: '#34d399', label: 'TASK' },
  hypothesis: { color: '#fb923c', label: 'HYP' },
  agent: { color: '#2dd4bf', label: 'AGENT' },
  verdict: { color: '#22d3ee', label: 'VERD' },
  action: { color: '#f87171', label: 'ACT' },
};

const GRAPH_NODES = [
  { id: 'n-failed-logins', type: 'log', label: 'FAILED LOGINS', x: 15, y: 15 },
  { id: 'n-success-login', type: 'log', label: 'SUCCESSFUL LOGIN', x: 15, y: 40 },
  { id: 'n-unknown-proc', type: 'process', label: 'UNKNOWN PROCESS', x: 40, y: 28 },
  { id: 'n-outbound-ip', type: 'IP', label: 'NEW OUTBOUND IP', x: 40, y: 55 },
  { id: 'n-deploy-acct', type: 'user', label: 'DEPLOY ACCOUNT', x: 15, y: 65 },
  { id: 'n-backup-sched', type: 'scheduled_task', label: 'BACKUP SCHEDULE', x: 65, y: 15 },
  { id: 'h-compromise', type: 'hypothesis', label: 'CREDENTIAL COMPROMISE', x: 65, y: 40 },
  { id: 'h-backup', type: 'hypothesis', label: 'NORMAL BACKUP', x: 65, y: 65 },
  { id: 'n-corporate-vpn', type: 'IP', label: 'CORPORATE VPN', x: 90, y: 65 },
  { id: 'v-verdict', type: 'verdict', label: 'VERDICT: 93%', x: 90, y: 40 },
  { id: 'a-isolate', type: 'action', label: 'NETWORK ISOLATE', x: 90, y: 15 },
];

const GRAPH_EDGES = [
  { from: 'n-failed-logins', to: 'h-compromise', type: 'supports' },
  { from: 'n-success-login', to: 'h-compromise', type: 'supports' },
  { from: 'n-unknown-proc', to: 'h-compromise', type: 'supports' },
  { from: 'n-outbound-ip', to: 'h-compromise', type: 'supports' },
  { from: 'n-deploy-acct', to: 'h-compromise', type: 'supports' },
  { from: 'n-backup-sched', to: 'h-backup', type: 'supports' },
  { from: 'h-backup', to: 'h-compromise', type: 'contradicts' },
  { from: 'n-corporate-vpn', to: 'h-backup', type: 'contradicts' },
  { from: 'h-compromise', to: 'v-verdict', type: 'derived-from' },
  { from: 'v-verdict', to: 'a-isolate', type: 'caused-by' },
];

const EDGE_STYLES = {
  supports: { color: '#34d399', dash: 'none' },
  contradicts: { color: '#f87171', dash: '4 4' },
  'caused-by': { color: '#fb923c', dash: 'none' },
  'derived-from': { color: '#22d3ee', dash: 'none' },
};

export default function EvidenceGraph() {
  const { id } = useParams();
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('GRAPH');

  const node = selected ? GRAPH_NODES.find(n => n.id === selected) : null;
  const nodeEdges = selected ? GRAPH_EDGES.filter(e => e.from === selected || e.to === selected) : [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <Link to={`/app/incidents/${id}`} className="text-xs text-muted-foreground hover:text-foreground">← Back to War Room</Link>
        <h1 className="text-2xl font-display font-bold tracking-tight mt-2">Evidence Graph</h1>
        <p className="text-sm text-muted-foreground mt-1">Interactive graph of observations, hypotheses, and their relationships</p>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/20 border border-border w-fit">
        {['GRAPH', 'TIMELINE', 'RAW'].map(v => (
          <button key={v} onClick={() => setView(v)} className={cn(
            'px-3 py-1.5 rounded text-xs aegis-mono transition',
            view === v ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
          )}>{v}</button>
        ))}
      </div>

      {view === 'GRAPH' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Graph */}
          <Panel title="Evidence Graph" className="lg:col-span-2" bodyClassName="p-2">
            <div className="relative" style={{ height: 500 }}>
              <svg className="absolute inset-0 w-full h-full">
                {GRAPH_EDGES.map((e, i) => {
                  const f = GRAPH_NODES.find(n => n.id === e.from);
                  const t = GRAPH_NODES.find(n => n.id === e.to);
                  const style = EDGE_STYLES[e.type];
                  return (
                    <g key={i}>
                      <line x1={`${f.x}%`} y1={`${f.y}%`} x2={`${t.x}%`} y2={`${t.y}%`}
                        stroke={style.color} strokeWidth="1.5" opacity="0.5"
                        strokeDasharray={style.dash === 'none' ? undefined : style.dash}
                      />
                      <text x={`${(f.x + t.x) / 2}%`} y={`${(f.y + t.y) / 2}%`}
                        fill={style.color} fontSize="8" className="aegis-mono" dy="-2">
                        {e.type}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {GRAPH_NODES.map(n => {
                const meta = NODE_TYPES[n.type];
                return (
                  <button key={n.id} onClick={() => setSelected(n.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1.5 rounded text-[10px] aegis-mono font-medium border transition-all hover:scale-110"
                    style={{
                      left: `${n.x}%`, top: `${n.y}%`,
                      background: `${meta.color}15`,
                      borderColor: `${meta.color}40`,
                      color: meta.color,
                      boxShadow: selected === n.id ? `0 0 12px ${meta.color}66` : 'none',
                    }}>
                    {n.label}
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Detail panel */}
          <Panel title="Node Detail">
            {!node ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Click a node to see details</div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] aegis-mono text-muted-foreground">TYPE</div>
                  <div className="text-sm mt-0.5" style={{ color: NODE_TYPES[node.type].color }}>{node.type}</div>
                </div>
                <div>
                  <div className="text-[10px] aegis-mono text-muted-foreground">LABEL</div>
                  <div className="text-sm mt-0.5 font-medium">{node.label}</div>
                </div>
                <div>
                  <div className="text-[10px] aegis-mono text-muted-foreground">CONNECTIONS</div>
                  <div className="space-y-1 mt-1">
                    {nodeEdges.map((e, i) => {
                      const other = e.from === node.id ? GRAPH_NODES.find(n => n.id === e.to) : GRAPH_NODES.find(n => n.id === e.from);
                      return (
                        <div key={i} className="text-xs flex items-center gap-2">
                          <span style={{ color: EDGE_STYLES[e.type].color }} className="aegis-mono">{e.type}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{other.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {view === 'TIMELINE' && <TimelineView />}
      {view === 'RAW' && <RawView />}
    </div>
  );
}

function TimelineView() {
  const events = [
    { ts: '02:14:02', node: 'FAILED LOGINS', type: 'observation' },
    { ts: '02:14:04', node: 'SUCCESSFUL LOGIN', type: 'log' },
    { ts: '02:14:07', node: 'BACKUP SCHEDULE', type: 'scheduled_task' },
    { ts: '02:14:10', node: 'NORMAL BACKUP (hypothesis)', type: 'hypothesis' },
    { ts: '02:14:12', node: 'NEW OUTBOUND IP', type: 'IP' },
    { ts: '02:14:14', node: 'UNKNOWN PROCESS', type: 'process' },
    { ts: '02:14:16', node: 'CREDENTIAL COMPROMISE (hypothesis)', type: 'hypothesis' },
    { ts: '02:14:27', node: 'VERDICT 93%', type: 'verdict' },
    { ts: '02:14:29', node: 'NETWORK ISOLATE (action)', type: 'action' },
  ];
  return (
    <Panel title="Evidence Timeline">
      <div className="space-y-2">
        {events.map((e, i) => {
          const meta = NODE_TYPES[e.type] || { color: '#888' };
          return (
            <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/20 border border-border">
              <span className="aegis-mono text-xs text-muted-foreground shrink-0 w-16">{e.ts}</span>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
              <span className="text-sm">{e.node}</span>
              <span className="text-[10px] aegis-mono text-muted-foreground ml-auto" style={{ color: meta.color }}>{e.type}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function RawView() {
  const raw = GRAPH_NODES.map(n => ({ id: n.id, type: n.type, label: n.label }));
  return (
    <Panel title="Raw Evidence Data">
      <pre className="text-xs aegis-mono text-muted-foreground overflow-x-auto p-3 rounded bg-muted/20 border border-border">
{JSON.stringify(raw, null, 2)}
      </pre>
    </Panel>
  );
}