import { cn } from '@/lib/utils';

// Each mascot is a distinct animal silhouette with a role accessory.
// Colors come from the agent template. Kept restrained — enterprise-grade with personality.

export function AgentMascot({ agent, size = 64, animate = true, className }) {
  const color = agent.color || '#22d3ee';
  const quarantined = agent.status === 'QUARANTINED';
  const fill = quarantined ? '#f87171' : color;
  const glow = quarantined ? 'drop-shadow(0 0 8px #f87171)' : `drop-shadow(0 0 6px ${color}66)`;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ filter: glow }} className={animate && agent.status === 'INVESTIGATING' ? 'animate-aegis-pulse' : ''}>
        <MascotBody agent={agent} fill={fill} />
      </svg>
      {quarantined && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[8px] aegis-mono font-bold text-red-400 bg-red-500/20 px-1 rounded border border-red-500/40 animate-aegis-stamp">QUARANTINED</div>
        </div>
      )}
    </div>
  );
}

function MascotBody({ agent, fill }) {
  const accessory = agent.accessory;
  // Each agent gets a unique animal
  switch (agent.id.split('-')[0]) {
    case 'commander': return <BearMascot fill={fill} accessory={accessory} />;
    case 'telemetry': return <FoxMascot fill={fill} accessory={accessory} />;
    case 'security': return <TurtleMascot fill={fill} accessory={accessory} />;
    case 'network': return <OwlMascot fill={fill} accessory={accessory} />;
    case 'change': return <BeaverMascot fill={fill} accessory={accessory} />;
    case 'skeptic': return <CatMascot fill={fill} accessory={accessory} />;
    case 'verifier': return <OwlMascot fill={fill} accessory={accessory} variant="verifier" />;
    case 'executor': return <BadgerMascot fill={fill} accessory={accessory} />;
    default: return <FoxMascot fill={fill} accessory={accessory} />;
  }
}

function BearMascot({ fill, accessory }) {
  return (
    <g>
      {/* ears */}
      <circle cx="28" cy="28" r="10" fill={fill} opacity="0.9" />
      <circle cx="72" cy="28" r="10" fill={fill} opacity="0.9" />
      <circle cx="28" cy="28" r="5" fill="#1a1a2e" />
      <circle cx="72" cy="28" r="5" fill="#1a1a2e" />
      {/* head */}
      <ellipse cx="50" cy="52" rx="28" ry="26" fill={fill} />
      {/* snout */}
      <ellipse cx="50" cy="62" rx="14" ry="10" fill="#f0f0f0" opacity="0.9" />
      <ellipse cx="50" cy="58" rx="3" ry="2.5" fill="#1a1a2e" />
      {/* eyes */}
      <circle cx="40" cy="48" r="3.5" fill="#1a1a2e" />
      <circle cx="60" cy="48" r="3.5" fill="#1a1a2e" />
      <circle cx="41" cy="47" r="1" fill="#fff" />
      <circle cx="61" cy="47" r="1" fill="#fff" />
      {/* headset accessory */}
      {accessory === 'headset' && (
        <g stroke="#22d3ee" strokeWidth="2" fill="none">
          <path d="M 22 40 Q 50 18 78 40" />
          <rect x="18" y="38" width="8" height="12" rx="2" fill="#22d3ee" opacity="0.8" />
          <rect x="74" y="38" width="8" height="12" rx="2" fill="#22d3ee" opacity="0.8" />
          <line x1="50" y1="20" x2="50" y2="14" />
          <circle cx="50" cy="12" r="3" fill="#22d3ee" />
        </g>
      )}
    </g>
  );
}

function FoxMascot({ fill, accessory }) {
  return (
    <g>
      {/* ears */}
      <path d="M 24 30 L 30 12 L 38 28 Z" fill={fill} />
      <path d="M 76 30 L 70 12 L 62 28 Z" fill={fill} />
      <path d="M 28 26 L 31 18 L 35 26 Z" fill="#1a1a2e" opacity="0.5" />
      <path d="M 72 26 L 69 18 L 65 26 Z" fill="#1a1a2e" opacity="0.5" />
      {/* head */}
      <path d="M 50 30 Q 25 35 28 58 Q 35 72 50 72 Q 65 72 72 58 Q 75 35 50 30 Z" fill={fill} />
      {/* snout */}
      <path d="M 50 55 L 42 68 L 58 68 Z" fill="#f0f0f0" opacity="0.9" />
      <circle cx="50" cy="64" r="2" fill="#1a1a2e" />
      {/* eyes */}
      <circle cx="38" cy="48" r="3" fill="#1a1a2e" />
      <circle cx="62" cy="48" r="3" fill="#1a1a2e" />
      <circle cx="39" cy="47" r="1" fill="#fff" />
      <circle cx="63" cy="47" r="1" fill="#fff" />
      {/* scanner accessory */}
      {accessory === 'scanner' && (
        <g>
          <rect x="70" y="60" width="20" height="14" rx="2" fill="#a78bfa" opacity="0.8" stroke="#a78bfa" strokeWidth="1" />
          <rect x="73" y="63" width="14" height="4" fill="#1a1a2e" />
          <rect x="73" y="69" width="8" height="2" fill="#22d3ee" />
        </g>
      )}
    </g>
  );
}

