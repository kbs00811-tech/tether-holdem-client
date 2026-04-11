import { formatMoney, getSymbol } from "../utils/currency";
import { TrendingUp, TrendingDown, Play, Award, Target, Calendar, Trophy, Flame, BarChart3, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { EmptyState } from "../components/EmptyState";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";

export default function Profile() {
  const navigate = useNavigate();
  const { send, connected } = useSocket();
  const [hasPlayedGames] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");

  // 서버에서 통계 요청
  useEffect(() => {
    if (connected) send({ type: 'GET_MY_STATS' });
  }, [connected, send]);

  const stats = {
    totalHands: 12458, winRate: 54.2, totalProfit: 8450.75,
    totalLoss: 3240.50, netProfit: 5210.25, avgPot: 450.30,
    biggestWin: 2840.00, biggestLoss: 1560.00,
    vpip: 28.4, pfr: 21.6, af: 3.2, streak: 5,
  };

  const recentSessions = [
    { id: 1, date: "2026-04-10", table: "High Rollers", hands: 124, duration: "2h 35m", profit: 1240.50 },
    { id: 2, date: "2026-04-09", table: "Medium Stakes", hands: 89, duration: "1h 45m", profit: -320.00 },
    { id: 3, date: "2026-04-08", table: "Low Stakes", hands: 156, duration: "3h 12m", profit: 680.25 },
    { id: 4, date: "2026-04-07", table: "VIP Room", hands: 67, duration: "1h 28m", profit: 2840.00 },
    { id: 5, date: "2026-04-06", table: "Medium Stakes", hands: 98, duration: "2h 05m", profit: -450.75 },
    { id: 6, date: "2026-04-05", table: "6-Max 1/2", hands: 210, duration: "4h 10m", profit: 920.00 },
  ];

  const profitData = [
    { date: "Apr 01", profit: 450 }, { date: "Apr 02", profit: 1200 },
    { date: "Apr 03", profit: 800 }, { date: "Apr 04", profit: 1500 },
    { date: "Apr 05", profit: 1050 }, { date: "Apr 06", profit: 3890 },
    { date: "Apr 07", profit: 4570 }, { date: "Apr 08", profit: 4250 },
    { date: "Apr 09", profit: 5490 }, { date: "Apr 10", profit: 5210 },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative mx-3 sm:mx-5 mt-3 rounded-2xl overflow-hidden" style={{ height: "clamp(120px, 18vh, 180px)" }}>
        <img src="/src/assets/banners/hero_vip.png" alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(110deg, rgba(5,8,12,0.97) 0%, rgba(5,8,12,0.85) 40%, rgba(5,8,12,0.3) 70%, transparent 100%)",
        }} />
        <div className="relative z-10 h-full flex flex-col justify-end px-5 sm:px-8 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-[#FF6B35]" />
            <span className="text-[10px] uppercase tracking-widest text-[#FF6B35] font-bold">My Stats</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Player Profile</h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 sm:px-5 py-5">
        {!hasPlayedGames ? (
          <EmptyState icon={Play} title="No games played yet"
            description="Start your first game and build your stats!"
            actionLabel="Go to Lobby" onAction={() => navigate("/")} />
        ) : (
          <>
            {/* ═══ Key Stats Grid ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Hands", value: stats.totalHands.toLocaleString(), icon: Play, color: "#FF6B35" },
                { label: "Win Rate", value: `${stats.winRate}%`, icon: Target, color: "#34D399" },
                { label: "Net Profit", value: `${stats.netProfit >= 0 ? "+" : ""}${getSymbol()}${stats.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: stats.netProfit >= 0 ? TrendingUp : TrendingDown, color: stats.netProfit >= 0 ? "#34D399" : "#EF4444" },
                { label: "Biggest Win", value: `${getSymbol()}${stats.biggestWin.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: Award, color: "#FFD700" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative rounded-xl p-4 overflow-hidden"
                  style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${item.color}44, transparent)` }} />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[#4A5A70] uppercase tracking-wider">{item.label}</span>
                    <item.icon className="h-3.5 w-3.5" style={{ color: item.color, opacity: 0.5 }} />
                  </div>
                  <div className="font-mono text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
                </motion.div>
              ))}
            </div>

            {/* ═══ Advanced Stats ═══ */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { label: "VPIP", value: `${stats.vpip}%`, desc: "Voluntarily Put $ In Pot" },
                { label: "PFR", value: `${stats.pfr}%`, desc: "Pre-Flop Raise" },
                { label: "AF", value: stats.af.toFixed(1), desc: "Aggression Factor" },
                { label: "Streak", value: `${stats.streak}W`, desc: "Current Win Streak" },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 rounded-lg" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="text-[9px] text-[#3A4A5A] uppercase tracking-wider">{item.label}</div>
                  <div className="font-mono text-base font-bold text-white my-0.5">{item.value}</div>
                  <div className="text-[8px] text-[#3A4A5A]">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* ═══ Profit Chart ═══ */}
            <div className="rounded-xl p-5 mb-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Profit Trend</h3>
                <div className="flex gap-1">
                  {(["week", "month", "all"] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition
                        ${period === p ? "bg-[#FF6B35]/10 text-[#FF6B35]" : "text-[#4A5A70] hover:text-white"}`}>
                      {p === "week" ? "7D" : p === "month" ? "30D" : "All"}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={profitData}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#2A3650" tick={{ fill: "#4A5A70", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#2A3650" tick={{ fill: "#4A5A70", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${getSymbol()}${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{
                    background: "#1A2235", border: "1px solid #2A3650", borderRadius: 8,
                    fontSize: 11, color: "#E2E8F0", boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
                  }}
                    formatter={(value: number) => [`${getSymbol()}${value.toLocaleString()}`, "Profit"]}
                    labelStyle={{ color: "#6B7A90" }} />
                  <Area type="monotone" dataKey="profit" stroke="#34D399" strokeWidth={2.5}
                    fill="url(#profitGrad)" dot={{ fill: "#34D399", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#34D399", stroke: "#0F1520", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ═══ Sessions ═══ */}
            <div className="rounded-xl overflow-hidden" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[11px] text-[#4A5A70] uppercase tracking-wider font-semibold">Recent Sessions</span>
                <span className="text-[10px] text-[#3A4A5A]">{recentSessions.length} sessions</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {recentSessions.map((session, i) => (
                  <motion.div key={session.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.01] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex flex-col items-center justify-center"
                        style={{ background: session.profit >= 0 ? "rgba(52,211,153,0.06)" : "rgba(239,68,68,0.06)" }}>
                        <Calendar className="h-3 w-3" style={{ color: session.profit >= 0 ? "#34D399" : "#EF4444" }} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">{session.table}</div>
                        <div className="flex items-center gap-2 text-[10px] text-[#4A5A70]">
                          <span>{session.date}</span>
                          <span>·</span>
                          <span>{session.hands} hands</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{session.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold"
                      style={{ color: session.profit >= 0 ? "#34D399" : "#EF4444" }}>
                      {session.profit >= 0 ? "+" : ""}{getSymbol()}{Math.abs(session.profit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
