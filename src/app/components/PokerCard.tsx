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

export function PokerCard({ suit, rank, faceDown = false, size = "md", highlight = false, className }: PokerCardProps) {
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
        background: "linear-gradient(155deg, #1B5E3F 0%, #0F3D28 50%, #082418 100%)",
        boxShadow: `0 ${s.shadow}px ${s.shadow * 1.5}px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`,
        border: `${s.stroke}px solid rgba(255,255,255,0.05)`,
      }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <pattern id={`bp-${uid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect x="3" y="3" width="2" height="2" rx="0.3" fill="rgba(255,255,255,0.025)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#bp-${uid})`} />
        </svg>
        <div style={{
          position: "absolute", inset: s.p * 0.6, borderRadius: Math.max(s.r - 2, 1),
          border: "1px solid rgba(218,165,32,0.06)",
        }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30%",
          borderRadius: `${s.r}px ${s.r}px 0 0`,
          background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
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
        boxShadow: highlight
          ? `0 0 20px rgba(255,170,80,0.15), 0 ${s.shadow}px ${s.shadow * 2}px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,1)`
          : `0 ${s.shadow * 0.5}px ${s.shadow}px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)`,
        border: highlight
          ? `${s.stroke}px solid rgba(255,170,80,0.4)`
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
          opacity: rank === "A" ? 1 : 0.7,
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