function TurtleMascot({ fill, accessory }) {
  return (
    <g>
      {/* shell */}
      <ellipse cx="50" cy="55" rx="32" ry="28" fill={fill} opacity="0.85" />
      <ellipse cx="50" cy="55" rx="24" ry="20" fill={fill} />
      {/* shell pattern */}
      <path d="M 50 38 L 62 50 L 58 66 L 42 66 L 38 50 Z" fill="none" stroke="#1a1a2e" strokeWidth="1.5" opacity="0.3" />
      {/* head */}
      <ellipse cx="50" cy="40" rx="12" ry="10" fill={fill} />
      {/* eyes */}
      <circle cx="44" cy="38" r="2.5" fill="#1a1a2e" />
      <circle cx="56" cy="38" r="2.5" fill="#1a1a2e" />
      <circle cx="44.5" cy="37.5" r="0.8" fill="#fff" />
      <circle cx="56.5" cy="37.5" r="0.8" fill="#fff" />
      {/* shield accessory */}
      {accessory === 'shield' && (
        <g>
          <path d="M 78 40 L 88 44 L 88 56 Q 88 64 78 68 Q 68 64 68 56 L 68 44 Z" fill="#34d399" opacity="0.7" stroke="#34d399" strokeWidth="1.5" />
          <path d="M 78 46 L 82 50 L 78 60 L 74 50 Z" fill="#fff" opacity="0.8" />
        </g>
      )}
    </g>
  );
}

function OwlMascot({ fill, accessory, variant }) {
  const accent = variant === 'verifier' ? '#2dd4bf' : fill;
  return (
    <g>
      {/* body */}
      <ellipse cx="50" cy="55" rx="28" ry="30" fill={fill} />
      {/* ear tufts */}
      <path d="M 28 28 L 32 18 L 38 28 Z" fill={fill} />
      <path d="M 72 28 L 68 18 L 62 28 Z" fill={fill} />
      {/* eyes — big owl eyes */}
      <circle cx="38" cy="45" r="9" fill="#f0f0f0" />
      <circle cx="62" cy="45" r="9" fill="#f0f0f0" />
      <circle cx="38" cy="45" r="5" fill="#1a1a2e" />
      <circle cx="62" cy="45" r="5" fill="#1a1a2e" />
      <circle cx="39" cy="43" r="1.5" fill="#fff" />
      <circle cx="63" cy="43" r="1.5" fill="#fff" />
      {/* beak */}
      <path d="M 50 50 L 45 58 L 55 58 Z" fill="#fbbf24" />
      {/* belly */}
      <ellipse cx="50" cy="68" rx="14" ry="12" fill="#f0f0f0" opacity="0.3" />
      {/* network accessory */}
      {accessory === 'network' && (
        <g stroke={accent} strokeWidth="1.5" fill="none" opacity="0.8">
          <circle cx="80" cy="30" r="3" fill={accent} />
          <circle cx="88" cy="40" r="2" fill={accent} />
          <circle cx="82" cy="48" r="2" fill={accent} />
          <line x1="80" y1="33" x2="88" y2="40" />
          <line x1="80" y1="33" x2="82" y2="48" />
          <line x1="88" y1="40" x2="82" y2="48" />
        </g>
      )}
      {/* scales accessory */}
      {accessory === 'scales' && (
        <g stroke={accent} strokeWidth="1.5" fill="none">
          <line x1="78" y1="25" x2="78" y2="35" />
          <line x1="70" y1="35" x2="86" y2="35" />
          <path d="M 70 35 L 66 45 L 74 45 Z" fill={accent} opacity="0.5" />
          <path d="M 86 35 L 82 45 L 90 45 Z" fill={accent} opacity="0.5" />
          <line x1="78" y1="35" x2="78" y2="48" />
          <rect x="72" y="48" width="12" height="2" fill={accent} />
        </g>
      )}
    </g>
  );
}

