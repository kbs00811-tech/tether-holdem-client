import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { PokerCard } from "./PokerCard";
import { WifiOff, Plus, DollarSign, Smile, LogOut, Settings } from "lucide-react";

interface PlayerSlotProps {
  position: number;
  player?: {
    name: string;
    stack: number;
    bet: number;
    avatar: number;
    status: "active" | "folded" | "allin" | "waiting" | "disconnected" | "sitting-out" | "wait-bb";
    isDealer?: boolean;
    isSmallBlind?: boolean;
    isBigBlind?: boolean;
    cards?: Array<{ suit: "spades" | "hearts" | "diamonds" | "clubs"; rank: string }>;
    country?: string;
    hudStats?: {
      vpip: number;
      pfr: number;
      af: number;
      type: string;
      hands: number;
    };
  };
  isCurrentTurn?: boolean;
  timeLeft?: number;           // (legacy) 0~100 percent 폴백
  turnDeadline?: number;       // 서버 기준 절대 시각(ms). 있으면 이걸 사용해 라이브 틱
  turnTotalMs?: number;        // 전체 턴 제한 시간(ms) — 기본 30000
  isHero?: boolean;
  onSitDown?: () => void;
  hideCards?: boolean;
  onTopUp?: () => void;
  onEmoji?: () => void;
  onSitOut?: () => void;
}

import { AVATAR_IMAGES, useSettingsStore } from "../stores/settingsStore";
import { playSound } from "../hooks/useSound";
const avatarImages = AVATAR_IMAGES;
const avatarColors = [
  "#F7931A", "#627EEA", "#26A17B", "#FF6B35", "#7C3AED",
  "#059669", "#DC2626", "#D4A50A", "#64748B", "#DB2777",
];
const avatarGlyphs = ["₿", "Ξ", "₮", "◆", "忍", "</>", "♦", "♛", "♞", "♠"];

/**
 * 히어로 카드 — 단순하고 확실한 구현
 * 처음: 카드 2장 바로 오픈 (플립 애니메이션)
 */

