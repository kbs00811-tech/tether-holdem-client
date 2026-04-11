import { formatMoney, getSymbol } from "../utils/currency";
import { useState, useEffect } from "react";
import { Bot, Users, TrendingUp, Shield, Zap, Activity, Eye, Lock, LogOut, Ban, BarChart3, Clock, DollarSign, Settings } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useSocket } from "../hooks/useSocket";
import { useGameStore } from "../stores/gameStore";

const ADMIN_PASSWORD = "tether2026"; // TODO: 실제 환경에서는 서버 인증으로

export default function AdminDashboard() {
  const { send, connected } = useSocket();
  const rooms = useGameStore(s => s.rooms);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [rtpTarget, setRtpTarget] = useState(95);
  const [botLevel, setBotLevel] = useState([3, 8]);
  const [botCount, setBotCount] = useState(3);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'bots' | 'rtp' | 'players' | 'logs'>('overview');
  const [kickPlayerId, setKickPlayerId] = useState("");

  useEffect(() => {
    if (connected && authenticated) {
      send({ type: 'GET_ROOMS' });
      const t = setInterval(() => send({ type: 'GET_ROOMS' }), 5000);
      return () => clearInterval(t);
    }
  }, [connected, authenticated]);

  const totalPlayers = rooms.reduce((s, r) => s + r.playerCount, 0);
  const activeRooms = rooms.filter(r => r.playerCount > 0).length;

  // ═══ Login Gate ═══
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #0F1923, #080E16)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[380px] rounded-2xl overflow-hidden"
          style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center relative">
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(90deg, transparent, #FF6B35, #26A17B, transparent)" }} />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)", boxShadow: "0 8px 25px rgba(255,107,53,0.3)" }}>
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-black text-white mb-1">Admin Panel</h1>
            <p className="text-xs text-[#4A5A70]">TETHER.BET Poker Management</p>
          </div>

          {/* Login Form */}
          <div className="px-8 pb-8">
            <div className="mb-4">
              <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3A4A5A]" />
                <input type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (password === ADMIN_PASSWORD) { setAuthenticated(true); toast.success('Welcome, Admin'); }
                      else { toast.error('Invalid password'); setPassword(''); }
                    }
                  }}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-[#3A4A5A]
                    bg-[#0B1018] border border-[#1A2235] focus:border-[#FF6B35] focus:outline-none" />
              </div>
            </div>
            <button onClick={() => {
              if (password === ADMIN_PASSWORD) { setAuthenticated(true); toast.success('Welcome, Admin'); }
              else { toast.error('Invalid password'); setPassword(''); }
            }}
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)", boxShadow: "0 4px 15px rgba(255,107,53,0.25)" }}>
              Sign In
            </button>
            <div className="text-center mt-4">
              <span className="text-[10px] text-[#3A4A5A]">Authorized access only</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══ Dashboard ═══
  return (
    <div className="min-h-screen" style={{ background: "#0B0E14" }}>

      {/* Top Bar */}
      <div className="px-6 py-3 flex items-center justify-between"
        style={{ background: "rgba(8,12,18,0.95)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">Admin Panel</span>
            <span className="text-[10px] text-[#4A5A70] ml-2">TETHER.BET Poker</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-500'}`} />
          <span className="text-xs text-[#6B7A90]">{connected ? 'Online' : 'Offline'}</span>
          <button onClick={() => setAuthenticated(false)}
            className="px-3 py-1.5 rounded-lg text-xs text-[#6B7A90] hover:text-white transition"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-2 flex gap-1 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'rooms', label: 'Rooms', icon: Eye },
          { key: 'bots', label: 'AI Bots', icon: Bot },
          { key: 'rtp', label: 'RTP', icon: TrendingUp },
          { key: 'players', label: 'Players', icon: Users },
          { key: 'logs', label: 'Logs', icon: Clock },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition
              ${activeTab === tab.key ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-[#4A5A70] hover:text-white'}`}>
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-5">

        {/* ═══ Overview Tab ═══ */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Active Rooms", value: `${activeRooms}/${rooms.length}`, icon: Activity, color: "#26A17B" },
                { label: "Players Online", value: totalPlayers.toString(), icon: Users, color: "#FF6B35" },
                { label: "Current RTP", value: `${rtpTarget}%`, icon: TrendingUp, color: "#FFD700" },
                { label: "Server", value: connected ? "Online" : "Offline", icon: Zap, color: connected ? "#34D399" : "#EF4444" },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4 relative overflow-hidden"
                  style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, transparent, ${stat.color}44, transparent)` }} />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[#4A5A70] uppercase tracking-wider">{stat.label}</span>
                    <stat.icon className="h-4 w-4" style={{ color: stat.color, opacity: 0.5 }} />
                  </div>
                  <div className="font-mono text-xl font-bold text-white">{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl p-5 mb-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#FF6B35]" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "Get RTP Info", action: () => send({ type: 'GET_RTP' } as any), color: "#FFD700" },
                  { label: "Add 3 Easy Bots", action: () => send({ type: 'ADD_BOTS', count: 3 } as any), color: "#34D399" },
                  { label: "Add 3 Hard Bots", action: () => send({ type: 'ADD_BOTS', count: 3 } as any), color: "#EF4444" },
                  { label: "Refresh Rooms", action: () => send({ type: 'GET_ROOMS' }), color: "#60A5FA" },
                ].map((btn, i) => (
                  <button key={i} onClick={() => { btn.action(); toast.success(btn.label); }}
                    className="py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ background: `${btn.color}08`, border: `1px solid ${btn.color}20`, color: btn.color }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ═══ Rooms Tab ═══ */}
        {activeTab === 'rooms' && (
          <div className="rounded-xl overflow-hidden" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <span className="text-sm font-bold text-white">Live Rooms ({rooms.length})</span>
              <button onClick={() => send({ type: 'GET_ROOMS' })} className="text-xs text-[#FF6B35]">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-[#4A5A70] uppercase tracking-wider">
                    <th className="text-left py-2 px-3">Room</th>
                    <th className="text-center py-2">Players</th>
                    <th className="text-center py-2">Blinds</th>
                    <th className="text-center py-2">Buy-in</th>
                    <th className="text-center py-2">Status</th>
                    <th className="text-center py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {rooms.map(room => (
                    <tr key={room.id} className="hover:bg-white/[0.01]">
                      <td className="py-2.5 px-3 text-white font-medium">{room.name}</td>
                      <td className="text-center">
                        <span className={room.playerCount > 0 ? 'text-emerald-400' : 'text-[#3A4A5A]'}>
                          {room.playerCount}/{room.maxPlayers}
                        </span>
                      </td>
                      <td className="text-center font-mono text-[#8899AB]">
                        {getSymbol()}{(room.smallBlind/100).toFixed(2)}/{(room.bigBlind/100).toFixed(2)}
                      </td>
                      <td className="text-center font-mono text-[#6B7A90]">{getSymbol()}{(room.minBuyIn/100).toFixed(0)}</td>
                      <td className="text-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded
                          ${room.phase === 'WAITING' ? 'text-[#4A5A70] bg-white/[0.02]' : 'text-emerald-400 bg-emerald-400/[0.08]'}`}>
                          {room.phase === 'WAITING' ? 'Idle' : 'Active'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button onClick={() => { send({ type: 'JOIN_ROOM', roomId: room.id, buyIn: 0 } as any); toast.success('Monitoring ' + room.name); }}
                          className="text-[9px] text-[#FF6B35] hover:underline mr-2">Monitor</button>
                        <button onClick={() => { send({ type: 'ADD_BOTS', count: 2 } as any); toast.success('Bots added'); }}
                          className="text-[9px] text-[#26A17B] hover:underline">+Bots</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ AI Bots Tab ═══ */}
        {activeTab === 'bots' && (
          <div className="rounded-xl p-5" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#A78BFA]" /> AI Bot Management
            </h3>

            <div className="mb-4">
              <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-2">Bot Count</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 7].map(n => (
                  <button key={n} onClick={() => setBotCount(n)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition
                      ${botCount === n ? 'bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-white/[0.02] text-[#4A5A70] border border-white/[0.04]'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-2">Level Range: {botLevel[0]} ~ {botLevel[1]}</label>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(lv => {
                  const inRange = lv >= botLevel[0]! && lv <= botLevel[1]!;
                  const tier = lv <= 2 ? 'Fish' : lv <= 4 ? 'Weak' : lv <= 6 ? 'Avg' : lv <= 8 ? 'Strong' : 'Elite';
                  const color = lv <= 2 ? '#34D399' : lv <= 4 ? '#60A5FA' : lv <= 6 ? '#FFD700' : lv <= 8 ? '#FF6B35' : '#EF4444';
                  return (
                    <button key={lv} onClick={() => {
                      if (lv < botLevel[0]!) setBotLevel([lv, botLevel[1]!]);
                      else if (lv > botLevel[1]!) setBotLevel([botLevel[0]!, lv]);
                      else setBotLevel([lv, lv]);
                    }}
                      className="py-2 rounded-md text-center transition-all"
                      style={{
                        background: inRange ? `${color}15` : 'rgba(255,255,255,0.02)',
                        border: inRange ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.04)',
                        color: inRange ? color : '#3A4A5A',
                      }}>
                      <div className="text-[10px] font-bold">Lv.{lv}</div>
                      <div className="text-[7px]">{tier}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={() => {
              send({ type: 'ADD_BOTS', count: botCount } as any);
              toast.success(`Deploying ${botCount} AI bots (Lv.${botLevel[0]}-${botLevel[1]})`);
            }}
              className="w-full py-3 rounded-lg text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
              Deploy {botCount} AI Bots
            </button>
          </div>
        )}

        {/* ═══ RTP Tab ═══ */}
        {activeTab === 'rtp' && (
          <div className="rounded-xl p-5" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#FFD700]" /> RTP Control (House Edge)
            </h3>

            <div className="mb-6">
              <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-2">Target RTP (%)</label>
              <div className="flex items-center gap-4">
                <input type="range" min={80} max={99} value={rtpTarget}
                  onChange={e => setRtpTarget(Number(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none bg-[#1A2235]
                    [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FFD700]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer" />
                <span className="font-mono text-2xl font-black text-[#FFD700] w-20 text-right">{rtpTarget}%</span>
              </div>
              <div className="flex justify-between text-[9px] text-[#3A4A5A] mt-1">
                <span>80% (High Edge)</span><span>99% (Low Edge)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-[10px] text-[#4A5A70]">House Edge</div>
                <div className="font-mono text-lg font-bold text-[#FF6B35]">{100 - rtpTarget}%</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="text-[10px] text-[#4A5A70]">Per {getSymbol()}100 wagered</div>
                <div className="font-mono text-lg font-bold text-[#34D399]">{getSymbol()}{100 - rtpTarget} profit</div>
              </div>
            </div>

            <button onClick={() => { send({ type: 'SET_RTP', rtp: rtpTarget } as any); toast.success(`RTP set to ${rtpTarget}%`); }}
              className="w-full py-3 rounded-lg text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FFD700, #E5B800)" }}>
              Apply RTP Setting
            </button>
          </div>
        )}

        {/* ═══ Players Tab ═══ */}
        {activeTab === 'players' && (
          <div className="rounded-xl p-5" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#FF6B35]" /> Player Management
            </h3>

            <div className="mb-4">
              <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1.5">Kick Player by ID</label>
              <div className="flex gap-2">
                <input value={kickPlayerId} onChange={e => setKickPlayerId(e.target.value)}
                  placeholder="Player ID or nickname"
                  className="flex-1 px-3 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white placeholder-[#3A4A5A] focus:border-[#EF4444] focus:outline-none" />
                <button onClick={() => {
                  if (kickPlayerId) {
                    send({ type: 'KICK_PLAYER', targetId: kickPlayerId } as any);
                    toast.success(`Kicked ${kickPlayerId}`);
                    setKickPlayerId('');
                  }
                }}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}>
                  <Ban className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="text-xs text-[#4A5A70] p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="mb-1 font-semibold text-[#6B7A90]">Active Players in Rooms:</div>
              {rooms.filter(r => r.playerCount > 0).map(r => (
                <div key={r.id} className="flex justify-between py-1">
                  <span>{r.name}</span>
                  <span className="text-emerald-400">{r.playerCount} players</span>
                </div>
              ))}
              {rooms.filter(r => r.playerCount > 0).length === 0 && <div className="text-[#3A4A5A]">No players online</div>}
            </div>
          </div>
        )}

        {/* ═══ Logs Tab ═══ */}
        {activeTab === 'logs' && (
          <div className="rounded-xl p-5" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#60A5FA]" /> System Logs
            </h3>
            <div className="text-xs text-[#4A5A70] space-y-2">
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[#34D399]">[INFO]</span> Server started on port 9950
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[#34D399]">[INFO]</span> Database connected: 081.PokerAces
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[#34D399]">[INFO]</span> {rooms.length} rooms created
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[#60A5FA]">[METRIC]</span> {totalPlayers} players online, {activeRooms} active rooms
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <span className="text-[#FFD700]">[RTP]</span> Target: {rtpTarget}% | House Edge: {100-rtpTarget}%
              </div>
            </div>
            <button onClick={() => { send({ type: 'GET_RTP' } as any); toast.success('Fetching RTP data...'); }}
              className="w-full mt-3 py-2 rounded-lg text-xs font-semibold text-[#60A5FA]"
              style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.1)" }}>
              Fetch Live Metrics
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
