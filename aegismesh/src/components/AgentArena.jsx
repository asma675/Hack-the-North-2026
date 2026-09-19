import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AgentMascot } from '@/components/AgentMascot';
import { StatusBadge, TrustScore } from '@/components/aegis';
import { useAegis } from '@/lib/useAegis';

// Arena layout — spacious hex-grid spread to prevent bubble overlap
const POSITIONS = {
  'commander-01': { x: 50, y: 7 },
  'security-02':  { x: 16, y: 26 },
  'network-01':   { x: 84, y: 26 },
  'skeptic-01':   { x: 50, y: 42 },
  'telemetry-03': { x: 12, y: 58 },
  'change-01':    { x: 88, y: 58 },
  'verifier-01':  { x: 28, y: 80 },
  'executor-01':  { x: 72, y: 80 },
};

// Personality traits per agent for unique visual identity
const PERSONALITIES = {
  'commander-01': { aura: 'rgba(34,211,238,0.12)', ringStyle: 'double' },
  'security-02':  { aura: 'rgba(167,139,250,0.12)', ringStyle: 'dashed' },
  'network-01':   { aura: 'rgba(52,211,153,0.12)', ringStyle: 'solid' },
  'telemetry-03': { aura: 'rgba(251,191,36,0.10)', ringStyle: 'dotted' },
  'change-01':    { aura: 'rgba(244,114,182,0.10)', ringStyle: 'dashed' },
  'skeptic-01':   { aura: 'rgba(251,146,60,0.10)', ringStyle: 'solid' },
  'verifier-01':  { aura: 'rgba(34,211,238,0.10)', ringStyle: 'double' },
  'executor-01':  { aura: 'rgba(248,113,113,0.10)', ringStyle: 'dashed' },
};

const ROLE_LABELS = {
  'commander-01': '⚔ LEAD',
  'security-02':  '🛡 GUARD',
  'network-01':   '🌐 RELAY',
  'telemetry-03': '📡 SCAN',
  'change-01':    '⚙ SHIFT',
  'skeptic-01':   '🔍 DOUBT',
  'verifier-01':  '✓ PROOF',
  'executor-01':  '⚡ ACT',
};

