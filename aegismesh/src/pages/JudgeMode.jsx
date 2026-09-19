import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAegis } from '@/lib/useAegis';
import { SCENARIO } from '@/lib/aegisEngine';
import { AgentArena } from '@/components/AgentArena';
import { Panel, StatusBadge, MetricCard } from '@/components/aegis';
import { Shield, AlertTriangle, Ban, UserCheck, Users, RotateCcw, Play, Bug } from 'lucide-react';

const STAGES = [
  { key: 'HEALTHY', label: '1 · Healthy', color: '#34d399' },
  { key: 'FALSE_ALARM', label: '2 · False Alarm', color: '#22d3ee' },
  { key: 'BREACH', label: '3 · Breach', color: '#fbbf24' },
  { key: 'AGENT_COMPROMISE', label: '4 · Agent Compromise', color: '#f87171' },
  { key: 'HUMAN_APPROVAL', label: '5 · Human Approval', color: '#a78bfa' },
  { key: 'CONTAINMENT', label: '6 · Containment', color: '#34d399' },
];

export default function JudgeMode() {
  const { runScenario, injectPoison, approveAction, reset, incidents, agents, metrics, actionRequests, currentScenario, integrations } = useAegis();
  const [stage, setStage] = useState(0);
  const [showNFC, setShowNFC] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const [hideControls, setHideControls] = useState(false);

  const activeIncident = incidents.find(i => i.state !== 'CONTAINED' && i.state !== 'RESOLVED');
  const pendingAction = actionRequests.find(a => a.status === 'APPROVAL_REQUIRED');

  useEffect(() => {
    if (currentScenario === SCENARIO.FALSE_ALARM) setStage(1);
    else if (currentScenario === SCENARIO.BREACH) setStage(2);
    else if (currentScenario === SCENARIO.POISONED) setStage(3);
    else if (currentScenario === SCENARIO.APPROVAL) setStage(4);
    else if (currentScenario === SCENARIO.CONTAINMENT) setStage(5);
  }, [currentScenario]);

  const handleFalseAlarm = () => { reset(); setStage(0); setShowFinal(false); setTimeout(() => runScenario(SCENARIO.FALSE_ALARM), 200); };
  const handleBreach = () => { reset(); setStage(0); setShowFinal(false); setTimeout(() => runScenario(SCENARIO.BREACH), 200); };
  const handlePoison = () => { injectPoison(); };
  const handleApprove = () => {
    setShowNFC(true);
    setTimeout(() => {
      const ar = actionRequests.find(a => a.status === 'APPROVAL_REQUIRED');
      if (ar) approveAction(ar.id);
      setShowNFC(false);
      setTimeout(() => setShowFinal(true), 2500);
    }, 2500);
  };
  const handleReset = () => { reset(); setStage(0); setShowFinal(false); setShowNFC(false); };

  if (showFinal) return <FinalScreen metrics={metrics} onReset={handleReset} />;

  return (
    <div className={cn('p-6 space-y-4 max-w-[1400px] mx-auto relative', showNFC && 'pointer-events-none')}>
      {/* Stage indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Judge Mode</h1>
          <p className="text-sm text-muted-foreground mt-1">90-second demonstration — the three moments judges remember</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] aegis-mono px-2 py-1 border ${integrations?.some(i => i.status === "LIVE") ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>{integrations?.some(i => i.status === "LIVE") ? `HYBRID LIVE · ${integrations.filter(i => i.status === "LIVE").length} PROVIDER${integrations.filter(i => i.status === "LIVE").length === 1 ? "" : "S"}` : "DEMO SIMULATION"}</span>
          <button onClick={() => setHideControls(!hideControls)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border">
            {hideControls ? 'Show' : 'Hide'} Controls
          </button>
        </div>
      </div>

      {/* Stage progress */}
      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex-1">
            <div className={cn('h-1 rounded-full transition-all duration-500', i <= stage ? '' : 'bg-muted/40')} style={{ background: i <= stage ? s.color : undefined }}>
              <div className={cn('h-1 rounded-full', i === stage && 'animate-aegis-pulse')} style={{ background: s.color, boxShadow: i === stage ? `0 0 8px ${s.color}` : 'none' }} />
            </div>
            <div className={cn('text-[9px] aegis-mono mt-1.5 truncate', i === stage ? 'text-foreground' : 'text-muted-foreground')} style={{ color: i === stage ? s.color : undefined }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Presenter controls */}
      {!hideControls && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-card/60 border border-border">
          <span className="text-[10px] aegis-mono text-muted-foreground uppercase">Presenter Controls</span>
          <button onClick={handleFalseAlarm} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition">
            <Play className="w-3 h-3" /> Start False Alarm
          </button>
          <button onClick={handleBreach} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition">
            <Play className="w-3 h-3" /> Start Breach
          </button>
          <button onClick={handlePoison} disabled={stage < 2} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition disabled:opacity-30">
            <Bug className="w-3 h-3" /> Inject Poison
          </button>
          {pendingAction && (
            <button onClick={handleApprove} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-violet-500/10 text-violet-400 border border-violet-500/30 hover:bg-violet-500/20 transition animate-aegis-pulse">
              <Shield className="w-3 h-3" /> Tap NFC Badge
            </button>
          )}
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50 transition ml-auto">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: Incident status */}
        <div className="space-y-4">
          <Panel title="Incident Status">
            {activeIncident ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={activeIncident.severity} />
                  <StatusBadge status={activeIncident.state} />
                </div>
                <div className="font-display font-bold">{activeIncident.title}</div>
                <div className="aegis-mono text-xs text-muted-foreground">{activeIncident.id}</div>
                {activeIncident.leading_hypothesis && (
                  <div className="p-3 rounded bg-primary/5 border border-primary/20">
                    <div className="text-[10px] aegis-mono text-muted-foreground">LEADING HYPOTHESIS</div>
                    <div className="text-sm font-medium text-primary mt-1">{activeIncident.leading_hypothesis}</div>
                    <div className="text-2xl font-bold aegis-text-cyan mt-1">{Math.round(activeIncident.confidence * 100)}%</div>
                  </div>
                )}
                <StateMachine currentState={activeIncident.state} />
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="w-10 h-10 mx-auto mb-2 text-green-400" />
                <div className="text-sm font-medium text-green-400">System Healthy</div>
                <div className="text-xs text-muted-foreground mt-1">No active incidents</div>
              </div>
            )}
          </Panel>

          {/* Live metrics */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Agents" value={agents.filter(a => a.status !== 'IDLE' && a.status !== 'QUARANTINED').length} tone="cyan" icon={Users} />
            <MetricCard label="Blocked" value={metrics.unsafe_blocked} tone="red" icon={Ban} />
            <MetricCard label="Quarantined" value={metrics.quarantined_agents} tone="amber" icon={AlertTriangle} />
            <MetricCard label="Approvals" value={metrics.human_approvals} tone="green" icon={UserCheck} />
          </div>
        </div>

        {/* Center: Agent Arena */}
        <Panel title="Agent Arena" subtitle="openJiuwen multi-agent collaboration" className="lg:col-span-2" bodyClassName="p-2">
          <AgentArena compact={false} incidentId={activeIncident?.id} />
        </Panel>
      </div>

      {/* NFC overlay */}
      {showNFC && <NFCOverlay />}
    </div>
  );
}

function StateMachine({ currentState }) {
  const states = ['DETECTED', 'TRIAGE', 'INVESTIGATING', 'CONTESTING', 'CONSENSUS', 'SIMULATING', 'APPROVAL', 'EXECUTING', 'VERIFYING', 'CONTAINED'];
  const currentIdx = states.indexOf(currentState);
  return (
    <div>
      <div className="text-[10px] aegis-mono text-muted-foreground mb-2">INCIDENT STATE MACHINE</div>
      <div className="flex flex-wrap gap-1">
        {states.map((s, i) => (
          <div key={s} className={cn('text-[9px] aegis-mono px-1.5 py-0.5 rounded border transition-all',
            i === currentIdx ? 'bg-primary/20 text-primary border-primary/40 aegis-glow-cyan' :
            i < currentIdx ? 'bg-green-500/10 text-green-400/70 border-green-500/20' :
            'bg-muted/20 text-muted-foreground border-border'
          )}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function NFCOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-aegis-fade-in">
      <div className="text-center">
        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/40 animate-aegis-pulse-ring" />
          <div className="absolute inset-4 rounded-full border-2 border-violet-500/30 animate-aegis-pulse-ring" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-8 rounded-full border-2 border-violet-500/20 animate-aegis-pulse-ring" style={{ animationDelay: '0.6s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-16 h-16 text-violet-400 animate-aegis-pulse" />
          </div>
        </div>
        <div className="mt-6 text-lg font-display font-bold text-violet-300">TAP SECURITY BADGE</div>
        <div className="text-sm text-muted-foreground mt-2 aegis-mono">Human authorization required</div>
        <div className="text-[10px] aegis-mono text-muted-foreground mt-1">Dual-Control AI · Key 2 of 2</div>
      </div>
    </div>
  );
}

function FinalScreen({ metrics, onReset }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-aegis-fade-in">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <div className="text-green-400 text-sm aegis-mono tracking-widest mb-2">● THREAT CONTAINED</div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Containment Successful</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard label="Unsafe Actions Blocked" value={metrics.unsafe_blocked} tone="red" />
          <MetricCard label="Agents Quarantined" value={metrics.quarantined_agents} tone="amber" />
          <MetricCard label="Human Approvals" value={metrics.human_approvals} tone="green" />
          <MetricCard label="Agents Collaborating" value="7" tone="cyan" />
          <MetricCard label="Time to Containment" value="00:33" tone="cyan" />
          <MetricCard label="Challenges Issued" value="4" tone="amber" />
        </div>

        <div className="space-y-4 py-8">
          <p className="text-xl font-display text-foreground">AI can be wrong.</p>
          <p className="text-xl font-display text-amber-400">AI can be compromised.</p>
          <p className="text-xl font-display text-primary">It still should not exceed its authority.</p>
        </div>

        <div className="pt-8 border-t border-border">
          <h2 className="text-3xl font-display font-bold tracking-tight aegis-text-cyan">Vanguard</h2>
          <p className="text-sm text-muted-foreground mt-2 aegis-mono tracking-wider">INVESTIGATE · CHALLENGE · CONTROL</p>
        </div>

        <button onClick={onReset} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition aegis-glow-cyan">
          Reset Demonstration
        </button>
      </div>
    </div>
  );
}