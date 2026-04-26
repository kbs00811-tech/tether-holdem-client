import { useState, useEffect } from "react";
import { Target, Gift, Trophy, Star, ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";
import { useT } from "../../i18n";
import { toast } from "sonner";

interface Mission {
  id: string;
  type: 'daily' | 'weekly' | 'achievement';
  title: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  progressPct: number;
  completed: boolean;
  claimed: boolean;
  reward: { type: string; amount: number; label: string };
}

const TAB_ICONS = { daily: Target, weekly: Star, achievements: Trophy };

export default function Missions() {
  const t = useT();
  const [tab, setTab] = useState<'daily' | 'weekly' | 'achievements'>('daily');
  const [missions, setMissions] = useState<Record<string, Mission[]>>({ daily: [], weekly: [], achievements: [] });
  const [loading, setLoading] = useState(true);

  const playerId = (() => {
    try { return localStorage.getItem('holdem_player_id') || 'anonymous'; } catch { return 'anonymous'; }
  })();

  const fetchMissions = () => {
    fetch(`${window.location.origin}/admin/missions?player_id=${playerId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setMissions({ daily: d.daily, weekly: d.weekly, achievements: d.achievements }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMissions(); }, []);

  const claimReward = (missionId: string) => {
    fetch(`${window.location.origin}/admin/missions/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, mission_id: missionId }),
    }).then(r => r.json()).then(d => {
      if (d.success) {
        toast.success(`Reward claimed: ${d.reward?.label || 'Reward'}`);
        fetchMissions();
      }
    }).catch(() => {});
  };

  const currentMissions = missions[tab] || [];
  const completedCount = currentMissions.filter(m => m.completed).length;

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
          <Target className="h-5 w-5 text-[#FF6B35]" />
          <h1 className="text-lg font-black text-white">Missions</h1>
        </div>
        <div className="ml-auto text-xs text-[#6B7A90]">
          {completedCount}/{currentMissions.length} completed
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 flex gap-2">
        {(['daily', 'weekly', 'achievements'] as const).map(t => {
          const Icon = TAB_ICONS[t];
          const active = tab === t;
          const count = (missions[t] || []).filter(m => m.completed && !m.claimed).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 relative transition-all"
              style={{
                background: active ? "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.05))" : "rgba(255,255,255,0.03)",
                color: active ? "#FF6B35" : "#6B7A90",
                border: active ? "1px solid rgba(255,107,53,0.3)" : "1px solid rgba(255,255,255,0.05)",
              }}>
              <Icon className="h-3.5 w-3.5" />
              {t === 'daily' ? 'Daily' : t === 'weekly' ? 'Weekly' : 'Achievements'}
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B35] text-white text-[8px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mission List */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="text-center py-20 text-[#4A5A70] text-sm">Loading...</div>
        ) : currentMissions.length === 0 ? (
          <div className="text-center py-20 text-[#4A5A70] text-sm">No missions available</div>
        ) : (
          currentMissions.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-4"
              style={{
                background: m.completed
                  ? m.claimed ? "rgba(52,211,153,0.05)" : "rgba(255,107,53,0.08)"
                  : "rgba(255,255,255,0.02)",
                border: m.completed && !m.claimed
                  ? "1px solid rgba(255,107,53,0.3)"
                  : "1px solid rgba(255,255,255,0.04)",
              }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{m.title}</span>
                    {m.completed && m.claimed && <Check className="h-3.5 w-3.5 text-[#34D399]" />}
                  </div>
                  <span className="text-[10px] text-[#6B7A90]">{m.description}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-[#FFD700] font-bold flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    {m.reward.label}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.progressPct}%` }}
                    className="h-full rounded-full"
                    style={{
                      background: m.completed
                        ? "linear-gradient(90deg, #34D399, #10B981)"
                        : "linear-gradient(90deg, #FF6B35, #E85D2C)",
                    }} />
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: m.completed ? "#34D399" : "#8899AB" }}>
                  {Math.min(m.progress, m.target)}/{m.target}
                </span>
              </div>

              {/* Claim Button */}
              {m.completed && !m.claimed && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => claimReward(m.id)}
                  className="w-full mt-3 py-2 rounded-lg text-xs font-black text-white"
                  style={{
                    background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                    boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
                  }}>
                  Claim Reward
                </motion.button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
