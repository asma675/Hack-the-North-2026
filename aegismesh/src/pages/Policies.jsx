import { Panel, StatusBadge } from '@/components/aegis';
import { POLICIES } from '@/lib/aegisEngine';
import { Settings, Plus, Check } from 'lucide-react';

const TEMPLATES = [
  'network isolation',
  'credential rotation',
  'production restart',
  'account disable',
  'power control',
  'read-only investigation',
];

export default function Policies() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Policy Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Governed rules that determine which actions are permitted, and under what conditions</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs hover:bg-primary/20 transition">
          <Plus className="w-3.5 h-3.5" /> New Policy
        </button>
      </div>

      {/* Policy cards */}
      <div className="space-y-4">
        {POLICIES.map(p => (
          <div key={p.id} className="aegis-panel rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-display font-bold">{p.name}</div>
                  <div className="text-xs text-muted-foreground aegis-mono mt-0.5">Action: {p.action}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.human_required && <StatusBadge status="APPROVAL_REQUIRED" />}
                <span className={`text-[10px] aegis-mono px-2 py-1 rounded border ${p.enabled ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                  {p.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>

            {/* Policy expression */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] aegis-mono text-muted-foreground mb-2">WHEN</div>
                <div className="p-3 rounded bg-muted/20 border border-border font-mono text-xs leading-relaxed">
                  <span className="text-primary">action</span> == <span className="text-amber-400">{p.action}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] aegis-mono text-muted-foreground mb-2">REQUIRE</div>
                <div className="p-3 rounded bg-muted/20 border border-border font-mono text-xs leading-relaxed space-y-1">
                  <div><span className="text-primary">agent.role</span> == <span className="text-amber-400">{p.allowed_roles.join(' / ')}</span></div>
                  <div><span className="text-primary">verifier.confidence</span> {'>='} <span className="text-amber-400">{p.minimum_confidence}</span></div>
                  {p.human_required && <div><span className="text-primary">human_approval</span> == <span className="text-amber-400">true</span></div>}
                  {p.action === 'power.cut' && <div><span className="text-primary">dual_control</span> == <span className="text-amber-400">true</span></div>}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Min Confidence:</span>
                <span className="aegis-mono text-primary">{Math.round(p.minimum_confidence * 100)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Allowed Roles:</span>
                <span className="aegis-mono">{p.allowed_roles.join(', ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Templates */}
      <Panel title="Policy Templates" subtitle="Pre-built governance rules">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TEMPLATES.map(t => (
            <div key={t} className="flex items-center gap-2 p-3 rounded bg-muted/20 border border-border hover:border-primary/30 transition cursor-pointer text-xs">
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="capitalize">{t}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}