/**
 * TETHER.BET — Realistic Poker Chip
 * 카지노 스타일 3D 칩 (스트라이프 + 메달리온 + 그림자)
 */

interface PokerChipProps {
  size?: number;
  color?: string;
  value?: string | number;
  showValue?: boolean;
}

const CHIP_COLORS: Record<string, { primary: string; dark: string; stripe: string }> = {
  white:   { primary: "#F5F5F5", dark: "#999999", stripe: "#1A1A1A" },
  red:     { primary: "#DC2626", dark: "#7F1D1D", stripe: "#FFFFFF" },
  blue:    { primary: "#2563EB", dark: "#1E3A8A", stripe: "#FFFFFF" },
  green:   { primary: "#26A17B", dark: "#0E5938", stripe: "#FFFFFF" },
  black:   { primary: "#1F2937", dark: "#000000", stripe: "#FFD700" },
  purple:  { primary: "#7C3AED", dark: "#4C1D95", stripe: "#FFFFFF" },
  orange:  { primary: "#FF6B35", dark: "#9A3412", stripe: "#FFFFFF" },
  yellow:  { primary: "#FBBF24", dark: "#92400E", stripe: "#1F2937" },
  gold:    { primary: "#FFD700", dark: "#B8860B", stripe: "#1F2937" },
};

export function PokerChip({ size = 32, color = "green", value, showValue = false }: PokerChipProps) {
  const c = CHIP_COLORS[color] ?? CHIP_COLORS.green!;
  const innerSize = size * 0.62;

  return (
    <div style={{
      width: size, height: size, position: "relative",
      borderRadius: "50%",
      background: `radial-gradient(circle at 35% 30%, ${c.primary}, ${c.dark})`,
      boxShadow: `
        0 ${size * 0.08}px ${size * 0.12}px rgba(0,0,0,0.5),
        0 ${size * 0.02}px 2px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(255,255,255,0.25),
        inset 0 -2px 4px rgba(0,0,0,0.3)
      `,
    }}>
      {/* 외곽 스트라이프 (8개) */}
      <svg
        width={size} height={size}
        style={{ position: "absolute", inset: 0 }}
        viewBox={`0 0 ${size} ${size}`}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <rect
            key={angle}
            x={size / 2 - size * 0.06}
            y={size * 0.04}
            width={size * 0.12}
            height={size * 0.13}
            rx={size * 0.02}
            fill={c.stripe}
            opacity="0.85"
            transform={`rotate(${angle} ${size / 2} ${size / 2})`}
          />
        ))}
      </svg>

      {/* 내부 원 (메달리온) */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        width: innerSize, height: innerSize,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${c.primary}, ${c.dark})`,
        border: `${Math.max(1, size * 0.025)}px solid rgba(255,255,255,0.3)`,
        boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {showValue && value ? (
          <span style={{
            fontSize: size * 0.28,
            fontWeight: 900,
            color: "rgba(255,255,255,0.95)",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>{value}</span>
        ) : (
          <span style={{
            fontSize: size * 0.42,
            fontWeight: 900,
            color: "rgba(255,255,255,0.9)",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            lineHeight: 1,
          }}>₮</span>
        )}
      </div>

      {/* 상단 광택 */}
      <div style={{
        position: "absolute",
        top: "8%", left: "20%",
        width: "50%", height: "30%",
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(255,255,255,0.35), transparent 70%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

/** 칩 색상 자동 선택 (금액 기반) */
export function getChipColorByValue(amount: number): string {
  if (amount >= 100000) return "black";
  if (amount >= 50000) return "purple";
  if (amount >= 10000) return "gold";
  if (amount >= 5000) return "orange";
  if (amount >= 1000) return "red";
  if (amount >= 500) return "blue";
  if (amount >= 100) return "green";
  return "white";
}