export function PlayerSlot({ player, isCurrentTurn, timeLeft = 100, turnDeadline, turnTotalMs = 30000, isHero, position, onSitDown, hideCards, onTopUp, onEmoji, onSitOut, recentAction }: PlayerSlotProps) {
  const navigate = useNavigate();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 480;
  const avatarSize = isDesktop ? 68 : isMobile ? 42 : 52;
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // ===== 라이브 카운트다운 (버그1 수정) =====
  // turnDeadline 이 있으면 250ms 간격으로 남은 시간을 재계산해 표시
  const [liveRemainMs, setLiveRemainMs] = useState<number | null>(null);
  useEffect(() => {
    if (!isCurrentTurn || !turnDeadline) {
      setLiveRemainMs(null);
      return;
    }
    const tick = () => {
      const remain = Math.max(0, turnDeadline - Date.now());
      setLiveRemainMs(remain);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isCurrentTurn, turnDeadline]);

  // 표시값 계산: 라이브 데드라인 > 0~100 timeLeft prop > 기본 100
  const effectivePercent = liveRemainMs !== null
    ? Math.max(0, Math.min(100, (liveRemainMs / turnTotalMs) * 100))
    : (typeof timeLeft === 'number' ? timeLeft : 100);
  const effectiveSeconds = liveRemainMs !== null
    ? Math.ceil(liveRemainMs / 1000)
    : Math.max(0, Math.ceil((effectivePercent / 100) * (turnTotalMs / 1000)));
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<number | null>(null);
  const currentAvatar = useSettingsStore(s => s.avatar);
  const setAvatar = useSettingsStore(s => s.setAvatar);

  if (!player) {
    // ★ 클릭 영역을 아바타보다 1.6배 크게 — 모바일 터치 안정성
    const hitSize = Math.round(avatarSize * 1.7);
    return (
      <motion.button
        onClick={(e) => { e.stopPropagation(); onSitDown?.(); }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
        className="flex flex-col items-center gap-1 relative"
        style={{
          width: hitSize, height: hitSize + 24,
          background: "transparent", border: "none", cursor: "pointer",
          padding: 0,
          // ★ 터치 영역 명확화 — 디버깅 시 보이게
          touchAction: 'manipulation',
        }}>
        <div style={{
          width: avatarSize, height: avatarSize, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle at 50% 40%, rgba(52,211,153,0.22), rgba(10,20,30,0.6))",
          border: "2.5px dashed rgba(52,211,153,0.7)",
          boxShadow: "0 0 28px rgba(52,211,153,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
          transition: "all 0.3s",
        }}>
          <Plus className="h-6 w-6" style={{ color: "#34D399" }} strokeWidth={3} />
        </div>
        {/* SIT HERE 라벨 */}
        <div style={{
          padding: isDesktop ? '4px 10px' : '3px 7px',
          borderRadius: 999,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          border: '1.5px solid rgba(255,255,255,0.35)',
          boxShadow: '0 3px 10px rgba(16,185,129,0.5)',
          whiteSpace: 'nowrap',
          marginTop: 4,
        }}>
          <span className="font-black text-white tracking-wider" style={{
            fontSize: isDesktop ? 10 : 8,
            letterSpacing: '0.1em',
          }}>SIT HERE</span>
        </div>
      </motion.button>
    );
  }

  const isWaitBB = player.status === "wait-bb";
  const isDead = player.status === "folded" || player.status === "disconnected" || player.status === "sitting-out" || isWaitBB;
  const isAllIn = player.status === "allin";
  const isDisconnected = player.status === "disconnected";
  const isTurn = isCurrentTurn && !isDead;

  const timerColor = effectivePercent > 50 ? "#34D399" : effectivePercent > 20 ? "#FBBF24" : "#EF4444";
  const circumference = 2 * Math.PI * 19;
  const avatarColor = avatarColors[player.avatar % avatarColors.length];
  const avatarGlyph = avatarGlyphs[player.avatar % avatarGlyphs.length];

  const showOpponentCards = !isHero && !isDead && player.status !== "waiting";

  const formatStack = (n: number) => {
    // 100원 단위로 반올림 후 콤마 구분 풀 표시
    const rounded = Math.round(n / 100) * 100;
    return `₩${rounded.toLocaleString()}`;
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

      {/* 히어로 카드는 GameTable에서 고정 위치로 직접 렌더링 */}

      {/* === VERTICAL PLAYER BOX — avatar on top, nameplate below === */}
      <div className="relative" style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
        opacity: isDead ? 0.3 : 1,
        filter: isDead ? "saturate(0.3) brightness(0.6)" : "none",
        transition: "all 0.3s ease",
      }}>

        {/* ═══ WAIT_BB 배지 — 노란색, "WAITING" 표시 ═══ */}
        {isWaitBB && (
          <motion.div
            initial={{ scale: 0, y: -8 }}
            animate={{ scale: 1, y: 0, opacity: [0.7, 1, 0.7] }}
            transition={{ scale: { type: "spring", stiffness: 300 }, opacity: { duration: 1.6, repeat: Infinity } }}
            className="absolute left-1/2 -translate-x-1/2 z-50"
            style={{
              top: isDesktop ? -16 : isMobile ? -11 : -13,
              padding: isDesktop ? "3px 8px" : "2px 6px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              boxShadow: "0 0 12px rgba(251,191,36,0.5)",
            }}
          >
            <span className="font-black text-[#1A1A2E] tracking-wider" style={{
              fontSize: isDesktop ? 9 : 7,
              letterSpacing: "0.08em",
            }}>WAIT BB</span>
          </motion.div>
        )}

        {/* ═══ HERO LAYER 1: persistent radial pulse glow behind everything ═══ */}
        {isHero && !isDead && (
          <motion.div
            className="absolute pointer-events-none"
            style={{
              top: -10, left: "50%", width: isDesktop ? 110 : isMobile ? 70 : 88,
              height: isDesktop ? 110 : isMobile ? 70 : 88,
              transform: "translateX(-50%)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,107,53,0.35) 0%, rgba(255,107,53,0.12) 40%, transparent 70%)",
              zIndex: -1,
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* ═══ HERO LAYER 2: prominent "YOU" badge ═══ */}
        {isHero && !isDead && (
          <motion.div
            initial={{ scale: 0, y: -8 }}
            animate={{
              scale: 1, y: 0,
              boxShadow: [
                "0 0 12px rgba(255,107,53,0.5), 0 0 24px rgba(255,107,53,0.25)",
                "0 0 22px rgba(255,107,53,0.8), 0 0 40px rgba(255,107,53,0.4)",
                "0 0 12px rgba(255,107,53,0.5), 0 0 24px rgba(255,107,53,0.25)",
              ],
            }}
            transition={{ scale: { type: "spring", stiffness: 300 }, boxShadow: { duration: 1.8, repeat: Infinity } }}
            className="absolute left-1/2 -translate-x-1/2 z-50"
            style={{
              top: isDesktop ? -16 : isMobile ? -11 : -13,
              padding: isDesktop ? "3px 10px" : "2px 7px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #FF8A4C 0%, #FF6B35 50%, #E85D2C 100%)",
              border: "1.5px solid rgba(255,255,255,0.5)",
            }}
          >
            <span className="font-black text-white tracking-widest" style={{
              fontSize: isDesktop ? 10 : 8,
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              letterSpacing: "0.12em",
            }}>YOU</span>
          </motion.div>
        )}

        {/* Avatar circle */}
        <div className="relative z-10 shrink-0" style={{ width: isDesktop ? 72 : isMobile ? 44 : 56, height: isDesktop ? 72 : isMobile ? 44 : 56 }}>
          {/* Turn glow behind avatar */}
          {isTurn && (
            <motion.div className="absolute rounded-full"
              style={{ inset: -4, zIndex: -1, background: `radial-gradient(circle, ${timerColor}22, transparent 70%)` }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.96, 1.04, 0.96] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} />
          )}

          {/* Avatar — image or fallback glyph (원형) + 히어로 클릭 메뉴 */}
          <div
            onClick={isHero ? () => setShowAvatarMenu(!showAvatarMenu) : undefined}
            style={{
            position: "absolute", inset: 2, borderRadius: "50%", overflow: "hidden",
            background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}CC)`,
            boxShadow: isTurn
              ? `0 0 16px ${timerColor}40`
              : isHero && !isDead
                ? "0 0 18px rgba(255,107,53,0.55), 0 0 32px rgba(255,107,53,0.25), 0 2px 10px rgba(0,0,0,0.5)"
                : "0 2px 10px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: isTurn
              ? `2.5px solid ${timerColor}80`
              : isHero && !isDead
                ? "2.5px solid #FF6B35"
                : "2px solid rgba(255,255,255,0.1)",
            cursor: isHero ? "pointer" : "default",
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

        {/* ===== TIMER BAR + COUNTDOWN — 아바타 아래 ===== */}
        {isTurn && (
          <div style={{ width: isDesktop ? 76 : isMobile ? 48 : 60, marginTop: 2, zIndex: 15 }}>
            {/* 타이머 바 — 라이브 percent 로 표시 (애니메이션 제거, 매 tick 재렌더) */}
            <div style={{
              width: "100%", height: 4, borderRadius: 2,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}>
              <div
                style={{
                  width: `${effectivePercent}%`,
                  height: "100%", borderRadius: 2,
                  background: `linear-gradient(90deg, ${timerColor}, ${timerColor}CC)`,
                  boxShadow: `0 0 8px ${timerColor}60`,
                  transition: "width 250ms linear",
                }}
              />
            </div>
            {/* 카운트다운 초 — 실제 남은 시간 표시 */}
            <motion.div
              animate={{ opacity: effectiveSeconds <= 5 ? [1, 0.4, 1] : 1 }}
              transition={{ repeat: effectiveSeconds <= 5 ? Infinity : 0, duration: 0.6 }}
              style={{
                textAlign: "center", marginTop: 1,
                fontSize: 10, fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                color: timerColor,
                textShadow: `0 0 6px ${timerColor}50`,
              }}
            >
              {effectiveSeconds}s
            </motion.div>
          </div>
        )}

        {/* Name plate — below avatar */}
        <div style={{
          marginTop: -6,
          padding: isDesktop ? "9px 14px 5px 14px" : isMobile ? "6px 8px 3px 8px" : "8px 10px 4px 10px",
          borderRadius: isMobile ? 6 : 8,
          minWidth: isDesktop ? 85 : isMobile ? 54 : 70,
          textAlign: "center",
          background: isHero && !isDead
            ? "linear-gradient(180deg, rgba(40,16,4,0.95), rgba(28,10,2,0.96))"
            : isTurn
              ? `linear-gradient(180deg, rgba(0,0,0,0.88), rgba(0,0,0,0.92))`
              : "rgba(0,0,0,0.82)",
          border: isHero && !isDead
            ? "1.5px solid rgba(255,107,53,0.65)"
            : isTurn ? `1px solid ${timerColor}35` : "1px solid rgba(255,255,255,0.05)",
          boxShadow: isHero && !isDead
            ? "0 3px 10px rgba(0,0,0,0.5), 0 0 12px rgba(255,107,53,0.25)"
            : "0 3px 10px rgba(0,0,0,0.5)",
          zIndex: 5,
        }}>
          <div style={{
            fontSize: isDesktop ? 12 : isMobile ? 8 : 10, fontWeight: isHero ? 800 : 600,
            color: isHero && !isDead ? "#FFD4B8" : "#FFFFFF",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: isDesktop ? 90 : isMobile ? 55 : 75, letterSpacing: "0.01em",
            textShadow: isHero && !isDead ? "0 1px 4px rgba(255,107,53,0.5)" : "none",
          }}>
            {player.name}
          </div>
          <div style={{
            fontSize: isDesktop ? 13 : isMobile ? 9 : 11, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: isTurn ? timerColor : "rgba(255,255,255,0.55)",
            letterSpacing: "-0.02em",
          }}>
            {formatStack(player.stack)}
          </div>
          {/* Smart HUD — VPIP / PFR / Type */}
          {!isHero && player.hudStats && player.hudStats.hands >= 5 && (
            <div style={{
              marginTop: 3,
              display: "flex", alignItems: "center", gap: 3,
              justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: isDesktop ? 9 : 7,
              fontWeight: 800,
              lineHeight: 1,
            }}>
              <span style={{
                color: player.hudStats.vpip > 35 ? "#EF4444" : player.hudStats.vpip > 22 ? "#FBBF24" : "#26A17B",
              }}>{player.hudStats.vpip}</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{
                color: player.hudStats.pfr > 25 ? "#EF4444" : player.hudStats.pfr > 15 ? "#FBBF24" : "#26A17B",
              }}>{player.hudStats.pfr}</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span style={{
                color: player.hudStats.af > 3 ? "#EF4444" : player.hudStats.af > 1.5 ? "#FBBF24" : "#26A17B",
              }}>{player.hudStats.af}</span>
            </div>
          )}
          {!isHero && player.hudStats && player.hudStats.type !== 'unknown' && (
            <div style={{
              marginTop: 2,
              fontSize: isDesktop ? 8 : 6,
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: (() => {
                const t = player.hudStats.type;
                if (t === 'maniac' || t === 'whale') return '#EF4444';
                if (t === 'fish' || t === 'lag') return '#FBBF24';
                if (t === 'nit') return '#60A5FA';
                if (t === 'tag' || t === 'reg' || t === 'pro') return '#26A17B';
                return '#6B7A90';
              })(),
            }}>{player.hudStats.type}</div>
          )}
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

      {/* ═══ Recent Action Badge — 최근 액션 표시 (1.8초 지속) ═══ */}
      <AnimatePresence>
        {recentAction && (() => {
          const labels: Record<number, { text: string; color: string; bg: string }> = {
            0: { text: "FOLD",  color: "#FFFFFF", bg: "linear-gradient(135deg, #6B7A90, #4A5A70)" },
            1: { text: "CHECK", color: "#FFFFFF", bg: "linear-gradient(135deg, #34D399, #059669)" },
            2: { text: `CALL ${recentAction.amount > 0 ? "₩" + Math.floor(recentAction.amount / 100).toLocaleString() : ""}`,
                 color: "#FFFFFF", bg: "linear-gradient(135deg, #60A5FA, #2563EB)" },
            3: { text: `RAISE ₩${Math.floor(recentAction.amount / 100).toLocaleString()}`,
                 color: "#FFFFFF", bg: "linear-gradient(135deg, #FF6B35, #E85D2C)" },
            4: { text: "ALL IN!", color: "#FFFFFF", bg: "linear-gradient(135deg, #EF4444, #B91C1C)" },
          };
          const l = labels[recentAction.action];
          if (!l) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.9 }}
              transition={{ duration: 0.25, type: "spring", stiffness: 400 }}
              style={{
                position: "absolute",
                top: -28,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "3px 10px",
                borderRadius: 10,
                background: l.bg,
                color: l.color,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 14px rgba(0,0,0,0.5), 0 0 12px rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                zIndex: 10,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}>
              {l.text}
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ===== Hero Avatar Menu — 화면 중앙 모달 (위치 짤림 방지) ===== */}
      <AnimatePresence>
        {isHero && showAvatarMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAvatarMenu(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 16,
            }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 360,
                padding: 18, borderRadius: 20,
                background: "linear-gradient(135deg, rgba(20,28,40,0.98), rgba(12,18,26,0.98))",
                border: "1px solid rgba(255,215,0,0.25)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,215,0,0.15)",
              }}>
              {/* 헤더 — 내 정보 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                paddingBottom: 14, marginBottom: 14,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}CC)`,
                  border: "2px solid rgba(255,215,0,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                  boxShadow: "0 0 20px rgba(255,215,0,0.2)",
                }}>
                  {avatarImages[player.avatar % avatarImages.length] ? (
                    <img src={avatarImages[player.avatar % avatarImages.length]} alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 24 }}>{avatarGlyph}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, color: "#FFFFFF", fontWeight: 800 }}>{player.name}</div>
                  <div style={{ fontSize: 12, color: "#FFD700", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, marginTop: 2 }}>
                    ₩{player.stack.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setShowAvatarMenu(false)}
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    color: "#6B7A90", border: "none", cursor: "pointer",
                    fontSize: 14, fontWeight: 700,
                  }}>✕</button>
              </div>

              {/* 핵심 액션 — 4개로 축소 (모바일 화면 안에 안전하게 들어감) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[
                  { icon: "💰", label: "Top Up",  color: "#34D399", action: () => { onTopUp?.(); setShowAvatarMenu(false); } },
                  { icon: "🎨", label: "Avatar",  color: "#A78BFA", action: () => { setShowAvatarPicker(v => !v); } },
                  { icon: "💤", label: "Sit Out", color: "#FBBF24", action: () => { onSitOut?.(); setShowAvatarMenu(false); } },
                  { icon: "🚪", label: "Leave",   color: "#EF4444", action: () => {
                      setShowAvatarMenu(false);
                      // 강제 나가기 — STAND_UP + LEAVE_ROOM + navigate
                      try { (window as any).__forceLeave?.(); } catch {}
                    } },
                ].map(item => (
                  <button key={item.label}
                    onClick={(e) => { e.stopPropagation(); item.action(); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                      padding: "14px 4px", borderRadius: 12,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${item.color}25`,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${item.color}15`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <span style={{ fontSize: 26 }}>{item.icon}</span>
                    <span style={{ fontSize: 9, color: item.color, fontWeight: 800, letterSpacing: "0.03em" }}>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* ── Avatar Picker (저장 버튼 패턴) ── */}
              {showAvatarPicker && (
                <div style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{
                    fontSize: 10,
                    color: "#A78BFA",
                    fontWeight: 800,
                    marginBottom: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}>
                    Choose Avatar
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: 6,
                    maxHeight: 160,
                    overflowY: "auto",
                  }}>
                    {avatarImages.map((src, i) => {
                      const selected = (pendingAvatar ?? currentAvatar) === i;
                      return (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingAvatar(i);
                          }}
                          style={{
                            aspectRatio: "1",
                            borderRadius: "50%",
                            border: "none",
                            cursor: "pointer",
                            overflow: "hidden",
                            padding: 0,
                            background: "transparent",
                            boxShadow: selected
                              ? "0 0 0 2px #FFD700, 0 0 12px rgba(255,215,0,0.4)"
                              : "0 0 0 1px rgba(255,255,255,0.05)",
                            opacity: selected ? 1 : 0.65,
                            transition: "all 0.15s",
                          }}>
                          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </button>
                      );
                    })}
                  </div>
                  {/* 저장/취소 버튼 */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingAvatar(null);
                        setShowAvatarPicker(false);
                      }}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 10,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#8899AB", fontSize: 11, fontWeight: 700,
                        cursor: "pointer",
                      }}>
                      Cancel
                    </button>
                    <button
                      disabled={pendingAvatar === null || pendingAvatar === currentAvatar}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pendingAvatar !== null) {
                          setAvatar(pendingAvatar);
                          setPendingAvatar(null);
                          setShowAvatarPicker(false);
                        }
                      }}
                      style={{
                        flex: 1, padding: "9px 0", borderRadius: 10,
                        background: pendingAvatar !== null && pendingAvatar !== currentAvatar
                          ? "linear-gradient(135deg, #FFD700, #E5A500)"
                          : "rgba(255,255,255,0.03)",
                        border: "none",
                        color: pendingAvatar !== null && pendingAvatar !== currentAvatar ? "#0A0B10" : "#3A4A5A",
                        fontSize: 11, fontWeight: 900,
                        cursor: pendingAvatar !== null && pendingAvatar !== currentAvatar ? "pointer" : "not-allowed",
                        letterSpacing: "0.03em",
                      }}>
                      💾 Save
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
