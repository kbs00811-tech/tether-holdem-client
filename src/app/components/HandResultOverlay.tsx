import { motion } from "motion/react";
import { Trophy, X, TrendingUp } from "lucide-react";
import { PokerCard } from "./PokerCard";
import { Button } from "./ui/button";

interface Winner {
  name: string;
  hand: string;
  cards: Array<{ suit: "spades" | "hearts" | "diamonds" | "clubs"; rank: string }>;
  potWon: number;
  winProbability?: number; // For all-in scenarios
}

interface HandResultOverlayProps {
  winners: Winner[]; // Changed to array for split pot support
  isSplitPot?: boolean;
  sidePots?: Array<{
    amount: number;
    winner: string;
  }>;
  allInScenario?: {
    player1: string;
    player2: string;
    odds1: number;
    odds2: number;
  };
  onClose: () => void;
}

export function HandResultOverlay({ 
  winners, 
  isSplitPot, 
  sidePots,
  allInScenario,
  onClose 
}: HandResultOverlayProps) {
  const winner = winners[0]; // Primary winner for single pot

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        className="relative max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Winner Card */}
        <div className="bg-gradient-to-br from-card to-muted border-2 border-accent rounded-xl p-8 shadow-2xl">
          {/* Trophy Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 rounded-full bg-accent flex items-center justify-center"
            >
              <Trophy className="h-12 w-12 text-accent-foreground" />
            </motion.div>
          </div>

          {/* Winner Name - Split Pot Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            {isSplitPot ? (
              <>
                <div className="text-3xl font-bold mb-2">Split Pot!</div>
                <div className="text-lg text-primary font-medium">
                  {winners.map((w) => w.name).join(" & ")} each win{" "}
                  <span className="font-mono">{winner.potWon.toLocaleString()} USDT</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold mb-2">{winner.name} Wins!</div>
                <div className="text-xl text-primary font-medium">{winner.hand}</div>
              </>
            )}
          </motion.div>

          {/* All-in Odds Display */}
          {allInScenario && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center justify-center gap-6 mb-6"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm">{allInScenario.player1}</span>
                <span className="font-mono font-bold text-primary">{allInScenario.odds1}%</span>
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{allInScenario.player2}</span>
                <span className="font-mono font-bold text-muted-foreground">{allInScenario.odds2}%</span>
              </div>
            </motion.div>
          )}

          {/* Winning Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            {/* Primary Winner Cards */}
            <div className="flex justify-center gap-3">
              {winner.cards.map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, rotateY: -180 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <PokerCard
                    suit={card.suit}
                    rank={card.rank as any}
                    size="lg"
                    highlight
                  />
                </motion.div>
              ))}
            </div>

            {/* Split Pot - Second Winner Cards */}
            {isSplitPot && winners[1] && (
              <div className="flex justify-center gap-3">
                {winners[1].cards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, rotateY: -180 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <PokerCard
                      suit={card.suit}
                      rank={card.rank as any}
                      size="lg"
                      highlight
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Side Pots */}
          {sidePots && sidePots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6 space-y-2"
            >
              <div className="text-center text-sm text-muted-foreground mb-2">
                Multiple Pots
              </div>
              {sidePots.map((pot, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2"
                >
                  <span className="text-sm">
                    {idx === 0 ? "Main Pot" : `Side Pot ${idx}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-accent">
                      {pot.amount.toLocaleString()} USDT
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-sm font-medium">{pot.winner}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Pot Amount */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="text-center"
          >
            <div className="text-sm text-muted-foreground mb-2">
              {isSplitPot ? "Each Wins" : "Pot Won"}
            </div>
            <div className="text-4xl font-bold font-mono text-accent">
              {winner.potWon.toLocaleString()} USDT
            </div>
          </motion.div>

          {/* Particles Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: Math.random() * 1.5 + 0.5,
                  opacity: 0,
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2 bg-accent rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Auto-close hint */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          Click anywhere or wait 3 seconds to continue
        </div>
      </motion.div>
    </motion.div>
  );
}