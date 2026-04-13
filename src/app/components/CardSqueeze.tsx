/**
 * TETHER.BET — Card Squeeze V4
 * 카드는 제자리에 고정, 드래그 거리만 측정해서 스퀴즈 진행도 업데이트
 */

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { PokerCard, type Suit, type Rank } from "./PokerCard";
import { playSound } from "../hooks/useSound";

interface CardSqueezeProps {
  card1: { suit: Suit; rank: Rank };
  card2: { suit: Suit; rank: Rank };
}

export function CardSqueeze({ card1, card2 }: CardSqueezeProps) {
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const draggingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const lastSoundRef = useRef(0);

  useEffect(() => {
    const updateFromDelta = (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      const dy = startRef.current.y - clientY; // 위 = 양수
      const dx = Math.abs(clientX - startRef.current.x);
      const total = Math.max(dy, dx * 0.7);
      const p = Math.max(0, Math.min(100, total * 1.2));
      setProgress(p);
      const lastP = lastSoundRef.current;
      if (p > 18 && p < 22 && (lastP < 18 || lastP > 22)) playSound('cardDeal');
      if (p > 48 && p < 52 && (lastP < 48 || lastP > 52)) playSound('cardFlip');
      lastSoundRef.current = p;
    };

    const handleEnd = () => {
      if (!draggingRef.current) return;
      const elapsed = Date.now() - startRef.current.time;
      const finalP = progress;
      draggingRef.current = false;

      if (elapsed < 250 && finalP < 10) {
        // 빠른 탭 → 즉시 공개
        setRevealed(true);
        playSound('cardFlip');
        return;
      }
      if (finalP > 45) {
        setRevealed(true);
        playSound('cardFlip');
      } else {
        setProgress(0);
      }
    };

    const onMouseMove = (e: MouseEvent) => updateFromDelta(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        e.preventDefault();
        updateFromDelta(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleEnd();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [progress]);

  const startDrag = (clientX: number, clientY: number) => {
    draggingRef.current = true;
    startRef.current = { x: clientX, y: clientY, time: Date.now() };
    lastSoundRef.current = 0;
  };

  if (revealed) {
    return (
      <motion.div className="flex gap-1.5"
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }}
          transition={{ duration: 0.5, type: "spring" }}>
          <PokerCard suit={card1.suit} rank={card1.rank} size="lg" highlight />
        </motion.div>
        <motion.div initial={{ rotateY: 180 }} animate={{ rotateY: 0 }}
          transition={{ duration: 0.5, delay: 0.12, type: "spring" }}>
          <PokerCard suit={card2.suit} rank={card2.rank} size="lg" highlight />
        </motion.div>
      </motion.div>
    );
  }

  const peelAngle = progress * 1.5;
  const glowOpacity = progress / 150;

  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
      onTouchStart={(e) => { if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
      style={{
        cursor: draggingRef.current ? "grabbing" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        position: "relative",
        padding: 16,
        // 카드는 제자리 고정 — 드래그 시 움직이지 않음
      }}
    >
      {/* 안내 */}
      {progress < 5 && (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
            whiteSpace: "nowrap", pointerEvents: "none",
            padding: "4px 12px", borderRadius: 8,
            background: "rgba(0,0,0,0.85)",
            border: "1px solid rgba(255,215,0,0.4)",
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 10, color: "#FFD700", fontWeight: 700 }}>
            ↗ DRAG or TAP
          </span>
        </motion.div>
      )}

      <div style={{ display: "flex", gap: 4, paddingTop: 16, pointerEvents: "none" }}>
        {/* 카드 1 */}
        <div style={{ position: "relative", perspective: 600 }}>
          <div style={{
            transform: `rotateX(${peelAngle}deg) scale(${1 + progress * 0.001})`,
            transformOrigin: "bottom center",
            transition: progress === 0 ? "transform 0.3s ease" : "none",
          }}>
            <PokerCard suit="spades" rank="A" faceDown size="lg" />
          </div>
          {progress > 3 && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: `${Math.min(progress, 95)}%`,
              overflow: "hidden", borderRadius: "0 0 6px 6px",
            }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
                <PokerCard suit={card1.suit} rank={card1.rank} size="lg" />
              </div>
            </div>
          )}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 6,
            background: `linear-gradient(to top, rgba(255,215,0,${glowOpacity}), transparent 60%)`,
            boxShadow: progress > 25 ? `0 0 ${progress / 3}px rgba(255,215,0,${glowOpacity})` : "none",
          }} />
        </div>

        {/* 카드 2 */}
        <div style={{ position: "relative", perspective: 600 }}>
          <div style={{
            transform: `rotateX(${peelAngle * 0.75}deg) scale(${1 + progress * 0.0008})`,
            transformOrigin: "bottom center",
            transition: progress === 0 ? "transform 0.3s ease" : "none",
          }}>
            <PokerCard suit="spades" rank="A" faceDown size="lg" />
          </div>
          {progress > 8 && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: `${Math.min(progress - 5, 95)}%`,
              overflow: "hidden", borderRadius: "0 0 6px 6px",
            }}>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
                <PokerCard suit={card2.suit} rank={card2.rank} size="lg" />
              </div>
            </div>
          )}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 6,
            background: `linear-gradient(to top, rgba(255,215,0,${glowOpacity * 0.8}), transparent 60%)`,
          }} />
        </div>
      </div>

      {/* 진행바 */}
      {progress > 0 && progress < 100 && (
        <div style={{
          position: "absolute", bottom: 6, left: 16, right: 16, height: 4,
          borderRadius: 2, background: "rgba(26,34,53,0.8)", overflow: "hidden", pointerEvents: "none",
        }}>
          <div style={{
            width: `${progress}%`, height: "100%", borderRadius: 2,
            background: progress > 45 ? "#FFD700" : "#26A17B",
            boxShadow: `0 0 6px ${progress > 45 ? "#FFD700" : "#26A17B"}`,
          }} />
        </div>
      )}
    </div>
  );
}
