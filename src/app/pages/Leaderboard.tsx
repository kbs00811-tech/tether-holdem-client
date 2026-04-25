import { useState, useEffect } from "react";
import { Trophy, Crown, Medal, TrendingUp, Users, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { useT } from "../../i18n";

interface LeaderEntry {
  playerId: string;
  nickname: string;
  hands: number;
  profit_krw: number;
  biggestPot_krw: number;
}

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
] as const;

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const t = useT();
  const [period, setPeriod] = useState<string>('daily');
  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const wsHost = window.location.hostname;
    const apiBase = window.location.origin;
    fetch(`${apiBase}/admin/leaderboard?period=${period}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d.leaderboard || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

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
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#FFD700]" />
          <h1 className="text-lg font-black text-white">Leaderboard</h1>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button key={p.key}
              onClick={() => setPeriod(p.key)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: period === p.key ? "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))" : "rgba(255,255,255,0.03)",
                color: period === p.key ? "#FFD700" : "#6B7A90",
                border: period === p.key ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,255,255,0.05)",
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4">
        {loading ? (
          <div className="text-center py-20 text-[#4A5A70] text-sm">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="h-12 w-12 text-[#2A3545] mx-auto mb-3" />
            <p className="text-sm text-[#4A5A70]">No data for this period</p>
            <p className="text-xs text-[#2A3545] mt-1">Play hands to appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((entry, i) => {
              const isTop3 = i < 3;
              const medal = MEDALS[i] || `#${i + 1}`;
              return (
                <motion.div key={entry.playerId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: isTop3
                      ? `linear-gradient(135deg, rgba(255,215,0,${0.08 - i * 0.02}), rgba(255,215,0,${0.03 - i * 0.01}))`
                      : "rgba(255,255,255,0.02)",
                    border: isTop3
                      ? `1px solid rgba(255,215,0,${0.2 - i * 0.05})`
                      : "1px solid rgba(255,255,255,0.03)",
                  }}>
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {isTop3 ? (
                      <span className="text-lg">{medal}</span>
                    ) : (
                      <span className="text-xs font-bold text-[#4A5A70]">#{i + 1}</span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {entry.nickname}
                    </div>
                    <div className="text-[10px] text-[#4A5A70]">
                      {entry.hands.toLocaleString()} hands
                    </div>
                  </div>

                  {/* Profit */}
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-mono font-black ${entry.profit_krw >= 0 ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                      {entry.profit_krw >= 0 ? '+' : ''}{entry.profit_krw.toLocaleString()}
                    </div>
                    {entry.biggestPot_krw > 0 && (
                      <div className="text-[9px] text-[#6B7A90]">
                        Best: {entry.biggestPot_krw.toLocaleString()}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
