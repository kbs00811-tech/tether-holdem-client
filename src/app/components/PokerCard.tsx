import { motion } from "motion/react";
import { useSettingsStore, CARD_SKINS } from "../stores/settingsStore";

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = "A" | "K" | "Q" | "J" | "10" | "9" | "8" | "7" | "6" | "5" | "4" | "3" | "2";

interface PokerCardProps {
  suit: Suit;
  rank: Rank;
  faceDown?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  highlight?: boolean;
  /** 🎯 P0-1 (2026-04-28): 쇼다운 best 5 미사용 카드 시각 dim (30% opacity) */
  dimmed?: boolean;
  className?: string;
}

const suitSymbols: Record<Suit, string> = {
  spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣",
};

/* Dynamic card colors from settings */
function getSuitColors(): Record<Suit, { primary: string; shadow: string }> {
  const skinId = useSettingsStore.getState().cardSkin;
  const skin = CARD_SKINS[skinId as keyof typeof CARD_SKINS] ?? CARD_SKINS[1];
  return {
    spades:   { primary: skin.spades, shadow: `${skin.spades}66` },
    hearts:   { primary: skin.hearts, shadow: `${skin.hearts}66` },
    diamonds: { primary: skin.diamonds, shadow: `${skin.diamonds}66` },
    clubs:    { primary: skin.clubs, shadow: `${skin.clubs}66` },
  };
}

const sizeMap = {
  xs: { w: 28, h: 40, rank: 9, suitS: 7.5, center: 14, r: 3, p: 2, stroke: 0.5, shadow: 4 },
  sm: { w: 40, h: 56, rank: 11.5, suitS: 9.5, center: 19, r: 4, p: 3, stroke: 0.6, shadow: 6 },
  md: { w: 54, h: 76, rank: 14, suitS: 12, center: 26, r: 6, p: 4, stroke: 0.8, shadow: 10 },
  lg: { w: 72, h: 101, rank: 19, suitS: 15, center: 34, r: 7, p: 5, stroke: 1, shadow: 14 },
  xl: { w: 112, h: 157, rank: 28, suitS: 20, center: 50, r: 9, p: 8, stroke: 1.2, shadow: 20 },
};