function BeaverMascot({ fill, accessory }) {
  return (
    <g>
      {/* head */}
      <ellipse cx="50" cy="50" rx="28" ry="25" fill={fill} />
      {/* ears */}
      <circle cx="28" cy="36" r="5" fill={fill} opacity="0.8" />
      <circle cx="72" cy="36" r="5" fill={fill} opacity="0.8" />
      {/* snout */}
      <ellipse cx="50" cy="62" rx="12" ry="8" fill="#f0f0f0" opacity="0.9" />
      {/* teeth */}
      <rect x="46" y="64" width="3" height="6" fill="#fff" />
      <rect x="51" y="64" width="3" height="6" fill="#fff" />
      {/* nose */}
      <circle cx="50" cy="58" r="2.5" fill="#1a1a2e" />
      {/* eyes */}
      <circle cx="40" cy="46" r="3" fill="#1a1a2e" />
      <circle cx="60" cy="46" r="3" fill="#1a1a2e" />
      <circle cx="41" cy="45" r="1" fill="#fff" />
      <circle cx="61" cy="45" r="1" fill="#fff" />
      {/* clipboard accessory */}
      {accessory === 'clipboard' && (
        <g>
          <rect x="74" y="55" width="18" height="22" rx="2" fill="#fbbf24" opacity="0.8" stroke="#fbbf24" strokeWidth="1" />
          <rect x="78" y="53" width="10" height="4" rx="1" fill="#fbbf24" />
          <line x1="78" y1="62" x2="88" y2="62" stroke="#1a1a2e" strokeWidth="1" opacity="0.5" />
          <line x1="78" y1="66" x2="88" y2="66" stroke="#1a1a2e" strokeWidth="1" opacity="0.5" />
          <line x1="78" y1="70" x2="85" y2="70" stroke="#1a1a2e" strokeWidth="1" opacity="0.5" />
        </g>
      )}
    </g>
  );
}

function CatMascot({ fill, accessory }) {
  return (
    <g>
      {/* ears — pointy cat ears */}
      <path d="M 26 30 L 24 14 L 38 26 Z" fill={fill} />
      <path d="M 74 30 L 76 14 L 62 26 Z" fill={fill} />
      <path d="M 28 26 L 27 20 L 34 25 Z" fill="#f472b6" opacity="0.4" />
      <path d="M 72 26 L 73 20 L 66 25 Z" fill="#f472b6" opacity="0.4" />
      {/* head */}
      <ellipse cx="50" cy="52" rx="26" ry="24" fill={fill} />
      {/* eyes — skeptical narrow eyes */}
      <path d="M 34 48 Q 40 45 46 48" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 54 48 Q 60 45 66 48" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="48" r="1.5" fill="#1a1a2e" />
      <circle cx="60" cy="48" r="1.5" fill="#1a1a2e" />
      {/* nose */}
      <path d="M 48 56 L 52 56 L 50 59 Z" fill="#f472b6" />
      {/* mouth — skeptical smirk */}
      <path d="M 50 59 Q 44 64 40 62" stroke="#1a1a2e" strokeWidth="1.5" fill="none" />
      <path d="M 50 59 Q 56 64 60 62" stroke="#1a1a2e" strokeWidth="1.5" fill="none" />
      {/* whiskers */}
      <line x1="30" y1="56" x2="42" y2="57" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.5" />
      <line x1="30" y1="60" x2="42" y2="60" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.5" />
      <line x1="58" y1="57" x2="70" y2="56" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.5" />
      <line x1="58" y1="60" x2="70" y2="60" stroke="#1a1a2e" strokeWidth="0.8" opacity="0.5" />
      {/* magnifier accessory */}
      {accessory === 'magnifier' && (
        <g>
          <circle cx="78" cy="62" r="8" fill="none" stroke="#f472b6" strokeWidth="2.5" />
          <line x1="84" y1="68" x2="92" y2="76" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
          <circle cx="78" cy="62" r="5" fill="#f472b6" opacity="0.15" />
        </g>
      )}
    </g>
  );
}

function BadgerMascot({ fill, accessory }) {
  return (
    <g>
      {/* head */}
      <ellipse cx="50" cy="52" rx="28" ry="26" fill={fill} />
      {/* badger stripes */}
      <path d="M 28 40 Q 35 30 42 38 L 42 52 L 28 52 Z" fill="#1a1a2e" opacity="0.6" />
      <path d="M 72 40 Q 65 30 58 38 L 58 52 L 72 52 Z" fill="#1a1a2e" opacity="0.6" />
      {/* snout */}
      <ellipse cx="50" cy="62" rx="10" ry="8" fill="#f0f0f0" opacity="0.9" />
      <circle cx="50" cy="58" r="2.5" fill="#1a1a2e" />
      {/* eyes */}
      <circle cx="40" cy="48" r="3" fill="#1a1a2e" />
      <circle cx="60" cy="48" r="3" fill="#1a1a2e" />
      <circle cx="41" cy="47" r="1" fill="#fff" />
      <circle cx="61" cy="47" r="1" fill="#fff" />
      {/* key accessory */}
      {accessory === 'key' && (
        <g>
          <circle cx="82" cy="55" r="5" fill="none" stroke="#fb923c" strokeWidth="2" />
          <line x1="86" y1="55" x2="94" y2="55" stroke="#fb923c" strokeWidth="2" />
          <line x1="90" y1="55" x2="90" y2="60" stroke="#fb923c" strokeWidth="2" />
          <line x1="93" y1="55" x2="93" y2="58" stroke="#fb923c" strokeWidth="2" />
        </g>
      )}
    </g>
  );
}