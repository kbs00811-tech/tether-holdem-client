import { useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Medal, DollarSign, X } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface TournamentResultModalProps {
  open: boolean;
  onClose: () => void;
  placement: number;
  totalPlayers: number;
  prize?: number;
}

export function TournamentResultModal({
  open,
  onClose,
  placement,
  totalPlayers,
  prize,
}: TournamentResultModalProps) {
  const isWinner = placement === 1;
  const isTopThree = placement <= 3;

  useEffect(() => {
    if (open && isWinner) {
      // Celebration confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#26A17B", "#FFD700", "#FF4757"],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#26A17B", "#FFD700", "#FF4757"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [open, isWinner]);

  const getPlacementColor = () => {
    if (placement === 1) return "text-yellow-500";
    if (placement === 2) return "text-gray-400";
    if (placement === 3) return "text-amber-700";
    return "text-foreground";
  };

  const getPlacementIcon = () => {
    if (placement === 1)
      return <Trophy className="h-20 w-20 text-yellow-500" />;
    if (placement === 2 || placement === 3)
      return <Medal className={`h-20 w-20 ${getPlacementColor()}`} />;
    return null;
  };

  const getTitle = () => {
    if (placement === 1) return "🎉 Congratulations! 🎉";
    if (isTopThree) return `${placement}th Place!`;
    return "Tournament Finished";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="sr-only">{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-8 text-center">
          {/* Icon */}
          {isTopThree && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="mb-6"
            >
              {getPlacementIcon()}
            </motion.div>
          )}

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-3xl font-bold mb-2 ${
              isWinner ? "text-yellow-500" : ""
            }`}
          >
            {getTitle()}
          </motion.h2>

          {/* Placement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className={`text-6xl font-bold ${getPlacementColor()}`}>
              #{placement}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {totalPlayers}of
            </p>
          </motion.div>

          {/* Prize */}
          {prize && prize > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="bg-primary/10 border border-primary rounded-xl px-8 py-4 mb-6"
            >
              <div className="flex items-center gap-2 justify-center mb-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-sm text-muted-foreground">Prize</span>
              </div>
              <div className="text-3xl font-bold font-mono text-primary">
                {prize.toLocaleString()} USDT
              </div>
            </motion.div>
          )}

          {/* No Prize Message */}
          {(!prize || prize === 0) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-6"
            >
              Better luck next time!
            </motion.p>
          )}

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3 w-full"
          >
            <Button variant="outline" onClick={onClose} className="flex-1">
              로비로
            </Button>
            <Button className="flex-1">다시 도전</Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
