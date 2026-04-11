import { formatMoney } from "../utils/currency";
import { Link, useNavigate } from "react-router";
import { Users, Filter, Plus, Trophy, Activity, Crown, Flame, Zap, Star, Clock, DollarSign, Play } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BuyInModal } from "../components/BuyInModal";
import { CreateRoomModal, RoomConfig } from "../components/CreateRoomModal";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { motion } from "motion/react";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";

interface PokerRoom {
  id: string;
  name: string;
  smallBlind: number;
  bigBlind: number;
  currentPlayers: number;
  maxPlayers: number;
  minBuyIn: number;
  maxBuyIn: number;
  status: "waiting" | "playing" | "starting";
  variant: string;
}

const mockRooms: PokerRoom[] = [
  { id: "1", name: "Beginner", smallBlind: 500, bigBlind: 1000, currentPlayers: 4, maxPlayers: 8, minBuyIn: 50000, maxBuyIn: 200000, status: "playing", variant: "NL" },
  { id: "2", name: "Standard", smallBlind: 1000, bigBlind: 2000, currentPlayers: 7, maxPlayers: 8, minBuyIn: 100000, maxBuyIn: 400000, status: "playing", variant: "NL" },
  { id: "3", name: "Semi-Pro", smallBlind: 5000, bigBlind: 10000, currentPlayers: 2, maxPlayers: 6, minBuyIn: 500000, maxBuyIn: 2000000, status: "waiting", variant: "NL" },
  { id: "4", name: "High Roller", smallBlind: 25000, bigBlind: 50000, currentPlayers: 5, maxPlayers: 6, minBuyIn: 2500000, maxBuyIn: 10000000, status: "playing", variant: "NL" },
  { id: "5", name: "VIP", smallBlind: 50000, bigBlind: 100000, currentPlayers: 1, maxPlayers: 8, minBuyIn: 5000000, maxBuyIn: 20000000, status: "waiting", variant: "NL" },
  { id: "6", name: "Heads-Up", smallBlind: 5000, bigBlind: 10000, currentPlayers: 0, maxPlayers: 2, minBuyIn: 500000, maxBuyIn: 2000000, status: "waiting", variant: "HU" },
];

const holdemCategories = [
  { icon: Flame, label: "All", color: "#FF6B35", tables: 48, active: true },
  { icon: DollarSign, label: "Beginner", color: "#34D399", tables: 12 },
  { icon: Zap, label: "Standard", color: "#60A5FA", tables: 15 },
  { icon: Crown, label: "High Roller", color: "#E5B800", tables: 6 },
  { icon: Users, label: "Heads-Up", color: "#22D3EE", tables: 8 },
  { icon: Trophy, label: "Tournament", color: "#A78BFA", tables: 10 },
];

