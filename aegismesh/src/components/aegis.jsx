import { cn } from '@/lib/utils';

export function MetricCard({ label, value, sub, tone = 'default', icon: Icon, className }) {
  const tones = {
    default: 'border-border',
    green: 'border-green-500/30 aegis-glow-green',
    red: 'border-red-500/30 aegis-glow-red',
    amber: 'border-amber-500/30 aegis-glow-amber',
    cyan: 'border-primary/30 aegis-glow-cyan',
  };
  const textTones = {
    default: 'text-foreground',
    green: 'aegis-text-green',
    red: 'aegis-text-red',
    amber: 'aegis-text-amber',
    cyan: 'aegis-text-cyan',
  };
  return (
    <div className={cn('aegis-panel p-4 rounded-lg', tones[tone], className)}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] text-muted-foreground aegis-mono uppercase tracking-wider">{label}</div>
        {Icon && <Icon className={cn('w-4 h-4', textTones[tone])} />}
      </div>
      <div className={cn('text-2xl font-bold mt-2 font-display', textTones[tone])}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, right, children, className, bodyClassName }) {
  return (
    <div className={cn('aegis-panel rounded-lg', className)}>
      {(title || right) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            {title && <div className="text-sm font-semibold font-display">{title}</div>}
            {subtitle && <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </div>
  );
}

export function StatusBadge({ status, className }) {
  const map = {
    DEFAULT: 'bg-muted text-muted-foreground border-border',
    ONLINE: 'bg-green-500/15 text-green-400 border-green-500/30',
    READY: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    GREEN: 'bg-green-500/15 text-green-400 border-green-500/30',
    RED: 'bg-red-500/15 text-red-400 border-red-500/30',
    AMBER: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    OFFLINE: 'bg-red-500/15 text-red-400 border-red-500/30',
    LIVE: 'bg-green-500/15 text-green-400 border-green-500/30',
    SIMULATED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    LOCAL: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    DISCONNECTED: 'bg-muted text-muted-foreground border-border',
    ERROR: 'bg-red-500/15 text-red-400 border-red-500/30',
    IDLE: 'bg-muted text-muted-foreground border-border',
    INVESTIGATING: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    THINKING: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    CHALLENGING: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    CHALLENGED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    COMPLETE: 'bg-green-500/15 text-green-400 border-green-500/30',
    BLOCKED: 'bg-red-500/15 text-red-400 border-red-500/30',
    QUARANTINED: 'bg-red-500/20 text-red-400 border-red-500/40',
    WAITING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    APPROVAL_REQUIRED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    APPROVED: 'bg-green-500/15 text-green-400 border-green-500/30',
    REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
    EXECUTED: 'bg-green-500/15 text-green-400 border-green-500/30',
    ISSUED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    CONSUMED: 'bg-muted text-muted-foreground border-border',
    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
    HIGH: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    MEDIUM: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    LOW: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] aegis-mono uppercase tracking-wider border', map[status] || map.DEFAULT, className)}>
      {status}
    </span>
  );
}

export function TrustScore({ score, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-[10px]', md: 'w-12 h-12 text-xs', lg: 'w-16 h-16 text-sm' };
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className={cn('relative flex items-center justify-center', sizes[size])}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
        <circle cx="20" cy="20" r="18" fill="none" stroke={color} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="font-bold aegis-mono" style={{ color }}>{score}</span>
    </div>
  );
}

export function HypothesisBar({ title, confidence, leading = false }) {
  const pct = Math.round(confidence * 100);
  const color = leading ? 'bg-primary' : pct > 50 ? 'bg-amber-500' : 'bg-muted-foreground/40';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={leading ? 'text-primary font-medium' : 'text-muted-foreground'}>{title}</span>
        <span className="aegis-mono text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}