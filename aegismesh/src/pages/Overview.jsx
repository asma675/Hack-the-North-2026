import { Link } from 'react-router-dom';
import { Activity, Shield, Users, Ban, UserCheck, Clock, AlertTriangle, Cpu, Plug } from 'lucide-react';
import { useAegis } from '@/lib/useAegis';
import { MetricCard, Panel, StatusBadge } from '@/components/aegis';
import { EDGE_DEVICES } from '@/lib/aegisEngine';

export default function Overview() {
  const { incidents, agents, metrics, actionRequests, integrations } = useAegis();

  const activeIncidents = incidents.filter(i => i.state !== 'CONTAINED' && i.state !== 'RESOLVED');
  const agentsOnline = agents.filter(a => a.status !== 'IDLE' && a.status !== 'QUARANTINED').length;
  const pendingApprovals = actionRequests.filter(a => a.status === 'APPROVAL_REQUIRED').length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Executive Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Zero-Trust Control Plane for Autonomous AI Agents</p>
        </div>
        <Link to="/app/judge" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition aegis-glow-cyan">
          Enter Judge Mode
        </Link>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Enterprise Health" value="100%" tone="green" icon={Activity} />
        <MetricCard label="Active Incidents" value={activeIncidents.length} tone={activeIncidents.length > 0 ? 'red' : 'green'} icon={Shield} />
        <MetricCard label="Agents Online" value={agentsOnline} tone="cyan" icon={Users} />
        <MetricCard label="Unsafe Blocked" value={metrics.unsafe_blocked} tone="red" icon={Ban} />
        <MetricCard label="Quarantined" value={metrics.quarantined_agents} tone="amber" icon={AlertTriangle} />
        <MetricCard label="Pending Approvals" value={pendingApprovals} tone="amber" icon={UserCheck} />
      </div>

      {/* Enterprise topology */}
      <Panel title="Enterprise Topology" subtitle="Identity → Network → Applications → Database → Cloud → Physical Edge">
        <EnterpriseTopology incidents={activeIncidents} />
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active incidents */}
        <Panel title="Active Incidents" subtitle={`${activeIncidents.length} ongoing`} right={<Link to="/app/incidents/INC-2026-0919-001" className="text-xs text-primary hover:underline">Open War Room →</Link>}>
          {activeIncidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Shield className="w-8 h-8 mx-auto mb-2 text-green-400" />
              All systems nominal. No active incidents.
            </div>
          ) : (
            <div className="space-y-3">
              {activeIncidents.map(inc => (
                <Link key={inc.id} to={`/app/incidents/${inc.id}`} className="block p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={inc.severity} />
                      <span className="aegis-mono text-xs text-muted-foreground">{inc.id}</span>
                    </div>
                    <StatusBadge status={inc.state} />
                  </div>
                  <div className="font-medium text-sm mt-2">{inc.title}</div>
                  {inc.leading_hypothesis && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Leading: <span className="text-primary">{inc.leading_hypothesis}</span> · {Math.round(inc.confidence * 100)}%
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Panel>

        {/* Recent action firewall events */}
        <Panel title="Recent Action Firewall Events" right={<Link to="/app/aegis-gate?tab=firewall" className="text-xs text-primary hover:underline">View all →</Link>}>
          <div className="space-y-2">
            {actionRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No action requests yet.</div>
            ) : (
              actionRequests.slice(-5).reverse().map(ar => (
                <div key={ar.id} className="flex items-center justify-between p-2.5 rounded bg-muted/20 border border-border text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ar.status} />
                    <span className="aegis-mono">{ar.action}</span>
                    <span className="text-muted-foreground">→ {ar.target}</span>
                  </div>
                  <span className="aegis-mono text-muted-foreground">{ar.id}</span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Integration status */}
        <Panel title="Integration Status" right={<Link to="/app/infrastructure?tab=integrations" className="text-xs text-primary hover:underline">Details →</Link>}>
          <div className="grid grid-cols-2 gap-2">
            {integrations.slice(0, 6).map(int => (
              <div key={int.id} className="flex items-center justify-between p-2 rounded bg-muted/20 border border-border">
                <span className="text-xs font-medium truncate">{int.provider}</span>
                <StatusBadge status={int.status} />
              </div>
            ))}
          </div>
        </Panel>

        {/* Edge status */}
        <Panel title="Edge Hardware" right={<Link to="/app/infrastructure?tab=edge" className="text-xs text-primary hover:underline">Details →</Link>}>
          <div className="space-y-1.5">
            {EDGE_DEVICES.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{d.name}</span>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function EnterpriseTopology({ incidents }) {
  const hasIncident = incidents.length > 0;
  const nodes = [
    { id: 'identity', label: 'IDENTITY', x: 50, y: 10 },
    { id: 'network', label: 'NETWORK', x: 20, y: 35 },
    { id: 'apps', label: 'APPLICATIONS', x: 50, y: 35 },
    { id: 'database', label: 'DATABASE', x: 80, y: 35 },
    { id: 'cloud', label: 'CLOUD', x: 50, y: 60 },
    { id: 'edge', label: 'PHYSICAL EDGE', x: 50, y: 85 },
  ];
  const edges = [
    ['identity', 'network'], ['identity', 'apps'], ['identity', 'database'],
    ['network', 'cloud'], ['apps', 'cloud'], ['database', 'cloud'],
    ['cloud', 'edge'],
  ];
  const compromised = hasIncident && incidents.some(i => i.severity === 'CRITICAL');

  return (
    <div className="relative" style={{ height: 280 }}>
      <svg className="absolute inset-0 w-full h-full">
        {edges.map(([from, to], i) => {
          const f = nodes.find(n => n.id === from);
          const t = nodes.find(n => n.id === to);
          const isEdgeActive = compromised && (to === 'edge' || from === 'edge');
          return (
            <line key={i}
              x1={`${f.x}%`} y1={`${f.y}%`} x2={`${t.x}%`} y2={`${t.y}%`}
              stroke={isEdgeActive ? '#f87171' : 'hsl(var(--primary))'}
              strokeWidth="1.5" opacity={isEdgeActive ? 0.6 : 0.2}
              strokeDasharray={isEdgeActive ? '4 4' : 'none'}
              className={isEdgeActive ? 'animate-aegis-dash' : ''}
            />
          );
        })}
      </svg>
      {nodes.map(n => {
        const isCompromised = compromised && (n.id === 'edge' || n.id === 'network');
        const isHealthy = !isCompromised;
        return (
          <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <div className={`px-3 py-2 rounded-lg border text-xs aegis-mono font-medium transition-all ${
              isCompromised ? 'bg-red-500/10 border-red-500/40 text-red-400 aegis-glow-red' :
              isHealthy ? 'bg-green-500/5 border-green-500/20 text-green-400' :
              'bg-card border-border text-foreground'
            }`}>
              {n.label}
              {isCompromised && <div className="text-[9px] text-red-400 mt-0.5 animate-aegis-pulse">● ALERT</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}