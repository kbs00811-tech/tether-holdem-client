/**
 * TETHER.BET — Card Squeeze (GGPoker 3D Card Reveal)
 *
 * 기존 Unity TextureRender.cs의 OnMouseDrag를 React로 구현.
 * 유저가 카드를 위로 드래그하면 서서히 카드가 공개된다.
 *
 * 동작:
 * 1. 카드 뒷면이 보임 (3D perspective)
 * 2. 위로 드래그/스와이프 → 카드가 아래에서부터 서서히 벗겨짐
 * 3. 일정 이상 드래그하면 카드 전체 공개 (flip)
 * 4. 빠르게 탭하면 즉시 공개
 */

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PokerCard, type Suit, type Rank } from "./PokerCard";
import { playSound } from "../hooks/useSound";

interface CardSqueezeProps {
  card1: { suit: Suit; rank: Rank };
  card2: { suit: Suit; rank: Rank };
  onComplete?: () => void;
}

export function CardSqueeze({ card1, card2, onComplete }: CardSqueezeProps) {
  const [revealProgress, setRevealProgress] = useState(0); // 0-100
  const [revealed, setRevealed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.clientY; // 위로 드래그 = 양수
    const progress = Math.max(0, Math.min(100, deltaY * 0.8));
    setRevealProgress(progress);

    // 소리 피드백
    if (progress > 20 && progress < 22) playSound('cardDeal');
    if (progress > 50 && progress < 52) playSound('cardFlip');
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (revealProgress > 60) {
      // 충분히 드래그했으면 완전 공개
      setRevealed(true);
      setRevealProgress(100);
      playSound('cardFlip');
      onComplete?.();
    } else {
      // 스냅백
      setRevealProgress(0);
    }
  }, [revealProgress, onComplete]);

  const handleTap = useCallback(() => {
    if (!isDragging && !revealed) {
      setRevealed(true);
      setRevealProgress(100);
      playSound('cardFlip');
      onComplete?.();
    }
  }, [isDragging, revealed, onComplete]);

  if (revealed) {
    // 공개된 상태 — 카드 2장 표시
    return (
      <motion.div
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="flex gap-2"
      >
        <motion.div
          initial={{ rotateY: 180 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <PokerCard suit={card1.suit} rank={card1.rank} size="xl" highlight />
        </motion.div>
        <motion.div
          initial={{ rotateY: 180 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: 0.5, delay: 0.15, type: "spring" }}
        >
          <PokerCard suit={card2.suit} rank={card2.rank} size="xl" highlight />
        </motion.div>
      </motion.div>
    );
  }

  // 스퀴즈 모드 — 드래그로 서서히 공개
  const peelAngle = revealProgress * 1.8; // 최대 180도
  const peelScale = 1 + revealProgress * 0.002;
  const glowOpacity = revealProgress / 200;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleTap}
      className="relative cursor-grab active:cursor-grabbing select-none touch-none"
      style={{ perspective: "600px" }}
    >
      {/* Instructions */}
      <AnimatePresence>
        {revealProgress < 10 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10"
          >
            <span className="text-[10px] text-[#4A5A70] animate-pulse">
              ↑ Drag up to squeeze · Tap to reveal
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card container with peel effect */}
      <div className="flex gap-1">
        {/* Card 1 */}
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          {/* Back face (visible initially) */}
          <motion.div
            animate={{
              rotateX: peelAngle,
              scale: peelScale,
            }}
            transition={{ type: "tween", duration: 0.05 }}
            style={{
              transformOrigin: "bottom center",
              backfaceVisibility: "hidden",
            }}
          >
            <PokerCard suit="spades" rank="A" faceDown size="lg" />
          </motion.div>

          {/* Peek strip — shows card value from bottom */}
          {revealProgress > 5 && (
            <div
              className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-lg"
              style={{
                height: `${Math.min(revealProgress, 95)}%`,
                transition: isDragging ? "none" : "height 0.3s",
              }}
            >
              <div className="absolute bottom-0 left-0 right-0" style={{ height: "140px" }}>
                <PokerCard suit={card1.suit} rank={card1.rank} size="lg" />
              </div>
            </div>
          )}

          {/* Glow effect during squeeze */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: `linear-gradient(to top, rgba(255,215,0,${glowOpacity}), transparent 60%)`,
              boxShadow: revealProgress > 30 ? `0 0 ${revealProgress / 3}px rgba(255,215,0,${glowOpacity})` : "none",
            }}
          />
        </div>

        {/* Card 2 */}
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          <motion.div
            animate={{
              rotateX: peelAngle * 0.8, // 약간 느리게
              scale: peelScale,
            }}
            transition={{ type: "tween", duration: 0.05 }}
            style={{
              transformOrigin: "bottom center",
              backfaceVisibility: "hidden",
            }}
          >
            <PokerCard suit="spades" rank="A" faceDown size="lg" />
          </motion.div>

          {revealProgress > 10 && (
            <div
              className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-lg"
              style={{
                height: `${Math.min(revealProgress - 5, 95)}%`,
                transition: isDragging ? "none" : "height 0.3s",
              }}
            >
              <div className="absolute bottom-0 left-0 right-0" style={{ height: "140px" }}>
                <PokerCard suit={card2.suit} rank={card2.rank} size="lg" />
              </div>
            </div>
          )}

          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: `linear-gradient(to top, rgba(255,215,0,${glowOpacity * 0.8}), transparent 60%)`,
              boxShadow: revealProgress > 30 ? `0 0 ${revealProgress / 4}px rgba(255,215,0,${glowOpacity * 0.8})` : "none",
            }}
          />
        </div>
      </div>

      {/* Progress bar */}
      {revealProgress > 0 && revealProgress < 100 && (
        <div className="absolute -bottom-4 left-0 right-0 h-0.5 rounded-full bg-[#1A2235] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${revealProgress}%`,
              background: revealProgress > 60 ? "#FFD700" : "#26A17B",
            }}
          />
        </div>
      )}
    </div>
  );
}
