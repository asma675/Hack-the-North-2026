import { useState } from 'react';
import { useAegis } from '@/lib/useAegis';
import { Panel, StatusBadge, MetricCard } from '@/components/aegis';
import { Ban, UserCheck, ShieldCheck, AlertTriangle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = ['LIVE', 'BLOCKED', 'APPROVED', 'EXECUTED'];

export default function ActionFirewall() {
  const { actionRequests, metrics } = useAegis();
  const [tab, setTab] = useState('LIVE');

  const filtered = actionRequests.filter(a => {
    if (tab === 'LIVE') return true;
    if (tab === 'BLOCKED') return a.status === 'BLOCKED';
    if (tab === 'APPROVED') return a.status === 'APPROVED' || a.status === 'APPROVAL_REQUIRED';
    if (tab === 'EXECUTED') return a.status === 'EXECUTED';
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Aegis Action Firewall</h1>
        <p className="text-sm text-muted-foreground mt-1">Every production request — inspected, governed, audited</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Actions Inspected" value={metrics.actions_inspected} tone="cyan" icon={Eye} />
        <MetricCard label="Unsafe Blocked" value={metrics.unsafe_blocked} tone="red" icon={Ban} />
        <MetricCard label="Human Approvals" value={metrics.human_approvals} tone="green" icon={UserCheck} />
        <MetricCard label="Auto Approvals" value={metrics.automatic_approvals} tone="cyan" icon={ShieldCheck} />
        <MetricCard label="Quarantined Agents" value={metrics.quarantined_agents} tone="amber" icon={AlertTriangle} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/20 border border-border w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded text-xs aegis-mono transition',
            tab === t ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
          )}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <Panel title="Action Requests" subtitle={`${filtered.length} matching`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] aegis-mono text-muted-foreground uppercase border-b border-border">
                <th className="py-2 px-2">Agent</th>
                <th className="py-2 px-2">Action</th>
                <th className="py-2 px-2">Target</th>
                <th className="py-2 px-2">Permission</th>
                <th className="py-2 px-2">Confidence</th>
                <th className="py-2 px-2">Risk</th>
                <th className="py-2 px-2">Blast</th>
                <th className="py-2 px-2">Reversible</th>
                <th className="py-2 px-2">Policy</th>
                <th className="py-2 px-2">Approval</th>
                <th className="py-2 px-2">Result</th>
                <th className="py-2 px-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-8 text-muted-foreground">No requests in this filter.</td></tr>
              ) : (
                filtered.reverse().map(ar => (
                  <tr key={ar.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                    <td className="py-2 px-2 aegis-mono">{ar.agent_id}</td>
                    <td className="py-2 px-2 aegis-mono text-primary">{ar.action}</td>
                    <td className="py-2 px-2 aegis-mono">{ar.target}</td>
                    <td className="py-2 px-2">
                      <span className={ar.status === 'BLOCKED' ? 'text-red-400' : 'text-green-400'}>{ar.status === 'BLOCKED' ? '✕' : '✓'}</span>
                    </td>
                    <td className="py-2 px-2 aegis-mono">{Math.round(ar.verifier_confidence * 100)}%</td>
                    <td className="py-2 px-2"><StatusBadge status={ar.risk} /></td>
                    <td className="py-2 px-2 text-muted-foreground">{ar.blast_radius}</td>
                    <td className="py-2 px-2 aegis-mono">{ar.reversible ? 'YES' : 'NO'}</td>
                    <td className="py-2 px-2">
                      <span className={ar.status === 'BLOCKED' ? 'text-red-400' : 'text-green-400'}>{ar.status === 'BLOCKED' ? '✕' : '✓'}</span>
                    </td>
                    <td className="py-2 px-2">{ar.human_required ? <span className="text-amber-400">REQUIRED</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2 px-2"><StatusBadge status={ar.status} /></td>
                    <td className="py-2 px-2 aegis-mono text-muted-foreground">{new Date(ar.created_at).toLocaleTimeString('en-US', { hour12: false }).slice(0, 8)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}