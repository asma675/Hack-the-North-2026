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
  const fill = quarantined ? '#f87171' : color;
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
        background: quarantined ? 'rgba(239, 68, 68, 0.12)' : 'rgba(15, 23, 42, 0.9)',
        borderColor: quarantined ? 'rgba(248, 113, 113, 0.75)' : `${fill}88`,
        boxShadow: quarantined ? '0 0 12px rgba(239, 68, 68, 0.45)' : `0 0 18px ${fill}44`,
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-red-500/60 bg-red-500/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.18em] text-red-300">
            Q
          </div>
        </div>
      )}
    </div>
  );
}