export function PokerCard({ suit, rank, faceDown = false, size = "md", highlight = false, dimmed = false, className }: PokerCardProps) {
  const s = sizeMap[size];
  const cardSkin = useSettingsStore(st => st.cardSkin);
  const skin = CARD_SKINS[cardSkin as keyof typeof CARD_SKINS] ?? CARD_SKINS[1];
  const sc = {
    primary: skin[suit === "spades" ? "spades" : suit === "hearts" ? "hearts" : suit === "diamonds" ? "diamonds" : "clubs"],
    shadow: `${skin[suit === "spades" ? "spades" : suit === "hearts" ? "hearts" : suit === "diamonds" ? "diamonds" : "clubs"]}66`,
  };
  const sym = suitSymbols[suit];
  const uid = `card-${suit}-${rank}-${size}-${Math.random().toString(36).slice(2, 6)}`;

  if (faceDown) {
    return (
      <div className={className} style={{
        width: s.w, height: s.h, borderRadius: s.r, position: "relative", overflow: "hidden",
        background: "linear-gradient(150deg, #0E3D26 0%, #1A5E3F 20%, #0E3D26 40%, #082418 60%, #0E3D26 80%, #1A5E3F 100%)",
        boxShadow: `0 ${s.shadow}px ${s.shadow * 1.5}px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`,
        border: `${s.stroke}px solid rgba(255,215,0,0.15)`,
      }}>
        {/* 외부 흰색 얇은 테두리 */}
        <div style={{
          position: "absolute", inset: s.p * 0.4, borderRadius: Math.max(s.r - 1, 1),
          border: `${Math.max(0.5, s.stroke * 0.6)}px solid rgba(255,255,255,0.18)`,
          pointerEvents: "none",
        }} />
        {/* 내부 금색 테두리 */}
        <div style={{
          position: "absolute", inset: s.p * 0.9, borderRadius: Math.max(s.r - 2, 1),
          border: `${Math.max(0.5, s.stroke * 0.5)}px solid rgba(255,215,0,0.35)`,
          pointerEvents: "none",
        }} />
        {/* 바로크 패턴 — 작은 다이아몬드 격자 */}
        <svg style={{ position: "absolute", inset: s.p * 1.5, width: `calc(100% - ${s.p * 3}px)`, height: `calc(100% - ${s.p * 3}px)` }}>
          <defs>
            <pattern id={`bp-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect x="3" y="3" width="4" height="4" fill="none" stroke="rgba(255,215,0,0.08)" strokeWidth="0.5" />
              <circle cx="5" cy="5" r="0.6" fill="rgba(255,215,0,0.12)" />
            </pattern>
            <pattern id={`bp2-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M10,2 L18,10 L10,18 L2,10 Z" fill="none" stroke="rgba(255,215,0,0.06)" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#bp-${uid})`} rx={Math.max(s.r - 3, 1)} />
          <rect width="100%" height="100%" fill={`url(#bp2-${uid})`} rx={Math.max(s.r - 3, 1)} />
        </svg>
        {/* 중앙 메달리온 (GGPoker 스타일) */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* 외부 금색 링 */}
          <div style={{
            width: s.w * 0.55, height: s.w * 0.55, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, rgba(255,215,0,0.35), rgba(218,165,32,0.2) 50%, rgba(139,109,0,0.15))",
            border: "1.5px solid rgba(255,215,0,0.5)",
            boxShadow: "0 0 12px rgba(255,215,0,0.25), inset 0 0 8px rgba(255,215,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            {/* 내부 어두운 원 */}
            <div style={{
              width: "78%", height: "78%", borderRadius: "50%",
              background: "radial-gradient(circle at 40% 40%, #1A5E3F, #082418)",
              border: "0.8px solid rgba(255,215,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
            }}>
              {/* ₮ 로고 */}
              <span style={{
                fontSize: s.rank * 0.95, fontWeight: 900,
                color: "rgba(255,215,0,0.85)",
                textShadow: "0 0 6px rgba(255,215,0,0.5), 0 1px 2px rgba(0,0,0,0.5)",
                fontFamily: "'Arial Black', sans-serif",
              }}>₮</span>
            </div>
            {/* 메달리온 광택 */}
            <div style={{
              position: "absolute", top: "5%", left: "15%", width: "40%", height: "30%",
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(255,255,255,0.25), transparent 70%)",
              pointerEvents: "none",
            }} />
          </div>
        </div>
        {/* 상단 광택 */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "40%",
          borderRadius: `${s.r}px ${s.r}px 0 0`,
          background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
        {/* 하단 그림자 */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "20%",
          borderRadius: `0 0 ${s.r}px ${s.r}px`,
          background: "linear-gradient(0deg, rgba(0,0,0,0.25) 0%, transparent 100%)",
          pointerEvents: "none",
        }} />
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={highlight ? { y: -4, scale: 1.04 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        width: s.w, height: s.h, borderRadius: s.r,
        position: "relative", overflow: "hidden",
        background: "#FFFFFF",
        // 🎯 P0-1: dimmed (best 5 미사용) → opacity 30% + grayscale; transition 부드럽게
        opacity: dimmed ? 0.3 : 1,
        filter: dimmed ? 'grayscale(0.6)' : 'none',
        transition: 'opacity 400ms ease, filter 400ms ease, box-shadow 200ms ease, border 200ms ease',
        boxShadow: highlight
          ? `0 0 20px rgba(255,215,0,0.55), 0 ${s.shadow}px ${s.shadow * 2}px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,1)`
          : `0 ${s.shadow * 0.5}px ${s.shadow}px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)`,
        border: highlight
          ? `${Math.max(s.stroke, 1.5)}px solid rgba(255,215,0,0.85)`
          : `${s.stroke}px solid rgba(0,0,0,0.06)`,
        display: "flex", flexDirection: "column",
        justifyContent: "space-between", padding: s.p,
        cursor: "default", userSelect: "none",
      }}>

      {/* Paper bg */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(170deg, #FFFFFF 0%, #FAFAF8 60%, #F5F5F3 100%)",
      }} />

      {/* Top-left rank + suit */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        alignItems: "center", lineHeight: 1, width: "fit-content",
      }}>
        <span style={{
          fontSize: s.rank, fontWeight: 900,
          fontFamily: "'JetBrains Mono', monospace",
          color: sc.primary, lineHeight: 0.9,
        }}>{rank}</span>
        <span style={{
          fontSize: s.suitS * 0.85, lineHeight: 1,
          color: sc.primary, marginTop: size === "xs" ? -1 : -2,
        }}>{sym}</span>
      </div>

      {/* Center suit */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", zIndex: 1,
      }}>
        <span style={{
          fontSize: rank === "A" ? s.center * 1.3 : s.center * 0.9,
          lineHeight: 1, color: sc.primary,
          opacity: 1,
          filter: `drop-shadow(0 1px 2px ${sc.shadow})`,
        }}>{sym}</span>
      </div>

      {/* Bottom-right rotated */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        alignItems: "center", lineHeight: 1,
        transform: "rotate(180deg)", alignSelf: "flex-end",
        width: "fit-content",
      }}>
        <span style={{
          fontSize: s.rank, fontWeight: 900,
          fontFamily: "'JetBrains Mono', monospace",
          color: sc.primary, lineHeight: 0.9,
        }}>{rank}</span>
        <span style={{
          fontSize: s.suitS * 0.85, lineHeight: 1,
          color: sc.primary, marginTop: size === "xs" ? -1 : -2,
        }}>{sym}</span>
      </div>

      {/* Gloss */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "38%",
        borderRadius: `${s.r}px ${s.r}px 0 0`,
        background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%)",
        pointerEvents: "none", zIndex: 3,
      }} />
    </motion.div>
  );
}
