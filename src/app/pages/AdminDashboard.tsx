import { useState, useEffect } from "react";
import { Bot, Settings, Users, TrendingUp, Shield, Zap, Activity, DollarSign, AlertTriangle, Eye } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useSocket } from "../hooks/useSocket";
import { useGameStore } from "../stores/gameStore";

export default function AdminDashboard() {
  const { send, connected } = useSocket();
  const rooms = useGameStore(s => s.rooms);
  const [rtpTarget, setRtpTarget] = useState(95);
  const [botLevel, setBotLevel] = useState([3, 8]);
  const [botCount, setBotCount] = useState(3);

  useEffect(() => {
    if (connected) send({ type: 'GET_ROOMS' });
  }, [connected]);

  const totalPlayers = rooms.reduce((s, r) => s + r.playerCount, 0);
  const activeRooms = rooms.filter(r => r.playerCount > 0).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mx-3 sm:mx-5 mt-3 px-6 py-4 rounded-xl"
        style={{ background: "linear-gradient(135deg, #0F1923, #162033)", border: "1px solid rgba(255,107,53,0.1)" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, #FF6B35, #26A17B, transparent)" }} />
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#FF6B35]" />
          <div>
            <h1 className="text-lg font-black text-white">Admin Dashboard</h1>
            <span className="text-[11px] text-[#4A5A70]">TETHER.BET Poker Management</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-500'}`} />
            <span className="text-xs text-[#6B7A90]">{connected ? 'Server Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 sm:px-5 py-5">

        {/* ═══ Stats Overview ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Active Rooms", value: `${activeRooms}/${rooms.length}`, icon: Activity, color: "#26A17B" },
            { label: "Players Online", value: totalPlayers.toString(), icon: Users, color: "#FF6B35" },
            { label: "Current RTP", value: `${rtpTarget}%`, icon: TrendingUp, color: "#FFD700" },
            { label: "AI Bots Active", value: "-", icon: Bot, color: "#A78BFA" },
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

        <div className="grid md:grid-cols-2 gap-4">

          {/* ═══ RTP Control ═══ */}
          <div className="rounded-xl p-5" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[#FFD700]" />
              <h3 className="text-sm font-bold text-white">RTP Control (House Edge)</h3>
            </div>

            <div className="mb-4">
              <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-2">Target RTP (%)</label>
              <div className="flex items-center gap-3">
                <input type="range" min={80} max={99} value={rtpTarget}
                  onChange={e => setRtpTarget(Number(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none bg-[#1A2235]
                    [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FFD700]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer" />
                <span className="font-mono text-lg font-black text-[#FFD700] w-16 text-right">{rtpTarget}%</span>
              </div>
              <div className="flex justify-between text-[9px] text-[#3A4A5A] mt-1">
                <span>80% (High Edge)</span>
                <span>99% (Low Edge)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="text-[10px] text-[#4A5A70] mb-1">House Edge: <span className="text-white font-mono font-bold">{100 - rtpTarget}%</span></div>
              <div className="text-[10px] text-[#4A5A70]">Every ₮100 wagered → ₮{100 - rtpTarget} platform revenue</div>
            </div>

            <button onClick={() => { send({ type: 'SET_RTP', rtp: rtpTarget } as any); toast.success(`RTP set to ${rtpTarget}%`); }}
              className="w-full py-2.5 rounded-lg text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
              Apply RTP Setting
            </button>
          </div>

          {/* ═══ AI Bot Management ═══ */}
          <div className="rounded-xl p-5" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-4 w-4 text-[#A78BFA]" />
              <h3 className="text-sm font-bold text-white">AI Bot Management</h3>
            </div>

            <div className="mb-3">
              <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-2">Bot Count</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 7].map(n => (
                  <button key={n} onClick={() => setBotCount(n)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
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
              toast.success(`Adding ${botCount} AI bots (Lv.${botLevel[0]}-${botLevel[1]})`);
            }}
              className="w-full py-2.5 rounded-lg text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
              Deploy {botCount} AI Bots
            </button>
          </div>

          {/* ═══ Room Status ═══ */}
          <div className="rounded-xl p-5 md:col-span-2" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-[#26A17B]" />
              <h3 className="text-sm font-bold text-white">Live Rooms ({rooms.length})</h3>
              <button onClick={() => send({ type: 'GET_ROOMS' })}
                className="ml-auto text-[10px] text-[#4A5A70] hover:text-white">Refresh</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-[#4A5A70] uppercase tracking-wider">
                    <th className="text-left py-2 px-2">Room</th>
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
                      <td className="py-2.5 px-2 text-white font-medium">{room.name}</td>
                      <td className="text-center">
                        <span className={room.playerCount > 0 ? 'text-emerald-400' : 'text-[#3A4A5A]'}>
                          {room.playerCount}/{room.maxPlayers}
                        </span>
                      </td>
                      <td className="text-center font-mono text-[#8899AB]">
                        ₮{(room.smallBlind/100).toFixed(2)}/{(room.bigBlind/100).toFixed(2)}
                      </td>
                      <td className="text-center font-mono text-[#6B7A90]">₮{(room.minBuyIn/100).toFixed(0)}</td>
                      <td className="text-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded
                          ${room.phase === 'WAITING' ? 'text-[#4A5A70] bg-white/[0.02]' : 'text-emerald-400 bg-emerald-400/[0.08]'}`}>
                          {room.phase === 'WAITING' ? 'Idle' : 'Active'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button onClick={() => { send({ type: 'JOIN_ROOM', roomId: room.id, buyIn: 0 } as any); toast.success('Monitoring ' + room.name); }}
                          className="text-[9px] text-[#FF6B35] hover:underline">Monitor</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ Quick Actions ═══ */}
          <div className="rounded-xl p-5 md:col-span-2" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-[#FF6B35]" />
              <h3 className="text-sm font-bold text-white">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: "Get RTP Info", action: () => send({ type: 'GET_RTP' } as any), color: "#FFD700", icon: TrendingUp },
                { label: "Add 3 Easy Bots", action: () => send({ type: 'ADD_BOTS', count: 3 } as any), color: "#34D399", icon: Bot },
                { label: "Add 3 Hard Bots", action: () => send({ type: 'ADD_BOTS', count: 3 } as any), color: "#EF4444", icon: Bot },
                { label: "Refresh Rooms", action: () => send({ type: 'GET_ROOMS' }), color: "#60A5FA", icon: Activity },
              ].map((btn, i) => (
                <button key={i} onClick={() => { btn.action(); toast.success(btn.label); }}
                  className="py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ background: `${btn.color}08`, border: `1px solid ${btn.color}20`, color: btn.color }}>
                  <btn.icon className="h-3.5 w-3.5" />
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