const ROLE_COLORS = {
  'commander-01': '#22d3ee',
  'security-02': '#a78bfa',
  'network-01': '#34d399',
  'telemetry-03': '#fbbf24',
  'change-01': '#f472b6',
  'skeptic-01': '#fb923c',
  'verifier-01': '#22d3ee',
  'executor-01': '#f87171',
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
    <div className="relative w-full" ref={arenaRef}>
      {challengeLine && (
        <ChallengeLine from={POSITIONS[challengeLine.from]} to={POSITIONS[challengeLine.to]} />
      )}

      <div
        className={cn(
          'relative w-full overflow-hidden rounded-xl border border-border/60 bg-slate-950/40',
          compact ? 'h-[400px]' : 'h-[560px] md:h-[600px]'
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.06),_transparent_50%)]" />
        <div className="absolute inset-0 aegis-grid opacity-30" />

        <svg className="absolute inset-0 h-full w-full pointer-events-none" style={{ zIndex: 0 }}>
          {activeAgents.map(a => {
            const pos = POSITIONS[a.id];
            if (!pos || a.status === 'QUARANTINED' || a.status === 'IDLE') return null;
            return (
              <line
                key={a.id}
                x1="50%"
                y1="7%"
                x2={`${pos.x}%`}
                y2={`${pos.y}%`}
                stroke={a.color}
                strokeWidth="1"
                opacity="0.12"
                strokeDasharray="3 6"
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
          const personality = PERSONALITIES[agent.id] || { aura: 'transparent', ringStyle: 'solid' };
          const sideOffset = pos.x < 40 ? -24 : pos.x > 60 ? 24 : 0;

          return (
            <div
              key={agent.id}
              className="absolute z-10 w-[130px] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-[1.04]"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => setSelected(agent)}
            >
              {msg && !compact && (
                <SpeechBubble event={msg} agent={agent} isChallenging={isChallenging} sideOffset={sideOffset} />
              )}

              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'relative rounded-full border transition-all duration-300',
                    agent.status === 'QUARANTINED' ? 'border-slate-700/30 bg-slate-900/30' :
                    agent.status === 'INVESTIGATING' || agent.status === 'CHALLENGING' ? 'border-cyan-400/40 bg-cyan-500/5' :
                    'border-border/60 bg-slate-900/70',
                    isChallenged && 'ring-2 ring-amber-500/50 ring-offset-2 ring-offset-slate-950'
                  )}
                  style={{
                    padding: compact ? 5 : 7,
                    background: `radial-gradient(circle, ${personality.aura} 0%, transparent 70%)`,
                  }}
                >
                  <AgentMascot agent={agent} size={compact ? 48 : 64} />
                  {agent.status === 'INVESTIGATING' && (
                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                  )}
                  {!compact && (
                    <div
                      className="absolute -inset-1 rounded-full pointer-events-none"
                      style={{
                        border: `1px ${personality.ringStyle} ${agent.color}25`,
                        animation: 'aegis-pulse 3s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>

                <div className="mt-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn('text-[10px] font-medium leading-tight', agent.status === 'QUARANTINED' ? 'text-slate-500' : 'text-slate-100')}>
                      {agent.name}
                    </span>
                    {!compact && ROLE_LABELS[agent.id] && (
                      <span className="text-[7px] aegis-mono font-bold tracking-wider px-1 py-0.5 rounded-[1px]" style={{ color: ROLE_COLORS[agent.id], background: `${ROLE_COLORS[agent.id]}15`, border: `1px solid ${ROLE_COLORS[agent.id]}30` }}>
                        {ROLE_LABELS[agent.id]}
                      </span>
                    )}
                  </div>
                  {!compact && (
                    <div className="mt-1 flex justify-center">
                      <TrustScore score={agent.trust_score} size="sm" />
                    </div>
                  )}
                  {!compact && agent.status !== 'IDLE' && (
                    <div className="mt-1.5 flex justify-center">
                      <StatusBadge status={agent.status} className="px-1.5 py-0.5 text-[8px]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <AgentDetailPopover agent={selected} events={events} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function SpeechBubble({ event, agent, isChallenging, sideOffset = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const text = event.data.short || event.data.full;
  const color = agent.color || '#22d3ee';
  const confidence = event.data.confidence;
  const time = new Date(event.ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      className={cn(
        'absolute bottom-full mb-1 left-1/2 -translate-x-1/2 max-w-[180px] min-w-[120px] transition-all duration-500 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      style={{ zIndex: 20, marginLeft: `${sideOffset}px` }}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          isChallenging
            ? 'border border-pink-500/25 bg-pink-500/[0.06]'
            : 'border border-border/70 bg-[#10131c]/85'
        )}
        style={{
          boxShadow: `0 2px 12px -4px ${color}25, 0 0 0 1px ${color}08, inset 0 1px 0 ${color}12`,
          backdropFilter: 'blur(12px)',
          borderRadius: '2px',
        }}
      >
        <div className="h-[2px] w-full relative overflow-hidden">
          <div style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} className="h-full w-full" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)`, animation: 'aegis-bubble-scan 3s ease-in-out infinite' }} />
        </div>
        <div className="absolute left-0 top-[2px] bottom-0 w-[3px] animate-aegis-bubble-bar" style={{ background: color, boxShadow: `0 0 6px ${color}80, 0 0 12px ${color}40` }} />
        <div className="px-2.5 pt-2 pb-1.5 pl-[12px]">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] aegis-mono uppercase tracking-[0.14em] font-bold" style={{ color }}>
              {agent.name}
            </span>
            <span className="text-[7px] aegis-mono text-muted-foreground/70">{time}</span>
          </div>
          <div className="text-[10px] leading-snug text-foreground/85">{text}</div>
          {confidence != null && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex-1 h-[2px] rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${confidence * 100}%`, background: color, boxShadow: `0 0 4px ${color}60` }}
                />
              </div>
              <span className="text-[7px] aegis-mono font-bold" style={{ color }}>{Math.round(confidence * 100)}%</span>
            </div>
          )}
          {event.data.tool && (
            <div className="mt-1 text-[7px] aegis-mono text-muted-foreground/60">
              ↳ {event.data.tool}
            </div>
          )}
        </div>
        {isChallenging && (
          <div className="px-2.5 pb-1.5 pl-[12px]">
            <span className="inline-block text-[7px] aegis-mono font-bold uppercase tracking-[0.15em] text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded-[1px]">
              ⚑ CHALLENGED
            </span>
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `5px solid ${isChallenging ? 'rgba(244,114,182,0.18)' : 'rgba(16,19,28,0.9)'}`,
            filter: `drop-shadow(0 -1px 2px ${color}25)`,
          }}
        />
      </div>
      <div className="flex justify-center" style={{ marginTop: '-4px' }}>
        <div className="w-[2px] h-[2px] rounded-full" style={{ background: color, opacity: 0.6 }} />
      </div>
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