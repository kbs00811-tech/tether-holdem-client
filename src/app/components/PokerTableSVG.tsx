interface PokerTableSVGProps {
  variant?: "desktop" | "mobile";
  className?: string;
}

export function PokerTableSVG({ variant = "desktop", className }: PokerTableSVGProps) {
  const w = variant === "desktop" ? 1200 : 600;
  const h = variant === "desktop" ? 600 : 400;
  const uid = `tbl-${variant}`;
  const pad = variant === "desktop" ? 24 : 16;
  const r = variant === "desktop" ? 40 : 28;
  const innerPad = variant === "desktop" ? 48 : 32;
  const innerR = variant === "desktop" ? 28 : 20;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} className={className}>
      <defs>
        {/* Background */}
        <radialGradient id={`${uid}-bg`} cx="50%" cy="45%">
          <stop offset="0%" stopColor="#0A1420" />
          <stop offset="100%" stopColor="#050A10" />
        </radialGradient>

        {/* Table face — dark crypto surface */}
        <linearGradient id={`${uid}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F1923" />
          <stop offset="50%" stopColor="#0B1219" />
          <stop offset="100%" stopColor="#080D14" />
        </linearGradient>

        {/* Rim metallic gradient */}
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E2A38" />
          <stop offset="50%" stopColor="#141E2B" />
          <stop offset="100%" stopColor="#0C1420" />
        </linearGradient>

        {/* Neon glow edge */}
        <linearGradient id={`${uid}-neon`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="30%" stopColor="#26A17B" />
          <stop offset="60%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Hex grid pattern */}
        <pattern id={`${uid}-hex`} width="20" height="23" patternUnits="userSpaceOnUse"
          patternTransform="rotate(0)">
          <path d="M10 0L20 5.77V17.32L10 23.09L0 17.32V5.77Z"
            fill="none" stroke="rgba(255,255,255,0.012)" strokeWidth="0.5" />
        </pattern>

        {/* Circuit pattern */}
        <pattern id={`${uid}-circuit`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20H15M25 20H40M20 0V15M20 25V40"
            stroke="rgba(255,107,53,0.015)" strokeWidth="0.5" />
          <circle cx="20" cy="20" r="1.5" fill="none"
            stroke="rgba(255,107,53,0.02)" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="0.8" fill="rgba(38,161,123,0.015)" />
          <circle cx="40" cy="40" r="0.8" fill="rgba(38,161,123,0.015)" />
        </pattern>

        {/* Glow filters */}
        <filter id={`${uid}-glow`}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${uid}-shadow`} x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#000" floodOpacity="0.7" />
        </filter>

        {/* Inner surface gradient */}
        <radialGradient id={`${uid}-inner`} cx="50%" cy="40%">
          <stop offset="0%" stopColor="#0F1A24" />
          <stop offset="100%" stopColor="#080E16" />
        </radialGradient>

        {/* Overhead light */}
        <radialGradient id={`${uid}-light`} cx="50%" cy="35%">
          <stop offset="0%" stopColor="white" stopOpacity="0.02" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background fill */}
      <rect width={w} height={h} fill={`url(#${uid}-bg)`} />

      {/* Table shadow */}
      <rect x={pad - 4} y={pad - 2} width={w - (pad - 4) * 2} height={h - (pad - 2) * 2}
        rx={r + 4} ry={r + 4} fill="rgba(0,0,0,0.4)" filter={`url(#${uid}-shadow)`} />

      {/* Outer rim */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2}
        rx={r} ry={r} fill={`url(#${uid}-rim)`} />

      {/* Neon edge line — the signature crypto glow */}
      <rect x={pad + 1} y={pad + 1} width={w - (pad + 1) * 2} height={h - (pad + 1) * 2}
        rx={r - 1} ry={r - 1} fill="none"
        stroke={`url(#${uid}-neon)`} strokeWidth="1.5" opacity="0.15"
        filter={`url(#${uid}-glow)`} />

      {/* Inner dark rim */}
      <rect x={pad + 6} y={pad + 6} width={w - (pad + 6) * 2} height={h - (pad + 6) * 2}
        rx={r - 4} ry={r - 4} fill="none"
        stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

      {/* Main playing surface */}
      <rect x={innerPad} y={innerPad} width={w - innerPad * 2} height={h - innerPad * 2}
        rx={innerR} ry={innerR} fill={`url(#${uid}-inner)`} />

      {/* Inner surface shadow */}
      <rect x={innerPad} y={innerPad} width={w - innerPad * 2} height={h - innerPad * 2}
        rx={innerR} ry={innerR} fill="none"
        stroke="rgba(0,0,0,0.3)" strokeWidth="2" />

      {/* Hex grid overlay */}
      <rect x={innerPad} y={innerPad} width={w - innerPad * 2} height={h - innerPad * 2}
        rx={innerR} ry={innerR} fill={`url(#${uid}-hex)`} />

      {/* Circuit board overlay */}
      <rect x={innerPad} y={innerPad} width={w - innerPad * 2} height={h - innerPad * 2}
        rx={innerR} ry={innerR} fill={`url(#${uid}-circuit)`} />

      {/* Betting rectangle */}
      <rect x={w * 0.22} y={h * 0.22} width={w * 0.56} height={h * 0.56}
        rx={16} ry={16} fill="none"
        stroke="rgba(255,255,255,0.02)" strokeWidth="0.8"
        strokeDasharray="6 6" />

      {/* Corner accents — crypto style */}
      {[
        [innerPad + 12, innerPad + 12],
        [w - innerPad - 12, innerPad + 12],
        [innerPad + 12, h - innerPad - 12],
        [w - innerPad - 12, h - innerPad - 12],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="2" fill="#FF6B35" opacity="0.06" />
          <circle cx={cx} cy={cy} r="0.8" fill="#FF6B35" opacity="0.15" />
        </g>
      ))}

      {/* Side accent lines */}
      <line x1={w * 0.15} y1={innerPad + 1} x2={w * 0.35} y2={innerPad + 1}
        stroke="#FF6B35" strokeWidth="1" opacity="0.04" />
      <line x1={w * 0.65} y1={innerPad + 1} x2={w * 0.85} y2={innerPad + 1}
        stroke="#26A17B" strokeWidth="1" opacity="0.04" />
      <line x1={w * 0.15} y1={h - innerPad - 1} x2={w * 0.35} y2={h - innerPad - 1}
        stroke="#22D3EE" strokeWidth="1" opacity="0.04" />
      <line x1={w * 0.65} y1={h - innerPad - 1} x2={w * 0.85} y2={h - innerPad - 1}
        stroke="#8B5CF6" strokeWidth="1" opacity="0.04" />

      {/* Overhead light spot */}
      <ellipse cx={w / 2} cy={h * 0.38} rx={w * 0.25} ry={h * 0.2}
        fill={`url(#${uid}-light)`} />

      {/* Center branding */}
      <text x={w / 2} y={h / 2 - 6} textAnchor="middle" dominantBaseline="central"
        fill="white" opacity="0.025" fontSize={variant === "desktop" ? 42 : 24}
        fontWeight="900" fontFamily="Orbitron, sans-serif"
        letterSpacing="0.25em">TETHER</text>
      <text x={w / 2} y={h / 2 + (variant === "desktop" ? 22 : 12)}
        textAnchor="middle" dominantBaseline="central"
        fill="white" opacity="0.012" fontSize={variant === "desktop" ? 14 : 9}
        fontWeight="700" fontFamily="Orbitron, sans-serif"
        letterSpacing="0.5em">.BET</text>

      {/* Subtle USDT icon at center */}
      <circle cx={w / 2} cy={h / 2} r={variant === "desktop" ? 35 : 22}
        fill="none" stroke="rgba(38,161,123,0.02)" strokeWidth="1" />
      <circle cx={w / 2} cy={h / 2} r={variant === "desktop" ? 38 : 24}
        fill="none" stroke="rgba(38,161,123,0.01)" strokeWidth="0.5"
        strokeDasharray="3 5" />
    </svg>
  );
}
