import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AgentMascot } from '@/components/AgentMascot';
import { StatusBadge, TrustScore } from '@/components/aegis';
import { useAegis } from '@/lib/useAegis';

// Arena layout:
//           Commander
//      Security   Network
//      Telemetry  Change
//           Skeptic
//          Verifier
//          Executor

const POSITIONS = {
  'commander-01': { x: 50, y: 8 },
  'security-02': { x: 25, y: 28 },
  'network-01': { x: 75, y: 28 },
  'telemetry-03': { x: 25, y: 50 },
  'change-01': { x: 75, y: 50 },
  'skeptic-01': { x: 50, y: 68 },
  'verifier-01': { x: 50, y: 84 },
  'executor-01': { x: 50, y: 98 },
};

export function AgentArena({ incidentId, compact = false }) {
  const { agents, events } = useAegis();
  const [selected, setSelected] = useState(null);
  const [challengeLine, setChallengeLine] = useState(null);
  const arenaRef = useRef(null);

  // Detect challenge events to draw challenge lines
  useEffect(() => {
    const challenges = events.filter(e => e.type === 'agent.challenge');
    if (challenges.length > 0) {
      const last = challenges[challenges.length - 1];
      setChallengeLine({ from: last.data.agent_id, to: last.data.target, id: last.ts });
      const timer = setTimeout(() => setChallengeLine(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [events]);

  const activeAgents = incidentId
    ? agents.filter(a => a.current_incident_id === incidentId || a.status === 'QUARANTINED')
    : agents;

  const latestMessages = {};
  events.forEach(e => {
    if (e.type === 'agent.message' || e.type === 'agent.challenge') {
      latestMessages[e.data.agent_id] = e;
    }
  });

  return (
    <div className="relative" ref={arenaRef}>
      {/* Challenge line SVG overlay */}
      {challengeLine && (
        <ChallengeLine from={POSITIONS[challengeLine.from]} to={POSITIONS[challengeLine.to]} />
      )}

      <div className={cn('relative grid', compact ? 'gap-1' : 'gap-2')} style={{ minHeight: compact ? 320 : 480 }}>
        {/* Connection lines background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {activeAgents.map(a => {
            const pos = POSITIONS[a.id];
            if (!pos || a.status === 'QUARANTINED' || a.status === 'IDLE') return null;
            return (
              <line
                key={a.id}
                x1="50%" y1="8%" x2={`${pos.x}%`} y2={`${pos.y}%`}
                stroke={a.color} strokeWidth="1" opacity="0.15" strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {activeAgents.map(agent => {
          const pos = POSITIONS[agent.id];
          if (!pos) return null;
          const msg = latestMessages[agent.id];
          const isChallenging = agent.status === 'CHALLENGING';
          const isChallenged = agent.status === 'CHALLENGED';
          return (
            <div
              key={agent.id}
              className="absolute flex flex-col items-center transition-all duration-500 cursor-pointer group"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
              onClick={() => setSelected(agent)}
            >
              {/* Speech bubble */}
              {msg && !compact && (
                <SpeechBubble event={msg} agent={agent} isChallenging={isChallenging} />
              )}

              {/* Mascot */}
              <div className={cn(
                'relative rounded-full p-1.5 transition-all',
                agent.status === 'QUARANTINED' ? 'bg-red-500/10 border border-red-500/40' :
                agent.status === 'INVESTIGATING' || agent.status === 'CHALLENGING' ? 'bg-primary/5 border border-primary/20' :
                'bg-muted/20 border border-border',
                isChallenged && 'ring-2 ring-amber-500/50 ring-offset-2 ring-offset-background'
              )}>
                <AgentMascot agent={agent} size={compact ? 44 : 64} />
                {agent.status === 'INVESTIGATING' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-cyan-400 border-2 border-background animate-aegis-pulse" />
                )}
              </div>

              {/* Label */}
              <div className="mt-1.5 text-center">
                <div className={cn('text-[11px] font-medium', agent.status === 'QUARANTINED' ? 'text-red-400' : 'text-foreground')}>
                  {agent.name}
                </div>
                {!compact && (
                  <div className="flex items-center gap-1 mt-0.5 justify-center">
                    <TrustScore score={agent.trust_score} size="sm" />
                  </div>
                )}
                {!compact && agent.status !== 'IDLE' && (
                  <StatusBadge status={agent.status} className="mt-1" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail popover */}
      {selected && (
        <AgentDetailPopover agent={selected} events={events} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function SpeechBubble({ event, agent, isChallenging }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);
  const text = event.data.short || event.data.full;
  return (
    <div
      className={cn(
        'absolute bottom-full mb-2 left-1/2 -translate-x-1/2 max-w-[200px] transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      style={{ zIndex: 20 }}
    >
      <div className={cn(
        'px-3 py-2 rounded-lg text-[11px] leading-snug border backdrop-blur-md',
        isChallenging ? 'bg-pink-500/10 border-pink-500/30 text-pink-200' : 'bg-card/90 border-border text-foreground'
      )}>
        {isChallenging && <div className="text-[9px] aegis-mono text-pink-400 mb-0.5">CHALLENGED</div>}
        {text}
      </div>
      <div className={cn(
        'w-2 h-2 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2',
        isChallenging ? 'bg-pink-500/10 border-r border-b border-pink-500/30' : 'bg-card/90 border-r border-b border-border'
      )} />
    </div>
  );
}

function ChallengeLine({ from, to }) {
  if (!from || !to) return null;
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <defs>
        <linearGradient id="challenge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <line
        x1={`${from.x}%`} y1={`${from.y}%`}
        x2={`${to.x}%`} y2={`${to.y}%`}
        stroke="url(#challenge-grad)" strokeWidth="2"
        strokeDasharray="6 4" className="animate-aegis-dash"
      />
      <text x="50%" y="50%" fill="#f472b6" fontSize="9" className="aegis-mono font-bold" textAnchor="middle">
        CHALLENGED
      </text>
    </svg>
  );
}

function AgentDetailPopover({ agent, events, onClose }) {
  const agentEvents = events.filter(e => e.data.agent_id === agent.id).slice(-8);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-aegis-fade-in" onClick={onClose}>
      <div className="aegis-panel max-w-lg w-full mx-4 rounded-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <AgentMascot agent={agent} size={56} />
            <div>
              <div className="font-display font-bold text-lg">{agent.name}</div>
              <div className="text-xs text-muted-foreground">{agent.role}</div>
              <div className="text-[10px] aegis-mono text-muted-foreground mt-1">Provider: {agent.provider}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <TrustScore score={agent.trust_score} size="lg" />
              <div className="text-[10px] text-muted-foreground mt-1 aegis-mono">TRUST</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold aegis-text-cyan">{agent.tools.length}</div>
              <div className="text-[10px] text-muted-foreground aegis-mono">TOOLS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold aegis-text-red">{agent.violations}</div>
              <div className="text-[10px] text-muted-foreground aegis-mono">VIOLATIONS</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] aegis-mono text-muted-foreground mb-2">CAPABILITIES</div>
            <div className="flex flex-wrap gap-1.5">
              {agent.permissions.map(p => (
                <span key={p} className="text-[10px] aegis-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">✓ {p}</span>
              ))}
              {agent.denied.map(p => (
                <span key={p} className="text-[10px] aegis-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">✕ {p}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] aegis-mono text-muted-foreground mb-2">RECENT ACTIVITY</div>
            <div className="space-y-2">
              {agentEvents.length === 0 && <div className="text-xs text-muted-foreground">No activity yet.</div>}
              {agentEvents.map((e, i) => (
                <div key={i} className="text-xs border-l-2 border-primary/30 pl-3 py-1">
                  <div className="text-muted-foreground text-[10px] aegis-mono">{new Date(e.ts).toLocaleTimeString()} · {e.type}</div>
                  <div className="mt-0.5">{e.data.short || e.data.full || e.data.task || e.data.reason || JSON.stringify(e.data).slice(0, 120)}</div>
                  {e.data.confidence != null && <div className="text-[10px] aegis-mono text-primary mt-0.5">Confidence: {Math.round(e.data.confidence * 100)}%</div>}
                  {e.data.tool && <div className="text-[10px] aegis-mono text-muted-foreground mt-0.5">Tool: {e.data.tool}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}