import { formatMoney } from "../utils/currency";
import { Link } from "react-router";
import { Trophy, Users, Clock, DollarSign, Zap, Crown, Star, ChevronRight, Flame } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useGameStore } from "../stores/gameStore";
import { useSocket } from "../hooks/useSocket";

interface Tournament {
  id: string;
  name: string;
  startTime: string;
  buyIn: number;
  guaranteed: number;
  players: number;
  maxPlayers: number;
  status: "registering" | "playing" | "completed";
  prizePool?: number;
  structure: "Regular" | "Turbo" | "Hyper" | "PKO";
  featured?: boolean;
}

const mockTournaments: Tournament[] = [
  { id: "5", name: "Sunday Million", startTime: "2026-04-13 15:00", buyIn: 500, guaranteed: 1000000, players: 892, maxPlayers: 5000, status: "registering", structure: "Regular", featured: true },
  { id: "1", name: "Weekend Warrior", startTime: "2026-04-12 18:00", buyIn: 100, guaranteed: 50000, players: 234, maxPlayers: 1000, status: "registering", structure: "Regular" },
  { id: "2", name: "Daily Turbo", startTime: "2026-04-11 20:00", buyIn: 25, guaranteed: 5000, players: 89, maxPlayers: 500, status: "registering", structure: "Turbo" },
  { id: "3", name: "High Roller Championship", startTime: "2026-04-15 16:00", buyIn: 1000, guaranteed: 250000, players: 45, maxPlayers: 200, status: "registering", structure: "PKO" },
  { id: "4", name: "Micro Madness", startTime: "2026-04-11 19:30", buyIn: 10, guaranteed: 1000, players: 156, maxPlayers: 300, status: "playing", prizePool: 1560, structure: "Hyper" },
  { id: "6", name: "Nightly Knockout", startTime: "2026-04-11 22:00", buyIn: 50, guaranteed: 15000, players: 178, maxPlayers: 750, status: "registering", structure: "PKO" },
];

const structureConfig: Record<string, { color: string; bg: string; icon: any }> = {
  Regular: { color: "#60A5FA", bg: "rgba(96,165,250,0.08)", icon: Star },
  Turbo:   { color: "#FF6B35", bg: "rgba(255,107,53,0.08)", icon: Zap },
  Hyper:   { color: "#EF4444", bg: "rgba(239,68,68,0.08)", icon: Flame },
  PKO:     { color: "#A78BFA", bg: "rgba(167,139,250,0.08)", icon: Crown },
};

