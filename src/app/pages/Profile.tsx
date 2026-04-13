import { formatMoney, getSymbol } from "../utils/currency";
import { TrendingUp, TrendingDown, Play, Award, Target, Calendar, BarChart3, Clock, RefreshCw, Search, Cloud, CloudOff } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { EmptyState } from "../components/EmptyState";
import { useNavigate, useSearchParams } from "react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { useStatsStore } from "../stores/statsStore";
import { useSettingsStore, AVATAR_IMAGES } from "../stores/settingsStore";
import {
  getStats, getHandHistory, canUseServerStats,
  type StatsResponse, type HandRecord as ServerHandRecord,
} from "../utils/profileApi";

type Tab = 'stats' | 'history' | 'sessions';
type Period = 'today' | 'week' | 'month' | 'all';

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'stats';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [period, setPeriod] = useState<Period>('week');

  // 서버 / 로컬 모드
  const useServer = canUseServerStats();

  // ─── 서버 데이터 상태 ───
  const [serverStats, setServerStats] = useState<StatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState('');

  const [serverHands, setServerHands] = useState<ServerHandRecord[]>([]);
  const [handsTotal, setHandsTotal] = useState(0);
  const [loadingHands, setLoadingHands] = useState(false);
  const [handsError, setHandsError] = useState('');

  // ─── 필터 상태 ───
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'lose' | 'fold' | 'split'>('all');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const HANDS_PER_PAGE = 50;

  // ─── 로컬 stats ───
  const localStats = useStatsStore();
  const currentAvatar = useSettingsStore(s => s.avatar);
  const loadSettingsFromServer = useSettingsStore(s => s.loadFromServer);

  // 서버에서 stats 로드 (period 변경 시)
  const loadServerStats = useCallback(async () => {
    if (!useServer) return;
    setLoadingStats(true);
    setStatsError('');
    try {
      const r = await getStats(period);
      setServerStats(r);
    } catch (e: any) {
      setStatsError(e.message || 'Failed to load stats');
      console.warn('[Profile] loadServerStats failed:', e);
    } finally {
      setLoadingStats(false);
    }
  }, [period, useServer]);

  // 서버에서 hand history 로드 (필터 변경 시)
  const loadServerHands = useCallback(async () => {
    if (!useServer) return;
    setLoadingHands(true);
    setHandsError('');
    try {
      const r = await getHandHistory({
        limit: HANDS_PER_PAGE,
        offset: page * HANDS_PER_PAGE,
        result: filterResult === 'all' ? undefined : filterResult,
      });
      setServerHands(r.hands || []);
      setHandsTotal(r.total || 0);
    } catch (e: any) {
      setHandsError(e.message || 'Failed to load history');
    } finally {
      setLoadingHands(false);
    }
  }, [filterResult, page, useServer]);

  useEffect(() => { loadServerStats(); }, [loadServerStats]);
  useEffect(() => { if (tab === 'history') loadServerHands(); }, [tab, loadServerHands]);
  useEffect(() => { loadSettingsFromServer(); }, [loadSettingsFromServer]);

  // ─── 통합 stats (서버 우선, 로컬 폴백) ───
  const stats = useMemo(() => {
    if (useServer && serverStats?.stats) {
      const s = serverStats.stats;
      return {
        totalHands: s.totalHands,
        winRate: s.winRate,
        totalProfit: s.totalWin / 100,
        totalLoss: s.totalBet / 100,
        netProfit: s.netProfit / 100,
        biggestWin: s.biggestWin / 100,
        biggestLoss: s.biggestLoss / 100,
        vpip: s.vpip,
        pfr: s.pfr,
        af: s.af,
        streak: s.currentStreak,
        longestStreak: s.longestWinStreak,
      };
    }
    // 로컬 fallback
    return {
      totalHands: localStats.totalHands,
      winRate: localStats.getWinRate(),
      totalProfit: localStats.totalWin / 100,
      totalLoss: localStats.totalBet / 100,
      netProfit: localStats.getNetProfit() / 100,
      biggestWin: localStats.biggestWin / 100,
      biggestLoss: localStats.biggestLoss / 100,
      vpip: localStats.getVPIP(),
      pfr: localStats.getPFR(),
      af: localStats.getAF(),
      streak: localStats.currentStreak,
      longestStreak: localStats.longestWinStreak,
    };
  }, [useServer, serverStats, localStats]);

  const hasPlayedGames = stats.totalHands > 0;

  // ─── hand history 통합 ───
  const handRecords = useMemo(() => {
    if (useServer) {
      return serverHands.map(h => ({
        id: h.id,
        handNumber: h.hand_number,
        timestamp: new Date(h.played_at).getTime(),
        tableName: h.table_name || h.stakes || 'Unknown',
        pot: (h.bet_amount + h.win_amount) * 100,
        myBet: h.bet_amount * 100,
        myWin: h.win_amount * 100,
        won: h.result === 'win' || h.result === 'split',
        result: h.result,
      }));
    }
    return localStats.handRecords.map((h, i) => ({
      id: i,
      handNumber: h.handNumber,
      timestamp: h.timestamp,
      tableName: h.tableName || 'Unknown',
      pot: h.pot,
      myBet: h.myBet,
      myWin: h.myWin,
      won: h.won,
      result: h.result,
    }));
  }, [useServer, serverHands, localStats.handRecords]);

  // 검색 필터
  const filteredHands = useMemo(() => {
    if (!searchText) return handRecords;
    const q = searchText.toLowerCase();
    return handRecords.filter(h =>
      h.tableName?.toLowerCase().includes(q) ||
      String(h.handNumber).includes(q) ||
      h.result?.toLowerCase().includes(q)
    );
  }, [handRecords, searchText]);

  // ─── 프로필 트렌드 데이터 ───
  const profitData = useMemo(() => {
    if (useServer && serverStats?.profitTrend?.length) {
      return serverStats.profitTrend.map(p => ({
        date: p.date?.slice(5) || '',
        profit: Math.round(p.cumProfit / 100),
      }));
    }
    // 로컬 폴백
    if (localStats.handRecords.length === 0) return [];
    const sorted = [...localStats.handRecords].sort((a, b) => a.timestamp - b.timestamp);
    const now = Date.now();
    const cutoff = period === 'week' ? 7 * 86400000 : period === 'month' ? 30 * 86400000 : Infinity;
    const filtered = sorted.filter(h => now - h.timestamp < cutoff);
    let cum = 0;
    return filtered.map(h => {
      cum += (h.myWin - h.myBet) / 100;
      return {
        date: new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: Math.round(cum),
      };
    });
  }, [useServer, serverStats, localStats.handRecords, period]);

  // ─── 세션 그룹핑 ───
  const recentSessions = useMemo(() => {
    if (handRecords.length === 0) return [];
    const sorted = [...handRecords].sort((a, b) => a.timestamp - b.timestamp);
    const sessions: any[] = [];
    let curr: any = null;
    for (const h of sorted) {
      const profit = (h.myWin - h.myBet) / 100;
      if (!curr || curr.table !== h.tableName || (h.timestamp - curr.startTs) > 10 * 60 * 1000) {
        if (curr) sessions.push(curr);
        curr = {
          id: sessions.length,
          date: new Date(h.timestamp).toISOString().slice(0, 10),
          table: h.tableName,
          hands: 1,
          duration: '0m',
          profit,
          startTs: h.timestamp,
        };
      } else {
        curr.hands++;
        curr.profit += profit;
        const mins = Math.max(1, Math.floor((h.timestamp - curr.startTs) / 60000));
        curr.duration = mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
      }
    }
    if (curr) sessions.push(curr);
    return sessions.reverse().slice(0, 20);
  }, [handRecords]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative mx-3 sm:mx-5 mt-3 rounded-2xl overflow-hidden" style={{ height: "clamp(120px, 18vh, 180px)" }}>
        <img src="/banners/hero_vip.png" alt="Profile" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(110deg, rgba(5,8,12,0.97) 0%, rgba(5,8,12,0.85) 40%, rgba(5,8,12,0.3) 70%, transparent 100%)",
        }} />
        <div className="relative z-10 h-full flex items-end px-5 sm:px-8 pb-4">
          <div className="flex items-center gap-4 w-full">
            <img src={AVATAR_IMAGES[currentAvatar] ?? AVATAR_IMAGES[0]}
              alt="avatar" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
              style={{ boxShadow: "0 0 0 3px rgba(255,107,53,0.3)" }} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-[#FF6B35]" />
                <span className="text-[10px] uppercase tracking-widest text-[#FF6B35] font-bold">My Stats</span>
                {useServer ? (
                  <span className="flex items-center gap-1 text-[9px] text-[#34D399]">
                    <Cloud className="h-3 w-3" /> Cloud Sync
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] text-[#6B7A90]">
                    <CloudOff className="h-3 w-3" /> Local Only
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Player Profile</h1>
              <p className="text-[10px] text-[#6B7A90] mt-0.5">
                {stats.totalHands.toLocaleString()} hands played • Streak: {stats.streak >= 0 ? `+${stats.streak}` : stats.streak}
              </p>
            </div>
            <button onClick={() => loadServerStats()}
              className="p-2 rounded-lg text-[#4A5A70] hover:text-[#FF6B35] transition-colors"
              title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 sm:px-5 py-5">
        {/* Tab nav */}
        <div className="flex gap-1 mb-5 border-b border-white/5">
          {([
            { id: 'stats', label: 'Statistics', icon: BarChart3 },
            { id: 'history', label: 'Hand History', icon: Clock },
            { id: 'sessions', label: 'Sessions', icon: Calendar },
          ] as const).map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-colors"
              style={{
                color: tab === t.id ? '#FF6B35' : '#6B7A90',
                borderBottom: `2px solid ${tab === t.id ? '#FF6B35' : 'transparent'}`,
              }}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {statsError && (
          <div className="mb-4 px-3 py-2 rounded-lg text-[11px] text-[#EF4444]"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            Server error: {statsError}
          </div>
        )}

        {!hasPlayedGames && !loadingStats ? (
          <EmptyState icon={Play} title="No games played yet"
            description="Start your first game and build your stats!"
            actionLabel="Go to Lobby" onAction={() => navigate("/")} />
        ) : (
          <>
            {tab === 'stats' && (
              <>
                {/* Period filter */}
                <div className="flex gap-1 mb-4">
                  {(['today', 'week', 'month', 'all'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                      style={{
                        background: period === p ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.02)',
                        color: period === p ? '#FF6B35' : '#4A5A70',
                        border: `1px solid ${period === p ? 'rgba(255,107,53,0.25)' : 'rgba(255,255,255,0.04)'}`,
                      }}>
                      {p === 'today' ? 'Today' : p === 'week' ? '7 Days' : p === 'month' ? '30 Days' : 'All Time'}
                    </button>
                  ))}
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "Total Hands", value: stats.totalHands.toLocaleString(), icon: Play, color: "#FF6B35" },
                    { label: "Win Rate", value: `${stats.winRate}%`, icon: Target, color: "#34D399" },
                    { label: "Net Profit", value: `${stats.netProfit >= 0 ? "+" : ""}${getSymbol()}${Math.round(stats.netProfit).toLocaleString()}`, icon: stats.netProfit >= 0 ? TrendingUp : TrendingDown, color: stats.netProfit >= 0 ? "#34D399" : "#EF4444" },
                    { label: "Biggest Win", value: `${getSymbol()}${Math.round(stats.biggestWin).toLocaleString()}`, icon: Award, color: "#FFD700" },
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

                {/* Advanced Stats */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    { label: "VPIP", value: `${stats.vpip}%`, desc: "Voluntarily Put $ In Pot" },
                    { label: "PFR", value: `${stats.pfr}%`, desc: "Pre-Flop Raise" },
                    { label: "AF", value: stats.af.toFixed(1), desc: "Aggression Factor" },
                    { label: "Best Streak", value: `${stats.longestStreak}W`, desc: "Longest Win Streak" },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-3 rounded-lg" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div className="text-[9px] text-[#3A4A5A] uppercase tracking-wider">{item.label}</div>
                      <div className="font-mono text-base font-bold text-white my-0.5">{item.value}</div>
                      <div className="text-[8px] text-[#3A4A5A]">{item.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Profit Chart */}
                <div className="rounded-xl p-5 mb-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <h3 className="text-sm font-bold text-white mb-4">Profit Trend ({period})</h3>
                  {profitData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={profitData}>
                        <defs>
                          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stats.netProfit >= 0 ? "#34D399" : "#EF4444"} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={stats.netProfit >= 0 ? "#34D399" : "#EF4444"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#2A3650" tick={{ fill: "#4A5A70", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#2A3650" tick={{ fill: "#4A5A70", fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${getSymbol()}${Math.round(v / 1000)}k`} />
                        <Tooltip contentStyle={{
                          background: "#1A2235", border: "1px solid #2A3650", borderRadius: 8,
                          fontSize: 11, color: "#E2E8F0",
                        }}
                          formatter={(value: number) => [`${getSymbol()}${value.toLocaleString()}`, "Profit"]} />
                        <Area type="monotone" dataKey="profit"
                          stroke={stats.netProfit >= 0 ? "#34D399" : "#EF4444"} strokeWidth={2.5}
                          fill="url(#profitGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-xs text-[#4A5A70]">
                      No data for this period
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === 'history' && (
              <div className="rounded-xl overflow-hidden" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                {/* Filter Bar */}
                <div className="px-4 py-3 flex flex-wrap items-center gap-2" style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-[11px] text-[#4A5A70] uppercase tracking-wider font-semibold mr-auto">
                    Hand History ({useServer ? handsTotal : handRecords.length} total)
                  </span>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#4A5A70]" />
                    <input type="text"
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                      placeholder="Search table..."
                      className="w-32 sm:w-40 pl-7 pr-2 py-1.5 rounded-md text-[11px] text-white bg-[#0a0b10] border border-white/5 focus:border-[#FF6B35]/50 focus:outline-none" />
                  </div>

                  {/* Result filter */}
                  <div className="flex items-center gap-0.5 rounded-md p-0.5"
                    style={{ background: "rgba(0,0,0,0.3)" }}>
                    {([
                      { id: 'all', label: 'All' },
                      { id: 'win', label: 'Win' },
                      { id: 'lose', label: 'Lose' },
                      { id: 'fold', label: 'Fold' },
                      { id: 'split', label: 'Split' },
                    ] as const).map(r => (
                      <button key={r.id}
                        onClick={() => { setFilterResult(r.id); setPage(0); }}
                        className="px-2 py-1 rounded text-[10px] font-bold transition-colors"
                        style={{
                          background: filterResult === r.id ? 'rgba(255,107,53,0.2)' : 'transparent',
                          color: filterResult === r.id ? '#FF6B35' : '#6B7A90',
                        }}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingHands && (
                  <div className="text-center py-8 text-xs text-[#4A5A70]">Loading...</div>
                )}
                {handsError && (
                  <div className="text-center py-4 text-xs text-[#EF4444]">{handsError}</div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[720px]">
                    <thead>
                      <tr className="text-[#4A5A70] uppercase" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <th className="text-left p-2.5">Time</th>
                        <th className="text-left p-2.5">Table</th>
                        <th className="text-center p-2.5">#Hand</th>
                        <th className="text-center p-2.5">Result</th>
                        <th className="text-right p-2.5">My Bet</th>
                        <th className="text-right p-2.5">My Win</th>
                        <th className="text-right p-2.5">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHands.length === 0 && !loadingHands ? (
                        <tr><td colSpan={7} className="text-center py-8 text-[#4A5A70]">No hands match filter</td></tr>
                      ) : filteredHands.map(h => {
                        const net = (h.myWin - h.myBet) / 100;
                        const time = new Date(h.timestamp).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        });
                        return (
                          <tr key={h.id + '-' + h.handNumber} className="border-t border-white/[0.03] hover:bg-white/[0.02]">
                            <td className="p-2.5 text-[#6B7A90]">{time}</td>
                            <td className="p-2.5 text-white truncate max-w-[180px]">{h.tableName || '-'}</td>
                            <td className="text-center p-2.5 text-[#6B7A90]">#{h.handNumber}</td>
                            <td className="text-center p-2.5">
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold"
                                style={{
                                  background:
                                    h.result === 'win' ? 'rgba(52,211,153,0.15)' :
                                    h.result === 'split' ? 'rgba(240,185,11,0.15)' :
                                    h.result === 'fold' ? 'rgba(107,122,144,0.15)' : 'rgba(239,68,68,0.15)',
                                  color:
                                    h.result === 'win' ? '#34D399' :
                                    h.result === 'split' ? '#F0B90B' :
                                    h.result === 'fold' ? '#6B7A90' : '#EF4444',
                                }}>
                                {h.result.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-right p-2.5 text-[#6B7A90] font-mono">{getSymbol()}{formatMoney(h.myBet / 100)}</td>
                            <td className="text-right p-2.5 text-[#34D399] font-mono">{h.myWin > 0 ? `${getSymbol()}${formatMoney(h.myWin / 100)}` : '-'}</td>
                            <td className={`text-right p-2.5 font-mono font-bold ${net >= 0 ? 'text-[#34D399]' : 'text-[#EF4444]'}`}>
                              {net >= 0 ? '+' : ''}{getSymbol()}{formatMoney(Math.abs(net))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {useServer && handsTotal > HANDS_PER_PAGE && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                    <span className="text-[10px] text-[#4A5A70]">
                      Showing {page * HANDS_PER_PAGE + 1}-{Math.min((page + 1) * HANDS_PER_PAGE, handsTotal)} of {handsTotal}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1 rounded text-[10px] font-bold text-[#FF6B35] disabled:opacity-30"
                        style={{ background: "rgba(255,107,53,0.08)" }}>
                        Prev
                      </button>
                      <button onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * HANDS_PER_PAGE >= handsTotal}
                        className="px-3 py-1 rounded text-[10px] font-bold text-[#FF6B35] disabled:opacity-30"
                        style={{ background: "rgba(255,107,53,0.08)" }}>
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'sessions' && (
              <div className="rounded-xl overflow-hidden" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-[11px] text-[#4A5A70] uppercase tracking-wider font-semibold">Recent Sessions</span>
                  <span className="text-[10px] text-[#3A4A5A]">{recentSessions.length} sessions</span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {recentSessions.length === 0 ? (
                    <div className="text-center py-12 text-xs text-[#4A5A70]">No sessions yet</div>
                  ) : recentSessions.map((session, i) => (
                    <motion.div key={session.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.01] transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
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
                        {session.profit >= 0 ? "+" : ""}{getSymbol()}{formatMoney(Math.abs(Math.round(session.profit)))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
