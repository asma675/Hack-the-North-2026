export default function TrustHistoryChart({ history }) {
  const maxW = 600;
  const points = history.map((h, i) => ({
    x: (i / Math.max(history.length - 1, 1)) * maxW,
    y: 60 - (h.trust / 100) * 50,
    trust: h.trust,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="relative" style={{ height: 100 }}>
      <svg viewBox={`0 0 ${maxW} 60`} className="w-full h-full" preserveAspectRatio="none">
        <line x1="0" y1="10" x2={maxW} y2="10" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
        <line x1="0" y1="30" x2={maxW} y2="30" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
        <line x1="0" y1="50" x2={maxW} y2="50" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
        <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#22d3ee" />
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] aegis-mono text-muted-foreground mt-2">
        <span>{history[0].trust} → {history[history.length - 1].trust}</span>
        <span>{history.length} recorded points</span>
      </div>
    </div>
  );
}