// ── Detail Modal ──────────────────────────────────────────
function TournamentDetailModal({ tournament }: { tournament: Tournament }) {
  const sc = structureConfig[tournament.structure] ?? structureConfig.Regular;
  const blindStructure = [
    { level: 1, sb: 10, bb: 20, ante: 0, duration: 10 },
    { level: 2, sb: 15, bb: 30, ante: 0, duration: 10 },
    { level: 3, sb: 25, bb: 50, ante: 5, duration: 10 },
    { level: 4, sb: 50, bb: 100, ante: 10, duration: 10 },
    { level: 5, sb: 75, bb: 150, ante: 15, duration: 10 },
    { level: 6, sb: 100, bb: 200, ante: 25, duration: 10 },
    { level: 7, sb: 150, bb: 300, ante: 50, duration: 10 },
    { level: 8, sb: 200, bb: 400, ante: 75, duration: 10 },
  ];
  const prizes = [
    { place: "1st", pct: "25%", est: tournament.guaranteed * 0.25 },
    { place: "2nd", pct: "18%", est: tournament.guaranteed * 0.18 },
    { place: "3rd", pct: "13%", est: tournament.guaranteed * 0.13 },
    { place: "4th", pct: "10%", est: tournament.guaranteed * 0.10 },
    { place: "5th", pct: "8%",  est: tournament.guaranteed * 0.08 },
    { place: "6th–9th", pct: "5%", est: tournament.guaranteed * 0.05 },
  ];

  return (
    <DialogContent className="max-w-lg p-0 overflow-hidden border-0" hideClose>
      {/* Header */}
      <div className="relative px-6 pt-5 pb-4" style={{ background: "linear-gradient(135deg, #0F1923, #162033)" }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${sc.color}, transparent)` }} />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{tournament.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.color}22` }}>
                {tournament.structure}
              </span>
              {tournament.structure === "PKO" && (
                <span className="text-[10px] text-[#A78BFA]">Progressive Knockout</span>
              )}
            </div>
          </div>
          <Trophy className="h-10 w-10" style={{ color: sc.color, opacity: 0.3 }} />
        </div>
      </div>

      <Tabs defaultValue="details" className="px-6 pb-5 pt-3" style={{ background: "#0F1520" }}>
        <TabsList className="grid w-full grid-cols-3 bg-[#1A2235] p-0.5 rounded-lg mb-4">
          {["details", "structure", "prizes"].map(t => (
            <TabsTrigger key={t} value={t}
              className="text-xs py-1.5 data-[state=active]:bg-[#FF6B35]/10 data-[state=active]:text-[#FF6B35] rounded-md">
              {t === "details" ? "Details" : t === "structure" ? "Blinds" : "Prizes"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="details" className="space-y-3 mt-0">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Buy-in", value: `${getSymbol()}${tournament.buyIn.toLocaleString()}`, accent: false },
              { label: "Guaranteed", value: `${getSymbol()}${tournament.guaranteed.toLocaleString()}`, accent: true },
              { label: "Start Time", value: tournament.startTime, accent: false },
              { label: "Players", value: `${tournament.players} / ${tournament.maxPlayers}`, accent: false },
              { label: "Starting Stack", value: "5,000 chips", accent: false },
              { label: "Late Reg", value: "60 min", accent: false },
            ].map((item, i) => (
              <div key={i} className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[10px] text-[#4A5A70] uppercase tracking-wider mb-0.5">{item.label}</div>
                <div className={`font-mono text-sm font-semibold ${item.accent ? "text-[#FF6B35]" : "text-white"}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="structure" className="mt-0">
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="grid grid-cols-5 gap-0 text-[10px] text-[#4A5A70] uppercase tracking-wider px-3 py-2"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <span>Lvl</span><span>SB</span><span>BB</span><span>Ante</span><span>Min</span>
            </div>
            {blindStructure.map((lvl, i) => (
              <div key={lvl.level}
                className="grid grid-cols-5 gap-0 text-xs font-mono px-3 py-2 text-[#8899AB]"
                style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                <span className="text-white font-semibold">{lvl.level}</span>
                <span>{lvl.sb}</span><span>{lvl.bb}</span>
                <span className={lvl.ante ? "text-[#FF6B35]" : ""}>{lvl.ante || "-"}</span>
                <span>{lvl.duration}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prizes" className="space-y-2 mt-0">
          {prizes.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
              style={{ background: i === 0 ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${i === 0 ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.04)"}` }}>
              <div className="flex items-center gap-2">
                {i === 0 && <Trophy className="h-4 w-4 text-[#FFD700]" />}
                {i === 1 && <span className="text-[#C0C0C0] text-sm">🥈</span>}
                {i === 2 && <span className="text-[#CD7F32] text-sm">🥉</span>}
                <span className={`text-sm font-medium ${i === 0 ? "text-[#FFD700]" : "text-white"}`}>{p.place}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#4A5A70] mr-2">{p.pct}</span>
                <span className={`font-mono text-sm font-bold ${i === 0 ? "text-[#FFD700]" : "text-[#FF6B35]"}`}>
                  {getSymbol()}{p.est.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex gap-3 px-6 pb-5" style={{ background: "#0F1520" }}>
        {tournament.status === "registering" ? (
          <>
            <button onClick={() => toast.success(`${getSymbol()}${tournament.buyIn} 등록 완료!`)}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-bold text-white relative overflow-hidden group"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)", boxShadow: "0 4px 15px rgba(255,107,53,0.25)" }}>
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Register ({getSymbol()}{tournament.buyIn})
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
            <button className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-[#6B7A90] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all">
              Late Reg Info
            </button>
          </>
        ) : (
          <Link to={`/tournament/${tournament.id}`} className="flex-1">
            <button className="w-full py-2.5 rounded-lg text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
              Watch Live
            </button>
          </Link>
        )}
      </div>
    </DialogContent>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function TournamentLobby() {
  const { send, connected } = useSocket();
  const serverTournaments = useGameStore(s => s.tournaments);
  const [filter, setFilter] = useState<string>("all");

  // 서버에서 토너먼트 목록 요청
  useEffect(() => {
    if (connected) {
      send({ type: 'GET_TOURNAMENTS' });
      const t = setInterval(() => send({ type: 'GET_TOURNAMENTS' }), 10000);
      return () => clearInterval(t);
    }
  }, [connected, send]);

  // 서버 데이터 → 로컬 형식 (서버 데이터 있으면 사용, 없으면 mock)
  const allTournaments: Tournament[] = serverTournaments.length > 0
    ? serverTournaments.map((t: any, i: number) => ({
        id: t.id, name: t.name,
        startTime: new Date(t.startTime).toLocaleString(),
        buyIn: t.buyIn / 100, guaranteed: t.guaranteedPrize / 100,
        players: t.playerCount, maxPlayers: t.maxPlayers,
        status: t.status as any,
        structure: (["Regular", "Turbo", "PKO", "Hyper"] as const)[i % 4],
        featured: i === 0,
      }))
    : mockTournaments;

  const featured = allTournaments.find(t => t.featured);
  const others = allTournaments.filter(t => !t.featured);
  const filtered = filter === "all" ? others : others.filter(t => t.structure === filter);

  return (
    <div className="min-h-screen">

      {/* ═══ Hero Banner ═══ */}
      <section className="relative mx-3 sm:mx-5 mt-3 rounded-2xl overflow-hidden" style={{ height: "clamp(200px, 28vh, 280px)" }}>
        <img src="/src/assets/banners/hero_tournament.png" alt="Tournament" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(110deg, rgba(5,8,12,0.97) 0%, rgba(5,8,12,0.8) 35%, rgba(5,8,12,0.3) 60%, transparent 100%), linear-gradient(0deg, rgba(5,8,12,0.7) 0%, transparent 40%)",
        }} />
        <div className="relative z-10 h-full flex flex-col justify-end px-5 sm:px-8 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-[#FFD700]" />
            <span className="text-[10px] uppercase tracking-widest text-[#FFD700] font-bold">Tournaments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Poker Tournaments</h1>
          <p className="text-[#6B7A90] text-xs sm:text-sm max-w-md">
            보장 상금풀과 함께하는 프리미엄 토너먼트
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 sm:px-5 py-5">

        {/* ═══ Featured ═══ */}
        {featured && (
          <Dialog>
            <DialogTrigger asChild>
              <motion.div whileHover={{ scale: 1.005 }}
                className="relative mb-6 rounded-xl overflow-hidden cursor-pointer group"
                style={{ background: "linear-gradient(135deg, #141820, #1A2235)", border: "1px solid rgba(255,215,0,0.1)" }}>
                {/* Gold accent top */}
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: "linear-gradient(90deg, transparent, #FFD700, #FF6B35, transparent)" }} />
                {/* Glow */}
                <div className="absolute top-0 right-0 w-1/3 h-full pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 90% 30%, rgba(255,215,0,0.04), transparent 60%)" }} />

                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-[#FFD700] mb-2"
                        style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}>
                        <Star className="h-2.5 w-2.5" fill="#FFD700" /> FEATURED
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-white">{featured.name}</h2>
                      <p className="text-[#4A5A70] text-xs mt-0.5">The biggest tournament of the week</p>
                    </div>
                    <Trophy className="h-12 w-12 text-[#FFD700] opacity-20 group-hover:opacity-40 transition" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: "Buy-in", value: `${getSymbol()}${featured.buyIn.toLocaleString()}`, color: "text-white" },
                      { label: "Guaranteed", value: `${getSymbol()}${featured.guaranteed.toLocaleString()}`, color: "text-[#FFD700]" },
                      { label: "Players", value: `${featured.players} / ${featured.maxPlayers}`, color: "text-white" },
                      { label: "Starts", value: "Sunday 15:00", color: "text-white" },
                    ].map((item, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="text-[10px] text-[#4A5A70] uppercase tracking-wider">{item.label}</div>
                        <div className={`font-mono text-base sm:text-lg font-bold ${item.color}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 rounded-lg text-xs font-bold text-white inline-flex items-center gap-1.5"
                      style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)", boxShadow: "0 4px 15px rgba(255,107,53,0.2)" }}>
                      <Zap className="h-3 w-3" /> View Details & Register
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </span>
                    {/* Progress bar */}
                    <div className="flex-1 hidden sm:block">
                      <div className="h-1.5 rounded-full bg-[#1A2235] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(featured.players / featured.maxPlayers) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #FF6B35, #FFD700)" }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-[#4A5A70] mt-0.5">
                        <span>{Math.round((featured.players / featured.maxPlayers) * 100)}% filled</span>
                        <span>{featured.maxPlayers - featured.players} seats left</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </DialogTrigger>
            <TournamentDetailModal tournament={featured} />
          </Dialog>
        )}

        {/* ═══ Filters ═══ */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All", icon: Trophy },
            { key: "Regular", label: "Regular", icon: Star },
            { key: "Turbo", label: "Turbo", icon: Zap },
            { key: "Hyper", label: "Hyper", icon: Flame },
            { key: "PKO", label: "Knockout", icon: Crown },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${filter === f.key
                  ? "bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20"
                  : "text-[#4A5A70] bg-white/[0.02] border border-white/[0.04] hover:text-white hover:bg-white/[0.04]"
                }`}>
              <f.icon className="h-3 w-3" />
              {f.label}
            </button>
          ))}
        </div>

        {/* ═══ Tournament Grid ═══ */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => {
            const sc = structureConfig[t.structure] ?? structureConfig.Regular;
            const Icon = sc.icon;
            const fillPct = (t.players / t.maxPlayers) * 100;

            return (
              <Dialog key={t.id}>
                <DialogTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    className="rounded-xl p-4 cursor-pointer group transition-colors"
                    style={{
                      background: "#141820",
                      border: `1px solid rgba(255,255,255,0.04)`,
                    }}>
                    {/* Title + badges */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#FF6B35] transition-colors">{t.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ color: t.status === "playing" ? "#34D399" : "#FF6B35", background: t.status === "playing" ? "rgba(52,211,153,0.08)" : "rgba(255,107,53,0.08)" }}>
                            {t.status === "playing" ? "● Live" : "Registering"}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-0.5"
                            style={{ color: sc.color, background: sc.bg }}>
                            <Icon className="h-2.5 w-2.5" /> {t.structure}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#4A5A70]">Guaranteed</div>
                        <div className="font-mono text-sm font-bold text-[#FF6B35]">{getSymbol()}{t.guaranteed.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center px-2 py-1.5 rounded-md" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="text-[9px] text-[#4A5A70]">Buy-in</div>
                        <div className="font-mono text-xs font-semibold text-white">{getSymbol()}{t.buyIn}</div>
                      </div>
                      <div className="text-center px-2 py-1.5 rounded-md" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="text-[9px] text-[#4A5A70]">Players</div>
                        <div className="font-mono text-xs font-semibold text-white">{t.players}</div>
                      </div>
                      <div className="text-center px-2 py-1.5 rounded-md" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="text-[9px] text-[#4A5A70]">Start</div>
                        <div className="text-xs font-semibold text-white">{t.startTime.split(" ")[1]}</div>
                      </div>
                    </div>

                    {/* Fill bar */}
                    <div className="h-1 rounded-full bg-[#1A2235] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${fillPct}%`, background: `linear-gradient(90deg, ${sc.color}, ${sc.color}88)` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#3A4A5A] mt-1">
                      <span>{Math.round(fillPct)}% filled</span>
                      <span>{t.maxPlayers - t.players} left</span>
                    </div>
                  </motion.div>
                </DialogTrigger>
                <TournamentDetailModal tournament={t} />
              </Dialog>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-[#4A5A70] text-sm">
            No tournaments match this filter
          </div>
        )}
      </div>
    </div>
  );
}
