import { useState, useEffect } from "react";
import { ArrowLeft, Search, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { useGameStore } from "../stores/gameStore";

interface HandRecord {
  handNumber: number;
  pot: number;
  rake: number;
  winners: Array<{ playerId: string; nickname: string; amount: number; handResult?: { description: string } }>;
  board: string;
  timestamp: number;
}

export default function HandHistory() {
  const records = useGameStore(s => s.handHistoryRecords);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="min-h-screen pb-20" style={{ background: "#0B0E14" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <Link to="/lobby">
          <button className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <ArrowLeft className="h-5 w-5 text-[#8899AB]" />
          </button>
        </Link>
        <h1 className="text-lg font-black text-white">Hand History</h1>
        <span className="ml-auto text-xs text-[#4A5A70]">{records.length} hands</span>
      </div>

      {/* Records */}
      <div className="px-4 space-y-1.5">
        {records.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-10 w-10 text-[#2A3545] mx-auto mb-3" />
            <p className="text-sm text-[#4A5A70]">No hand records yet</p>
            <p className="text-xs text-[#2A3545] mt-1">Play hands to see your history</p>
          </div>
        ) : (
          [...records].reverse().map((hand, i) => {
            const isExpanded = expanded === hand.handNumber;
            const winner = hand.winners?.[0];
            const isMyWin = winner?.playerId && !winner.playerId.startsWith('bot_');
            const time = new Date(hand.timestamp);

            return (
              <motion.div key={hand.handNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : hand.handNumber)}
                  className="w-full text-left rounded-xl px-4 py-3 transition-all"
                  style={{
                    background: isExpanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
                    border: isExpanded ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.03)",
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center">
                      <span className="text-[10px] font-mono text-[#4A5A70]">#{hand.handNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {winner?.nickname ?? 'Unknown'}
                        </span>
                        {winner?.handResult?.description && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: "rgba(52,211,153,0.1)",
                              color: "#34D399",
                              border: "1px solid rgba(52,211,153,0.2)",
                            }}>
                            {winner.handResult.description}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-[#3D4F65]">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-[#34D399]">
                        +{Math.round(hand.pot / 100).toLocaleString()}
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[#4A5A70]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#4A5A70]" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-4 py-3 ml-4 rounded-b-xl space-y-2"
                        style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div>
                            <span className="text-[#4A5A70] block">Pot</span>
                            <span className="text-white font-mono font-bold">{Math.round(hand.pot / 100).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[#4A5A70] block">Rake</span>
                            <span className="text-[#FF6B35] font-mono font-bold">{Math.round(hand.rake / 100).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[#4A5A70] block">Winners</span>
                            <span className="text-white font-bold">{hand.winners?.length ?? 0}</span>
                          </div>
                        </div>
                        {hand.winners && hand.winners.length > 0 && (
                          <div className="space-y-1">
                            {hand.winners.map((w, j) => (
                              <div key={j} className="flex items-center justify-between text-[10px]">
                                <span className="text-[#8899AB]">{w.nickname}</span>
                                <span className="text-[#34D399] font-mono font-bold">+{Math.round(w.amount / 100).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
