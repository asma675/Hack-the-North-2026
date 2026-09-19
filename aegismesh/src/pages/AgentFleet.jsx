import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAegis } from '@/lib/useAegis';
import { AgentMascot } from '@/components/AgentMascot';
import { Panel, StatusBadge, TrustScore } from '@/components/aegis';
import { cn } from '@/lib/utils';

const FILTERS = ['ALL', 'ACTIVE', 'IDLE', 'QUARANTINED'];

export default function AgentFleet() {
  const { agents } = useAegis();
  const [filter, setFilter] = useState('ALL');

  const filtered = agents.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return a.status === 'INVESTIGATING' || a.status === 'CHALLENGING' || a.status === 'CHALLENGED' || a.status === 'COMPLETE';
    if (filter === 'IDLE') return a.status === 'IDLE';
    if (filter === 'QUARANTINED') return a.status === 'QUARANTINED';
    return true;
  });

  const active = agents.filter(a => a.status !== 'IDLE' && a.status !== 'QUARANTINED').length;
  const quarantined = agents.filter(a => a.status === 'QUARANTINED').length;
  const idle = agents.filter(a => a.status === 'IDLE').length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Agent Fleet</h1>
        <p className="text-sm text-muted-foreground mt-1">Registered autonomous agents under AegisMesh governance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="aegis-panel p-4 rounded-lg text-center">
          <div className="text-2xl font-bold aegis-text-cyan">{agents.length}</div>
          <div className="text-[10px] aegis-mono text-muted-foreground mt-1">REGISTERED</div>
        </div>
        <div className="aegis-panel p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">{active}</div>
          <div className="text-[10px] aegis-mono text-muted-foreground mt-1">ACTIVE</div>
        </div>
        <div className="aegis-panel p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-400">{quarantined}</div>
          <div className="text-[10px] aegis-mono text-muted-foreground mt-1">QUARANTINED</div>
        </div>
        <div className="aegis-panel p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-muted-foreground">{idle}</div>
          <div className="text-[10px] aegis-mono text-muted-foreground mt-1">IDLE</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/20 border border-border w-fit">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-3 py-1.5 rounded text-xs aegis-mono transition',
            filter === f ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
          )}>
            {f}
          </button>
        ))}
      </div>

      {/* Agent grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(agent => (
          <Link key={agent.id} to={`/app/agents/${agent.id}`} className="block">
            <div className={cn('aegis-panel rounded-lg p-4 hover:border-primary/30 transition group',
              agent.status === 'QUARANTINED' && 'border-red-500/30')}>
              <div className="flex items-start justify-between mb-3">
                <AgentMascot agent={agent} size={56} animate={false} />
                <TrustScore score={agent.trust_score} size="sm" />
              </div>
              <div className="font-display font-bold text-sm">{agent.name}</div>
              <div className="text-[10px] text-muted-foreground aegis-mono mt-0.5">{agent.role}</div>
              <div className="flex items-center justify-between mt-3">
                <StatusBadge status={agent.status} />
                <span className="text-[10px] aegis-mono text-muted-foreground">{agent.provider}</span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground truncate">
                {agent.current_task || 'No active task'}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] aegis-mono text-muted-foreground">
                <span>{agent.tools.length} tools</span>
                <span className={agent.violations > 0 ? 'text-red-400' : ''}>{agent.violations} violations</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}