export default function Lobby() {
  const navigate = useNavigate();
  const { send, connected } = useSocket();
  const serverRooms = useGameStore(s => s.rooms);

  const [selectedRoom, setSelectedRoom] = useState<PokerRoom | null>(null);
  const [showBuyIn, setShowBuyIn] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [activeCategory, setActiveCategory] = useState("No Limit");
  const [onlineCount, setOnlineCount] = useState(12847);
  const currentBalance = 12450.5;

  // 서버에서 방 목록 가져오기 (5초마다 갱신)
  useEffect(() => {
    if (connected) {
      send({ type: 'GET_ROOMS' });
      const t = setInterval(() => send({ type: 'GET_ROOMS' }), 5000);
      return () => clearInterval(t);
    }
  }, [connected, send]);

  // 서버 방 목록 → 로컬 형식 변환 (서버 연결 시 서버 데이터 사용, 아니면 mock)
  const rooms: PokerRoom[] = serverRooms.length > 0
    ? serverRooms.map(r => ({
        id: r.id,
        name: r.name,
        smallBlind: r.smallBlind / 100,
        bigBlind: r.bigBlind / 100,
        currentPlayers: r.playerCount,
        maxPlayers: r.maxPlayers,
        minBuyIn: r.minBuyIn / 100,
        maxBuyIn: (r.minBuyIn * 2) / 100, // 서버에서 maxBuyIn 추가 필요
        status: r.phase === "WAITING" ? "waiting" as const : "playing" as const,
        variant: "NL",
      }))
    : mockRooms;

  // Simulate live counter
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount(c => c + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const handleJoinTable = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) { setSelectedRoom(room); setShowBuyIn(true); }
  };

  const handleBuyIn = useCallback((amount: number) => {
    if (selectedRoom) {
      // 바이인 후 테이블 페이지로 이동
      navigate(`/table/${selectedRoom.id}`);
      toast.success(`${formatMoney(amount)} 바이인 완료`);
    }
  }, [selectedRoom, navigate]);

  const handleCreateRoom = (config: RoomConfig) => {
    const newRoom: PokerRoom = {
      id: (rooms.length + 1).toString(), name: config.name, smallBlind: config.smallBlind,
      bigBlind: config.bigBlind, currentPlayers: 0, maxPlayers: config.maxPlayers,
      minBuyIn: config.minBuyIn, maxBuyIn: config.maxBuyIn, status: "waiting", variant: "NL",
    };
    setRooms([newRoom, ...rooms]);
    toast.success(`"${config.name}" 생성 완료`);
  };

  return (
    <div className="min-h-screen">

      {/* ═══════ CINEMATIC HERO ═══════ */}
      <section className="relative mx-3 sm:mx-5 mt-3 rounded-2xl overflow-hidden"
        style={{ height: "clamp(200px, 30vh, 300px)" }}>
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="/src/assets/banners/hero_main.png"
            alt="TETHER.BET Holdem" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0"
            style={{
              background: `
                linear-gradient(110deg, rgba(5,8,12,0.97) 0%, rgba(5,8,12,0.8) 35%, rgba(5,8,12,0.4) 60%, transparent 100%),
                linear-gradient(0deg, rgba(5,8,12,0.6) 0%, transparent 40%)
              `,
            }} />
        </div>

        {/* Accent light leak */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(255,107,53,0.06), transparent 60%)" }} />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-end px-5 sm:px-8 pb-5">
          {/* Live indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.12)" }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#34D399]"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }} />
              <span className="text-[9px] text-[#34D399] font-bold uppercase tracking-wider">Live</span>
            </div>
            <span className="text-[10px] text-[#4A5A70] font-mono">
              <motion.span key={onlineCount}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}>
                {onlineCount.toLocaleString()}
              </motion.span>
              {" "}players online
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white mb-1"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            Texas Hold'em
          </h1>
          <p className="text-[#6B7A90] text-xs sm:text-sm mb-4 max-w-sm">
            USDT 기반 프리미엄 포커 — 지금 바로 시작하세요
          </p>

          <div className="flex items-center gap-2">
            <Link to="/table/1">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white inline-flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                  boxShadow: "0 4px 20px rgba(255,107,53,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}>
                <Play className="h-3.5 w-3.5" fill="white" />
                퀵 플레이
              </motion.button>
            </Link>
            <Link to="/tournaments">
              <button className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#8899AB] inline-flex items-center gap-1.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                }}>
                <Trophy className="h-3.5 w-3.5" />
                토너먼트
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ STATS TICKER ═══════ */}
      <section className="mx-3 sm:mx-5 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { label: "ONLINE", value: onlineCount.toLocaleString(), icon: Users, color: "#34D399" },
            { label: "TABLES", value: "1,284", icon: Activity, color: "#A78BFA" },
            { label: "TOP POT", value: "$847K", icon: Trophy, color: "#E5B800" },
            { label: "HANDS/H", value: "4,869", icon: Zap, color: "#22D3EE" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.02)",
                backdropFilter: "blur(4px)",
              }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}08` }}>
                <s.icon className="h-3 w-3" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[7px] text-[#3D4F65] font-bold uppercase tracking-[0.15em]">{s.label}</div>
                <div className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FILTER TABS — Clean & Large ═══════ */}
      <section className="mx-3 sm:mx-5 mt-5">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {holdemCategories.map((cat) => {
            const isActive = activeCategory === cat.label;
            return (
              <button key={cat.label} onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
                  ${isActive
                    ? 'text-white'
                    : 'text-[#5A6A80] hover:text-white'
                  }`}
                style={{
                  background: isActive ? `${cat.color}15` : "rgba(255,255,255,0.02)",
                  border: isActive ? `1px solid ${cat.color}30` : "1px solid rgba(255,255,255,0.04)",
                  color: isActive ? cat.color : undefined,
                }}>
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════ ROOM LIST ═══════ */}
      <section className="mx-3 sm:mx-5 mt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Hold'em Tables</h2>
            <p className="text-xs text-[#4A5A70] mt-0.5">{rooms.length} tables available</p>
          </div>
          <motion.button whileTap={{ scale: 0.94 }}
            onClick={() => setShowCreateRoom(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
            style={{
              color: "#FF6B35",
              background: "rgba(255,107,53,0.08)",
              border: "1px solid rgba(255,107,53,0.15)",
            }}>
            <Plus className="h-3.5 w-3.5" /> Create Room
          </motion.button>
        </div>

        {/* Room Cards — large, readable, KRW */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const isFull = room.currentPlayers >= room.maxPlayers;
            const fill = room.currentPlayers / room.maxPlayers;
            return (
              <motion.div key={room.id}
                whileHover={{ y: -3, scale: 1.01 }}
                className="rounded-xl p-5 transition-all cursor-pointer group"
                style={{
                  background: "#141820",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
                onClick={() => !isFull && handleJoinTable(room.id)}>

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-white">{room.name}</h3>
                      {room.status === "playing" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-emerald-400"
                          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.15)" }}>
                          ● LIVE
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[#8899AB] font-mono">
                      Blinds {formatMoney(room.smallBlind)}/{formatMoney(room.bigBlind)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#4A5A70] mb-0.5">Buy-in</div>
                    <div className="text-xs font-mono font-bold text-[#FF6B35]">
                      {formatMoney(room.minBuyIn)}
                    </div>
                  </div>
                </div>

                {/* Player count + seats */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1">
                      {Array.from({ length: room.maxPlayers }).map((_, i) => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: i < room.currentPlayers
                            ? (fill > 0.8 ? "#EF4444" : "#26A17B")
                            : "rgba(255,255,255,0.06)",
                          boxShadow: i < room.currentPlayers ? `0 0 4px ${fill > 0.8 ? "rgba(239,68,68,0.3)" : "rgba(38,161,123,0.2)"}` : "none",
                        }} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold"
                      style={{ color: fill > 0.8 ? "#EF4444" : "#6B7A90" }}>
                      {room.currentPlayers}/{room.maxPlayers}
                    </span>
                  </div>

                  {/* Join button */}
                  <span className="text-xs font-bold px-3 py-1 rounded-lg transition-all
                    opacity-0 group-hover:opacity-100"
                    style={{ background: "rgba(255,107,53,0.1)", color: "#FF6B35", border: "1px solid rgba(255,107,53,0.2)" }}>
                    {isFull ? "Full" : "Join"}
                  </span>
                </div>

                {/* Fill bar */}
                <div className="w-full h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${fill * 100}%` }}
                    style={{
                      background: fill > 0.8
                        ? "linear-gradient(90deg, #EF4444, #DC2626)"
                        : "linear-gradient(90deg, #26A17B, #1A8B64)",
                    }} />
                </div>

                {/* Join button (bottom of card) */}
                <motion.button whileTap={{ scale: 0.96 }}
                  disabled={isFull}
                  className="w-full py-2.5 rounded-lg text-xs font-bold transition-all mt-3"
                  style={{
                    background: isFull ? "rgba(255,255,255,0.02)" : "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,53,0.05))",
                    border: `1px solid ${isFull ? "rgba(255,255,255,0.03)" : "rgba(255,107,53,0.15)"}`,
                    color: isFull ? "#2A3A50" : "#FF6B35",
                    cursor: isFull ? "not-allowed" : "pointer",
                    opacity: isFull ? 0.5 : 1,
                  }}
                  onClick={(e) => { e.stopPropagation(); !isFull && handleJoinTable(room.id); }}>
                  {isFull ? "만석" : "입장하기"}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* ═══════ TOURNAMENT CTA ═══════ */}
        <div className="mt-8 rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(229,184,0,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 50%, rgba(255,107,53,0.03) 0%, transparent 50%),
              rgba(255,255,255,0.01)
            `,
            border: "1px solid rgba(229,184,0,0.06)",
          }}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(229,184,0,0.03), transparent 70%)" }} />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(229,184,0,0.08)", border: "1px solid rgba(229,184,0,0.1)" }}>
                  <Trophy className="h-3.5 w-3.5 text-[#E5B800]" />
                </div>
                <span className="text-[9px] text-[#E5B800] font-bold uppercase tracking-[0.15em]">Featured Tournament</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">Weekend Championship</h3>
              <p className="text-xs text-[#5A6A80] mb-2">$50,000 USDT Guaranteed Prize Pool</p>
              <div className="flex items-center gap-4 text-[10px] text-[#4A5A70]">
                <span>📅 Apr 12, 18:00</span>
                <span>👥 234 registered</span>
                <span>🏆 Buy-in $100</span>
              </div>
            </div>
            <Link to="/tournaments">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, #E5B800, #CC9F00)",
                  color: "#1A1A2E",
                  boxShadow: "0 4px 16px rgba(229,184,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}>
                토너먼트 보기
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {selectedRoom && (
        <BuyInModal open={showBuyIn} onOpenChange={setShowBuyIn}
          minBuyIn={selectedRoom.minBuyIn} maxBuyIn={selectedRoom.maxBuyIn}
          currentBalance={currentBalance} tableName={selectedRoom.name} onJoinTable={handleBuyIn} />
      )}
      <CreateRoomModal open={showCreateRoom} onClose={() => setShowCreateRoom(false)} onCreateRoom={handleCreateRoom} />

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}