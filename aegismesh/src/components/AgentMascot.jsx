import { cn } from '@/lib/utils';

const AGENT_IMAGES = {
  'commander-01': '/agents/1.png',
  'telemetry-03': '/agents/2.png',
  'security-02': '/agents/3.png',
  'network-01': '/agents/4.png',
  'change-01': '/agents/5.png',
  'skeptic-01': '/agents/6.png',
  'verifier-01': '/agents/7.png',
  // The Arena has eight agent records but seven supplied portraits.
  'executor-01': '/agents/1.png',
};

export function AgentMascot({ agent, size = 64, animate = true, className }) {
  const color = agent.color || '#22d3ee';
  const quarantined = agent.status === 'QUARANTINED';
  const fill = quarantined ? '#64748b' : color;
  const image = AGENT_IMAGES[agent.id];

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
        className={cn('flex items-center justify-center overflow-hidden rounded-full text-center font-black tracking-tight', animate && agent.status === 'INVESTIGATING' ? 'animate-aegis-pulse' : '')}
        style={{
          width: size * 0.96,
          height: size * 0.96,
        }}
      >
        {image ? (
          <img src={image} alt={`${agent.name} avatar`} className="h-full w-full object-cover" />
        ) : (
          <span style={{ color: fill, fontSize: Math.max(18, size * 0.26) }}>◉</span>
        )}
      </div>

      {quarantined && (
        <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full border border-slate-950 bg-slate-700">
          <span className="text-[6px] font-black text-slate-400 leading-none">⊘</span>
        </div>
      )}
    </div>
  );
}