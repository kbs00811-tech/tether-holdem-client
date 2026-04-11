import { motion, AnimatePresence } from "motion/react";
import { PokerCard } from "./PokerCard";
import { WifiOff, Plus } from "lucide-react";

interface PlayerSlotProps {
  position: number;
  player?: {
    name: string;
    stack: number;
    bet: number;
    avatar: number;
    status: "active" | "folded" | "allin" | "waiting" | "disconnected" | "sitting-out";
    isDealer?: boolean;
    isSmallBlind?: boolean;
    isBigBlind?: boolean;
    cards?: Array<{ suit: "spades" | "hearts" | "diamonds" | "clubs"; rank: string }>;
    country?: string;
  };
  isCurrentTurn?: boolean;
  timeLeft?: number;
  isHero?: boolean;
  onSitDown?: () => void;
}

import { AVATAR_IMAGES } from "../stores/settingsStore";
const avatarImages = AVATAR_IMAGES;
const avatarColors = [
  "#F7931A", "#627EEA", "#26A17B", "#FF6B35", "#7C3AED",
  "#059669", "#DC2626", "#D4A50A", "#64748B", "#DB2777",
];
const avatarGlyphs = ["₿", "Ξ", "₮", "◆", "忍", "</>", "♦", "♛", "♞", "♠"];

