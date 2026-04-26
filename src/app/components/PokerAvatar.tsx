interface PokerAvatarProps {
  avatarId: number;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  showRing?: boolean;
}

// Premium gradient avatar system — each has unique gradient + icon glyph
const avatarDefs: Array<{
  name: string;
  glyph: string;    // Single character/symbol
  bg1: string; bg2: string; bg3: string;
  glyphColor: string;
}> = [
  { name: "Bitcoin Bulldog", glyph: "₿", bg1: "#F7931A", bg2: "#E88A0E", bg3: "#CC7700", glyphColor: "rgba(255,255,255,0.9)" },
  { name: "Ethereum Cat",    glyph: "Ξ", bg1: "#627EEA", bg2: "#4F68D0", bg3: "#3D52B6", glyphColor: "rgba(255,255,255,0.85)" },
  { name: "Tether Penguin",  glyph: "₮", bg1: "#26A17B", bg2: "#1E8B6A", bg3: "#167558", glyphColor: "rgba(255,255,255,0.9)" },
  { name: "Rocket",          glyph: "◆", bg1: "#FF6B35", bg2: "#E85D2C", bg3: "#D04F22", glyphColor: "rgba(255,255,255,0.85)" },
  { name: "Cyber Ninja",     glyph: "忍", bg1: "#2D2B55", bg2: "#1E1B45", bg3: "#100E35", glyphColor: "rgba(167,139,250,0.8)" },
  { name: "Neon Hacker",     glyph: "</>", bg1: "#059669", bg2: "#047857", bg3: "#065F46", glyphColor: "rgba(52,211,153,0.9)" },
  { name: "Diamond Fox",     glyph: "♦", bg1: "#DC2626", bg2: "#B91C1C", bg3: "#991B1B", glyphColor: "rgba(255,255,255,0.85)" },
  { name: "Gold Lion",       glyph: "♛", bg1: "#D4A50A", bg2: "#B8900A", bg3: "#9A7A08", glyphColor: "rgba(255,255,255,0.9)" },
  { name: "Silver Wolf",     glyph: "♞", bg1: "#64748B", bg2: "#475569", bg3: "#334155", glyphColor: "rgba(226,232,240,0.85)" },
  { name: "Crystal Dragon",  glyph: "♠", bg1: "#7C3AED", bg2: "#6D28D9", bg3: "#5B21B6", glyphColor: "rgba(196,181,253,0.9)" },
  { name: "Platinum Eagle",  glyph: "★", bg1: "#9CA3AF", bg2: "#6B7280", bg3: "#4B5563", glyphColor: "rgba(255,255,255,0.9)" },
  { name: "Rainbow Unicorn", glyph: "✦", bg1: "#DB2777", bg2: "#BE185D", bg3: "#9D174D", glyphColor: "rgba(249,168,212,0.9)" },
];

const sizeDims = { sm: 32, md: 48, lg: 64, xl: 80 };

export function PokerAvatar({ avatarId, size = "md", online, showRing = true }: PokerAvatarProps) {
  const idx = avatarId % avatarDefs.length;
  const a = avatarDefs[idx];
  const d = sizeDims[size];
  const r = d / 2;
  const uid = `av-${idx}-${d}`;
  const fs = d * 0.36;
  const ringGap = d * 0.06;

  return (
    <div style={{ width: d, height: d, position: "relative" }}>
      <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`}>
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={a.bg1} />
            <stop offset="50%" stopColor={a.bg2} />
            <stop offset="100%" stopColor={a.bg3} />
          </linearGradient>
          <radialGradient id={`${uid}-shine`} cx="35%" cy="25%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0.25" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-inner`}>
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {/* Outer ring — subtle glow */}
        {showRing && (
          <>
            <circle cx={r} cy={r} r={r - 0.5} fill="none"
              stroke={a.bg1} strokeWidth={1.2} opacity={0.2} />
          </>
        )}

        {/* Main avatar circle */}
        <circle cx={r} cy={r} r={r - ringGap} fill={`url(#${uid}-bg)`} />

        {/* Inner shadow for depth */}
        <circle cx={r} cy={r} r={r - ringGap} fill="none"
          stroke="rgba(0,0,0,0.2)" strokeWidth={1} />

        {/* Light reflection */}
        <circle cx={r} cy={r} r={r - ringGap} fill={`url(#${uid}-shine)`} />

        {/* Glyph */}
        <text x={r} y={r + d * 0.02} textAnchor="middle" dominantBaseline="central"
          fill={a.glyphColor} fontSize={fs} fontWeight="700"
          fontFamily="'Inter', sans-serif"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
          {a.glyph}
        </text>
      </svg>

      {/* Online indicator */}
      {online !== undefined && (
        <div style={{
          position: "absolute",
          bottom: d * 0.02,
          right: d * 0.02,
          width: d * 0.2,
          height: d * 0.2,
          borderRadius: "50%",
          background: online
            ? "radial-gradient(circle, #34D399, #059669)"
            : "radial-gradient(circle, #6B7280, #4B5563)",
          border: `${Math.max(1.5, d * 0.04)}px solid #0B0E14`,
          boxShadow: online ? "0 0 6px rgba(52,211,153,0.5)" : "none",
        }} />
      )}
    </div>
  );
}

export { avatarDefs };
