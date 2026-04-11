interface PokerChipProps {
  value: 1 | 5 | 25 | 100 | 500 | 1000;
  size?: "sm" | "md" | "lg" | "xl";
}

const chipDefs: Record<number, {
  face: string; face2: string; edge: string; stripe: string;
  stripeAlt: string; text: string; glow: string; label: string;
  rimLight: string;
}> = {
  1:    { face: "#F0F0F0", face2: "#E0E0E0", edge: "#B8B8B8", stripe: "#CCCCCC", stripeAlt: "#E8E8E8", text: "#444", glow: "rgba(255,255,255,0.12)", label: "1", rimLight: "rgba(255,255,255,0.4)" },
  5:    { face: "#E53E3E", face2: "#C53030", edge: "#9B2C2C", stripe: "#FFFFFF", stripeAlt: "#F8D7D7", text: "#FFF", glow: "rgba(229,62,62,0.25)", label: "5", rimLight: "rgba(255,200,200,0.3)" },
  25:   { face: "#22A17B", face2: "#1A8B6A", edge: "#15755A", stripe: "#FFFFFF", stripeAlt: "#B8E8D4", text: "#FFF", glow: "rgba(34,161,123,0.3)", label: "25", rimLight: "rgba(180,240,210,0.3)" },
  100:  { face: "#18182E", face2: "#0E0E24", edge: "#06061A", stripe: "#FFFFFF", stripeAlt: "#5555AA", text: "#E0E0FF", glow: "rgba(30,30,80,0.15)", label: "100", rimLight: "rgba(150,150,255,0.15)" },
  500:  { face: "#7C3AED", face2: "#6D28D9", edge: "#5B21B6", stripe: "#FFFFFF", stripeAlt: "#D8B4FE", text: "#FFF", glow: "rgba(124,58,237,0.3)", label: "500", rimLight: "rgba(216,180,254,0.3)" },
  1000: { face: "#E5B800", face2: "#CC9F00", edge: "#A67F00", stripe: "#FFFFFF", stripeAlt: "#FFF0B3", text: "#1A1A2E", glow: "rgba(229,184,0,0.35)", label: "1K", rimLight: "rgba(255,240,180,0.4)" },
};

const sizeDims = { sm: 28, md: 40, lg: 52, xl: 60 };

export function PokerChip({ value, size = "md" }: PokerChipProps) {
  const d = sizeDims[size];
  const c = chipDefs[value];
  const r = d / 2;
  const fs = d * 0.22;
  const uid = `chip-${value}-${d}`;
  const stripeW = d * 0.1;
  const stripeCount = 6;

  return (
    <div style={{
      width: d, height: d, position: "relative",
      filter: `drop-shadow(0 3px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${c.glow})`,
    }}>
      <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`}>
        <defs>
          {/* Main gradient - realistic 3D lighting */}
          <radialGradient id={`${uid}-face`} cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor={c.face} />
            <stop offset="55%" stopColor={c.face2} />
            <stop offset="100%" stopColor={c.edge} />
          </radialGradient>
          {/* Rim highlight */}
          <radialGradient id={`${uid}-rim`} cx="35%" cy="28%">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${uid}-clip`}>
            <circle cx={r} cy={r} r={r - 0.5} />
          </clipPath>
        </defs>

        {/* Base disc with 3D edge */}
        <circle cx={r} cy={r + d * 0.02} r={r - 0.5} fill={c.edge} opacity="0.6" />
        <circle cx={r} cy={r} r={r - 0.5} fill={`url(#${uid}-face)`} />

        {/* Edge stripes - casino style alternating */}
        <g clipPath={`url(#${uid}-clip)`}>
          {Array.from({ length: stripeCount }).map((_, i) => {
            const angle = (i * 360) / stripeCount;
            const rad = (angle * Math.PI) / 180;
            const ox = Math.cos(rad);
            const oy = Math.sin(rad);
            const ir = r * 0.82;
            const outr = r * 1.1;
            return (
              <g key={i}>
                <line
                  x1={r + ox * ir} y1={r + oy * ir}
                  x2={r + ox * outr} y2={r + oy * outr}
                  stroke={c.stripe} strokeWidth={stripeW}
                  strokeLinecap="butt" opacity={0.55}
                />
                {/* Second thin line beside */}
                <line
                  x1={r + Math.cos(rad + 0.08) * ir} y1={r + Math.sin(rad + 0.08) * ir}
                  x2={r + Math.cos(rad + 0.08) * outr} y2={r + Math.sin(rad + 0.08) * outr}
                  stroke={c.stripeAlt} strokeWidth={stripeW * 0.4}
                  strokeLinecap="butt" opacity={0.25}
                />
              </g>
            );
          })}
        </g>

        {/* Outer ring - embossed */}
        <circle cx={r} cy={r} r={r - d * 0.03} fill="none"
          stroke={c.edge} strokeWidth={d * 0.02} opacity={0.25} />

        {/* Inner inlay ring */}
        <circle cx={r} cy={r} r={r * 0.62} fill="none"
          stroke={c.rimLight} strokeWidth={d * 0.015} opacity={0.2} />
        <circle cx={r} cy={r} r={r * 0.58} fill="none"
          stroke={c.edge} strokeWidth={d * 0.008} opacity={0.15}
          strokeDasharray={`${d * 0.025} ${d * 0.045}`} />

        {/* Center inlay disc */}
        <circle cx={r} cy={r} r={r * 0.42}
          fill={c.face2} opacity={0.3} />
        <circle cx={r} cy={r} r={r * 0.42} fill="none"
          stroke={c.rimLight} strokeWidth={0.5} opacity={0.15} />

        {/* 3D light reflection */}
        <circle cx={r} cy={r} r={r - 0.5} fill={`url(#${uid}-rim)`} />

        {/* Top specular highlight */}
        <ellipse cx={r * 0.82} cy={r * 0.58}
          rx={r * 0.32} ry={r * 0.16}
          fill="white" opacity={0.18} />

        {/* Value text with shadow */}
        <text x={r} y={r + d * 0.01} textAnchor="middle" dominantBaseline="central"
          fill="rgba(0,0,0,0.15)" fontSize={fs} fontWeight="900"
          fontFamily="'JetBrains Mono', monospace"
          dy="0.5">{c.label}</text>
        <text x={r} y={r} textAnchor="middle" dominantBaseline="central"
          fill={c.text} fontSize={fs} fontWeight="900"
          fontFamily="'JetBrains Mono', monospace">
          {c.label}
        </text>
      </svg>
    </div>
  );
}
