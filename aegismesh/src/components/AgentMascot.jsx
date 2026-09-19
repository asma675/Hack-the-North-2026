import { cn } from '@/lib/utils';

const ROLE_SYMBOLS = {
  'commander-01': '◈',
  'telemetry-03': '◎',
  'security-02': '▣',
  'network-01': '◌',
  'change-01': '△',
  'skeptic-01': '✦',
  'verifier-01': '⚖',
  'executor-01': '⟡',
};

export function AgentMascot({ agent, size = 64, animate = true, className }) {
  const color = agent.color || '#22d3ee';
  const quarantined = agent.status === 'QUARANTINED';
  const fill = quarantined ? '#64748b' : color;
  const symbol = ROLE_SYMBOLS[agent.id] || '◉';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full border transition-all duration-300',
        className
      )}
      style={{
        width: size,
        height: size,
        background: quarantined ? 'rgba(15, 23, 42, 0.5)' : 'rgba(15, 23, 42, 0.9)',
        borderColor: quarantined ? 'rgba(100, 116, 139, 0.3)' : `${fill}88`,
        boxShadow: `0 0 18px ${fill}44`,
      }}
    >
      <div
        className={cn('flex items-center justify-center rounded-full text-center font-black tracking-tight', animate && agent.status === 'INVESTIGATING' ? 'animate-aegis-pulse' : '')}
        style={{
          width: size * 0.68,
          height: size * 0.68,
          color: fill,
          background: 'rgba(15, 23, 42, 0.95)',
          fontSize: Math.max(18, size * 0.26),
        }}
      >
        {symbol}
      </div>

      {quarantined && (
        <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full border border-slate-950 bg-slate-700">
          <span className="text-[6px] font-black text-slate-400 leading-none">⊘</span>
        </div>
      )}
    </div>
  );
}