export function PlayerSlot({ player, isCurrentTurn, timeLeft = 100, isHero, position, onSitDown }: PlayerSlotProps) {
  if (!player) {
    return (
      <motion.button onClick={onSitDown}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="flex flex-col items-center gap-0"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle at 50% 40%, rgba(38,161,123,0.08), rgba(10,20,30,0.6))",
          border: "1.5px solid rgba(38,161,123,0.15)",
          boxShadow: "0 0 14px rgba(38,161,123,0.08), inset 0 1px 0 rgba(255,255,255,0.03)",
          transition: "all 0.3s",
        }}>
          <Plus className="h-4 w-4" style={{ color: "rgba(38,161,123,0.5)" }} />
        </div>
      </motion.button>
    );
  }

  const isDead = player.status === "folded" || player.status === "disconnected" || player.status === "sitting-out";
  const isAllIn = player.status === "allin";
  const isDisconnected = player.status === "disconnected";
  const isTurn = isCurrentTurn && !isDead;

  const timerColor = timeLeft > 50 ? "#34D399" : timeLeft > 20 ? "#FBBF24" : "#EF4444";
  const circumference = 2 * Math.PI * 19;
  const avatarColor = avatarColors[player.avatar % avatarColors.length];
  const avatarGlyph = avatarGlyphs[player.avatar % avatarGlyphs.length];

  const showOpponentCards = !isHero && !isDead && player.status !== "waiting";

  const formatStack = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="flex flex-col items-center gap-0 relative">

      {/* Opponent face-down cards — floating above */}
      <AnimatePresence>
        {showOpponentCards && !isAllIn && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-0 pointer-events-none"
            style={{ top: -1, left: "50%", transform: "translateX(-50%) translateY(-80%)" }}>
            <div className="flex" style={{ gap: 0 }}>
              <div style={{ transform: "rotate(-6deg) translateX(1px)" }}>
                <PokerCard suit="spades" rank="A" faceDown size="xs" />
              </div>
              <div style={{ transform: "rotate(6deg) translateX(-1px)", marginLeft: -4 }}>
                <PokerCard suit="spades" rank="A" faceDown size="xs" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero hole cards */}
      {isHero && player.cards && (
        <motion.div className="flex gap-1 mb-1"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}>
          {player.cards.map((card, i) => (
            <PokerCard key={i} suit={card.suit} rank={card.rank as any} size="lg" highlight />
          ))}
        </motion.div>
      )}

      {/* === VERTICAL PLAYER BOX — avatar on top, nameplate below === */}
      <div className="relative" style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
        opacity: isDead ? 0.3 : 1,
        filter: isDead ? "saturate(0.3) brightness(0.6)" : "none",
        transition: "all 0.3s ease",
      }}>

        {/* Avatar circle with timer */}
        <div className="relative z-10 shrink-0" style={{ width: 56, height: 56 }}>
          {/* Turn timer ring */}
          {isTurn && (
            <>
              <motion.div className="absolute rounded-full"
                style={{ inset: -5, zIndex: -1, background: `radial-gradient(circle, ${timerColor}18, transparent 70%)` }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.96, 1.04, 0.96] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} />
              <svg className="absolute" style={{ inset: -3, width: 62, height: 62, zIndex: 5 }}
                viewBox="0 0 62 62">
                <circle cx="31" cy="31" r="27" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                <circle cx="31" cy="31" r="27" fill="none"
                  stroke={timerColor} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 27}
                  strokeDashoffset={2 * Math.PI * 27 * (1 - timeLeft / 100)}
                  transform="rotate(-90 31 31)"
                  style={{ filter: `drop-shadow(0 0 6px ${timerColor})`, transition: "stroke-dashoffset 0.3s ease" }} />
              </svg>
            </>
          )}

          {/* Avatar — image or fallback glyph */}
          <div style={{
            position: "absolute", inset: 2, borderRadius: "50%", overflow: "hidden",
            background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}CC)`,
            boxShadow: isTurn ? `0 0 16px ${timerColor}40` : "0 2px 10px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${isTurn ? timerColor + "60" : "rgba(255,255,255,0.1)"}`,
          }}>
            {avatarImages[player.avatar % avatarImages.length] ? (
              <img
                src={avatarImages[player.avatar % avatarImages.length]}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{
                fontSize: 22, color: "rgba(255,255,255,0.9)", fontWeight: 700,
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}>{avatarGlyph}</span>
            )}
          </div>

          {/* Country flag */}
          {player.country && !isDead && (
            <div style={{
              position: "absolute", top: -2, left: -2, zIndex: 10,
              fontSize: 9, lineHeight: 1,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
            }}>{player.country}</div>
          )}

          {/* Disconnected overlay */}
          {isDisconnected && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center z-20"
              style={{ background: "rgba(0,0,0,0.7)" }}>
              <WifiOff className="h-3 w-3" style={{ color: "#EF4444" }} />
            </div>
          )}

          {/* Dealer button */}
          {player.isDealer && (
            <div className="absolute z-20" style={{
              top: -3, right: -3, width: 15, height: 15, borderRadius: "50%",
              background: "linear-gradient(135deg, #FFF, #E8E8E8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
              border: "1px solid rgba(0,0,0,0.1)",
            }}>
              <span style={{ fontSize: 7, fontWeight: 900, color: "#1A1A2E", fontFamily: "'JetBrains Mono', monospace" }}>D</span>
            </div>
          )}

          {/* SB/BB badges */}
          {player.isSmallBlind && (
            <div className="absolute z-20" style={{
              bottom: -2, left: -2, width: 13, height: 13, borderRadius: "50%",
              background: "linear-gradient(135deg, #38BDF8, #0284C7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}>
              <span style={{ fontSize: 6, fontWeight: 800, color: "#fff" }}>S</span>
            </div>
          )}
          {player.isBigBlind && (
            <div className="absolute z-20" style={{
              bottom: -2, right: -2, width: 13, height: 13, borderRadius: "50%",
              background: "linear-gradient(135deg, #FBBF24, #D97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}>
              <span style={{ fontSize: 6, fontWeight: 800, color: "#1A1A2E" }}>B</span>
            </div>
          )}
        </div>

        {/* Name plate — below avatar */}
        <div style={{
          marginTop: -6,
          padding: "8px 10px 4px 10px",
          borderRadius: 8,
          minWidth: 70,
          textAlign: "center",
          background: isTurn
            ? `linear-gradient(180deg, rgba(0,0,0,0.88), rgba(0,0,0,0.92))`
            : "rgba(0,0,0,0.82)",
          border: isTurn ? `1px solid ${timerColor}35` : "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 3px 10px rgba(0,0,0,0.5)",
          zIndex: 5,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600,
            color: "#FFFFFF",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: 75, letterSpacing: "0.01em",
          }}>
            {player.name}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: isTurn ? timerColor : "rgba(255,255,255,0.55)",
            letterSpacing: "-0.02em",
          }}>
            {formatStack(player.stack)}
          </div>
        </div>
      </div>

      {/* All-In badge */}
      {isAllIn && (
        <motion.div
          style={{
            marginTop: 2, padding: "2px 8px", borderRadius: 12,
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            boxShadow: "0 0 12px rgba(245,158,11,0.3)",
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: "#000", letterSpacing: "0.1em" }}>ALL-IN</span>
        </motion.div>
      )}

      {/* Folded label */}
      {player.status === "folded" && (
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(239,68,68,0.25)", letterSpacing: "0.12em", marginTop: 2 }}>FOLD</span>
      )}
    </div>
  );
}
