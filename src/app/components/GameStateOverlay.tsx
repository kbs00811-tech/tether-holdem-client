import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, Users, Trophy } from "lucide-react";
import { getSymbol } from "../utils/currency";

interface GameStateOverlayProps {
  type: "level-up" | "side-pot" | "waiting" | "countdown" | null;
  data?: {
    oldBlinds?: string;
    newBlinds?: string;
    sidePot?: number;
    countdown?: number;
    message?: string;
  };
  onClose?: () => void;
}

export function GameStateOverlay({ type, data, onClose }: GameStateOverlayProps) {
  if (!type) return null;

  // Auto-close for certain types
  if (type === "side-pot" || type === "countdown") {
    setTimeout(() => {
      onClose?.();
    }, 3000);
  }

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => onClose?.()}
        >
          {/* Level Up */}
          {type === "level-up" && data?.oldBlinds && data?.newBlinds && (
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-card border-2 border-primary rounded-xl p-8 text-center shadow-2xl"
            >
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">블라인드 상승!</h2>
              <div className="flex items-center gap-3 justify-center text-muted-foreground">
                <span className="text-xl font-mono">{data.oldBlinds}</span>
                <span>→</span>
                <span className="text-xl font-mono text-primary font-bold">
                  {data.newBlinds}
                </span>
              </div>
            </motion.div>
          )}

          {/* Side Pot */}
          {type === "side-pot" && data?.sidePot && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-card border border-accent rounded-lg px-6 py-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm">
                  사이드 팟{" "}
                  <span className="font-mono font-bold text-accent">
                    {getSymbol()}{data.sidePot.toLocaleString()}
                  </span>{" "}
                  생성
                </span>
              </div>
            </motion.div>
          )}

          {/* Waiting for Players */}
          {type === "waiting" && (
            <motion.div
              className="bg-card border border-border rounded-xl p-8 text-center"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                게임 시작 대기중...
              </h3>
              <p className="text-sm text-muted-foreground">
                {data?.message || "플레이어가 입장하기를 기다리고 있습니다"}
              </p>
            </motion.div>
          )}

          {/* Countdown */}
          {type === "countdown" && data?.countdown !== undefined && (
            <motion.div
              key={data.countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-8xl font-bold text-primary"
            >
              {data.countdown === 0 ? "GO!" : data.countdown}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}