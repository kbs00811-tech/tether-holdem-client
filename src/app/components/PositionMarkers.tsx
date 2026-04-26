// Dealer Button, Small Blind, Big Blind Markers

interface MarkerProps {
  size?: number;
  className?: string;
}

export function DealerButton({ size = 30, className }: MarkerProps) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <defs>
        <radialGradient id="db-g" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8E8E8" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 1} fill="url(#db-g)"
        stroke="#C0C0C0" strokeWidth={1} />
      <circle cx={r} cy={r} r={r * 0.72} fill="none"
        stroke="#D0D0D0" strokeWidth={0.8} />
      <text x={r} y={r + 0.5} textAnchor="middle" dominantBaseline="central"
        fill="#1A1A2E" fontSize={size * 0.4} fontWeight="900"
        fontFamily="'JetBrains Mono', monospace">D</text>
      {/* Shine */}
      <ellipse cx={r * 0.8} cy={r * 0.6} rx={r * 0.3} ry={r * 0.15}
        fill="white" opacity={0.4} />
    </svg>
  );
}

export function SmallBlindMarker({ size = 24, className }: MarkerProps) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <defs>
        <radialGradient id="sb-g" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 0.5} fill="url(#sb-g)" />
      <circle cx={r} cy={r} r={r * 0.7} fill="none"
        stroke="rgba(255,255,255,0.2)" strokeWidth={0.6} />
      <text x={r} y={r + 0.5} textAnchor="middle" dominantBaseline="central"
        fill="#FFFFFF" fontSize={size * 0.34} fontWeight="800"
        fontFamily="'JetBrains Mono', monospace">S</text>
      <ellipse cx={r * 0.75} cy={r * 0.55} rx={r * 0.25} ry={r * 0.1}
        fill="white" opacity={0.2} />
    </svg>
  );
}

export function BigBlindMarker({ size = 24, className }: MarkerProps) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <defs>
        <radialGradient id="bb-g" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r - 0.5} fill="url(#bb-g)" />
      <circle cx={r} cy={r} r={r * 0.7} fill="none"
        stroke="rgba(255,255,255,0.2)" strokeWidth={0.6} />
      <text x={r} y={r + 0.5} textAnchor="middle" dominantBaseline="central"
        fill="#1A1A2E" fontSize={size * 0.34} fontWeight="800"
        fontFamily="'JetBrains Mono', monospace">B</text>
      <ellipse cx={r * 0.75} cy={r * 0.55} rx={r * 0.25} ry={r * 0.1}
        fill="white" opacity={0.25} />
    </svg>
  );
}
