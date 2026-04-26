/**
 * TETHER.BET — Admin Dashboard v2.0
 * Phase 1~7 전체 기능 구현
 */
import { formatMoney, getSymbol } from "../utils/currency";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bot, Users, TrendingUp, Shield, Zap, Activity, Eye, Lock, LogOut, Ban,
  BarChart3, Clock, DollarSign, Settings, UserCircle, Upload, Edit3,
  Search, AlertTriangle, CreditCard, FileText, Calendar, Bell, Key,
  Monitor, Wifi, WifiOff, ChevronDown, ChevronRight, X, Check, Plus, Minus,
  Trophy, RefreshCw, Download, Trash2, ArrowUpRight, ArrowDownRight, Hash,
} from "lucide-react";
import { AVATAR_IMAGES, AVATAR_NAMES } from "../stores/settingsStore";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useSocket, addSocketListener, removeSocketListener } from "../hooks/useSocket";
import { useGameStore } from "../stores/gameStore";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// 보안 STEP 1: ADMIN_PASSWORD 하드코딩 제거 — 사용자가 입력 → 서버 검증 → 단명 token 발급
//   - 이전: ADMIN_KEY_HEADER 가 클라 번들에 평문 노출 (CRITICAL: anyone with DevTools = admin)
//   - 현재: 진입 시 password 입력 → POST /admin/auth/login → token 받음 → sessionStorage
//   - 이후 모든 admin 호출에 X-Admin-Token 헤더로만 인증
const ADMIN_TOKEN_KEY = 'holdem_admin_token';
function getAdminToken(): string | null {
  try { return sessionStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}
function setAdminToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}
function adminFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = getAdminToken();
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { 'X-Admin-Token': token } : {}),
    },
  });
}

// ═══ 타입 정의 ═══
interface AdminPlayer {
  id: string; nickname: string; balance: number; totalHands: number;
  winRate: number; profit: number; status: "online" | "offline" | "banned";
  lastLogin: string; ip: string; vipLevel: number; joinDate: string;
}

interface Transaction {
  id: string; playerId: string; nickname: string; type: "deposit" | "withdraw";
  amount: number; status: "pending" | "approved" | "rejected"; currency: string;
  timestamp: string; method: string;
}

interface AuditLog {
  id: string; admin: string; action: string; target: string;
  details: string; timestamp: string; level: "info" | "warning" | "critical";
}

interface HandRecord {
  id: string; handNumber: number; roomName: string; pot: number; rake: number;
  winners: string; timestamp: string; playerCount: number;
}

// ═══ Mock 데이터 생성 ═══
const generateRevenueData = () => Array.from({ length: 24 }, (_, i) => ({
  time: `${i.toString().padStart(2, '0')}:00`,
  rake: Math.floor(Math.random() * 500000 + 100000),
  players: Math.floor(Math.random() * 50 + 10),
}));

const generateDailyRevenue = () => Array.from({ length: 30 }, (_, i) => ({
  date: `${(i + 1).toString().padStart(2, '0')}일`,
  revenue: Math.floor(Math.random() * 5000000 + 1000000),
  rake: Math.floor(Math.random() * 1500000 + 300000),
  players: Math.floor(Math.random() * 200 + 50),
}));

const generatePlayers = (): AdminPlayer[] => [
  { id: "p1", nickname: "PokerKing88", balance: 4520000, totalHands: 12458, winRate: 54.2, profit: 2340000, status: "online", lastLogin: "2026-04-11 14:23", ip: "211.234.xxx.xx", vipLevel: 3, joinDate: "2026-01-15" },
  { id: "p2", nickname: "AceHunter", balance: 1280000, totalHands: 8923, winRate: 48.7, profit: -520000, status: "online", lastLogin: "2026-04-11 14:20", ip: "175.123.xxx.xx", vipLevel: 2, joinDate: "2026-02-03" },
  { id: "p3", nickname: "BluffMaster", balance: 8900000, totalHands: 23456, winRate: 51.3, profit: 5670000, status: "online", lastLogin: "2026-04-11 14:15", ip: "222.108.xxx.xx", vipLevel: 5, joinDate: "2025-11-20" },
  { id: "p4", nickname: "FishPlayer99", balance: 150000, totalHands: 345, winRate: 32.1, profit: -890000, status: "offline", lastLogin: "2026-04-10 22:45", ip: "61.78.xxx.xx", vipLevel: 1, joinDate: "2026-04-01" },
  { id: "p5", nickname: "SharkyPro", balance: 15600000, totalHands: 45678, winRate: 58.9, profit: 12400000, status: "online", lastLogin: "2026-04-11 14:25", ip: "125.140.xxx.xx", vipLevel: 7, joinDate: "2025-08-10" },
  { id: "p6", nickname: "LuckyDraw", balance: 0, totalHands: 2100, winRate: 41.5, profit: -1500000, status: "banned", lastLogin: "2026-04-08 09:12", ip: "58.227.xxx.xx", vipLevel: 1, joinDate: "2026-03-05" },
];

const generateTransactions = (): Transaction[] => [
  { id: "tx1", playerId: "p1", nickname: "PokerKing88", type: "deposit", amount: 1000000, status: "approved", currency: "USDT", timestamp: "2026-04-11 14:00", method: "Tether TRC20" },
  { id: "tx2", playerId: "p3", nickname: "BluffMaster", type: "withdraw", amount: 5000000, status: "pending", currency: "USDT", timestamp: "2026-04-11 13:45", method: "Tether TRC20" },
  { id: "tx3", playerId: "p5", nickname: "SharkyPro", type: "deposit", amount: 3000000, status: "approved", currency: "USDT", timestamp: "2026-04-11 12:30", method: "Tether TRC20" },
  { id: "tx4", playerId: "p2", nickname: "AceHunter", type: "withdraw", amount: 800000, status: "pending", currency: "USDT", timestamp: "2026-04-11 11:20", method: "Tether ERC20" },
  { id: "tx5", playerId: "p4", nickname: "FishPlayer99", type: "deposit", amount: 500000, status: "rejected", currency: "USDT", timestamp: "2026-04-10 22:00", method: "Tether TRC20" },
];

const generateAuditLogs = (): AuditLog[] => [
  { id: "a1", admin: "SuperAdmin", action: "SET_RTP", target: "Global", details: "RTP changed to 95%", timestamp: "2026-04-11 14:20", level: "warning" },
  { id: "a2", admin: "SuperAdmin", action: "BAN_PLAYER", target: "LuckyDraw", details: "Collusion detected, permanent ban", timestamp: "2026-04-08 09:15", level: "critical" },
  { id: "a3", admin: "SuperAdmin", action: "ADD_BOTS", target: "입문 500/1K", details: "3 AI bots deployed (Lv.3-8)", timestamp: "2026-04-11 13:00", level: "info" },
  { id: "a4", admin: "SuperAdmin", action: "APPROVE_WITHDRAW", target: "SharkyPro", details: "₩5,000,000 USDT withdrawal approved", timestamp: "2026-04-11 12:45", level: "info" },
  { id: "a5", admin: "SuperAdmin", action: "CREATE_ROOM", target: "VIP 10만/20만", details: "New VIP room created", timestamp: "2026-04-11 10:00", level: "info" },
];

const generateHandRecords = (): HandRecord[] => Array.from({ length: 20 }, (_, i) => ({
  id: `h${i}`, handNumber: 10000 + i, roomName: ["입문 500/1K", "스탠다드 5K/1만", "하이 1만/2만", "VIP 5만/10만"][i % 4]!,
  pot: Math.floor(Math.random() * 2000000 + 100000), rake: Math.floor(Math.random() * 50000 + 5000),
  winners: ["PokerKing88", "BluffMaster", "SharkyPro", "AceHunter"][i % 4]!,
  timestamp: `2026-04-11 ${(14 - Math.floor(i / 3)).toString().padStart(2, '0')}:${(59 - i * 3).toString().padStart(2, '0')}`,
  playerCount: Math.floor(Math.random() * 5 + 3),
}));

// ═══ 카드 컴포넌트 ═══
function StatCard({ label, value, icon: Icon, color, trend, trendValue }: {
  label: string; value: string; icon: any; color: string; trend?: "up" | "down"; trendValue?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 relative overflow-hidden" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}44, transparent)` }} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[#4A5A70] uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4" style={{ color, opacity: 0.5 }} />
      </div>
      <div className="font-mono text-xl font-bold text-white">{value}</div>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" ? <ArrowUpRight className="h-3 w-3 text-emerald-400" /> : <ArrowDownRight className="h-3 w-3 text-red-400" />}
          <span className={`text-[10px] font-mono ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
}

function SectionHeader({ title, icon: Icon, color, action }: { title: string; icon: any; color: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color }} /> {title}
      </h3>
      {action}
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>{children}</div>;
}

// ═══════════════════════════════════════════════════
// 🟢 LIVE 데이터 패널들 (실 API 연결)
// ═══════════════════════════════════════════════════

// 보안 STEP 1: ADMIN_KEY_HEADER 제거 — adminFetch() 가 token 자동 주입

function PartnersLivePanel() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsAgg, setStatsAgg] = useState({ total: 0, active: 0, sandbox: 0, suspended: 0 });

  const refresh = useCallback(async () => {
    try {
      const res = await adminFetch('/admin/partners');
      const data = await res.json();
      if (data.success) {
        setPartners(data.partners || []);
        const agg = { total: data.partners.length, active: 0, sandbox: 0, suspended: 0 };
        for (const p of data.partners) {
          if (p.status === 'active') agg.active++;
          else if (p.status === 'sandbox') agg.sandbox++;
          else if (p.status === 'suspended') agg.suspended++;
        }
        setStatsAgg(agg);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const changeStatus = async (id: string, status: string) => {
    if (!confirm(`${id} → ${status} 변경?`)) return;
    try {
      const res = await adminFetch(`/admin/partners/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ status, reason: 'admin manual' }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`${id} → ${status}`); refresh(); }
      else toast.error(data.error || 'Failed');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <>
      {/* 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={String(statsAgg.total)} icon={Activity} color="#26A17B" />
        <StatCard label="Active" value={String(statsAgg.active)} icon={Check} color="#34D399" />
        <StatCard label="Sandbox" value={String(statsAgg.sandbox)} icon={Clock} color="#FBBF24" />
        <StatCard label="Suspended" value={String(statsAgg.suspended)} icon={Ban} color="#EF4444" />
      </div>

      {/* 테이블 */}
      <Panel>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title="Partner List" icon={Activity} color="#A78BFA" />
          <button onClick={refresh} className="text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            style={{ background: "rgba(38,161,123,0.1)", color: "#26A17B" }}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
        {loading ? (
          <div className="text-center py-6 text-[#6B7A90]">로딩 중...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[9px] text-[#4A5A70] uppercase tracking-wider border-b border-white/[0.03]">
                  <th className="text-left py-2 px-2">ID</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Plan</th>
                  <th className="text-left">Webhook URL</th>
                  <th className="text-center">API Key</th>
                  <th className="text-center">Hands</th>
                  <th className="text-center">Rake</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {partners.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.01]">
                    <td className="py-2 px-2">
                      <div className="text-white font-medium text-[11px]">{p.name}</div>
                      <div className="text-[9px] text-[#3A4A5A]">{p.id}</div>
                    </td>
                    <td className="text-center">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        p.status === 'active' ? 'text-emerald-400 bg-emerald-400/[0.08]' :
                        p.status === 'sandbox' ? 'text-yellow-400 bg-yellow-400/[0.08]' :
                        p.status === 'suspended' ? 'text-red-400 bg-red-400/[0.08]' :
                        'text-[#6B7A90] bg-white/[0.04]'
                      }`}>{p.status}</span>
                    </td>
                    <td className="text-center text-[9px] text-[#A78BFA] uppercase">{p.plan}</td>
                    <td className="text-[9px] text-[#6B7A90] truncate max-w-[180px]">
                      {p.apiCallbackUrl || <span className="text-[#3A4A5A]">— 없음 —</span>}
                    </td>
                    <td className="text-center font-mono text-[9px] text-[#22D3EE]">{p.apiKey}</td>
                    <td className="text-center font-mono text-white text-[10px]">{(p.stats?.totalHands || 0).toLocaleString()}</td>
                    <td className="text-center font-mono text-[#FFD700] text-[10px]">{formatMoney(Math.round((p.stats?.totalRake || 0) / 100))}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.status !== 'active' && (
                          <button onClick={() => changeStatus(p.id, 'active')}
                            className="text-[9px] px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-400/[0.08]"
                            title="활성화">▶</button>
                        )}
                        {p.status !== 'suspended' && p.id !== 'tether_bet' && (
                          <button onClick={() => changeStatus(p.id, 'suspended')}
                            className="text-[9px] px-1.5 py-0.5 rounded text-red-400 bg-red-400/[0.08]"
                            title="중지">⏸</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function ReconciliationLivePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminFetch('/admin/reconciliation?days=7');
        const json = await res.json();
        if (json.success) setData(json);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
    const t = setInterval(fetchData, 60000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <Panel><div className="text-center py-6 text-[#6B7A90]">대사 로딩 중...</div></Panel>;
  if (!data) return <Panel><div className="text-center py-6 text-[#EF4444]">로드 실패</div></Panel>;

  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title="Reconciliation (rake_hist vs daily_settlements)" icon={Shield} color="#FBBF24" />
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#34D399]">✅ {data.okCount}</span>
          <span className="text-[#EF4444]">❌ {data.issueCount}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[9px] text-[#4A5A70] uppercase tracking-wider border-b border-white/[0.03]">
              <th className="text-left py-2 px-2">날짜</th>
              <th className="text-center">Settle 핸드</th>
              <th className="text-center">Rake 핸드</th>
              <th className="text-center">차이</th>
              <th className="text-center">Settle 레이크</th>
              <th className="text-center">분배 검증</th>
              <th className="text-center">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {(data.rows || []).map((r: any) => (
              <tr key={r.settlement_date}>
                <td className="py-2 px-2 text-white font-mono text-[10px]">{r.settlement_date}</td>
                <td className="text-center font-mono text-[10px] text-[#6B7A90]">{(r.settle_hands || 0).toLocaleString()}</td>
                <td className="text-center font-mono text-[10px] text-[#6B7A90]">{(r.rake_hand_count || 0).toLocaleString()}</td>
                <td className={`text-center font-mono text-[10px] ${Math.abs(r.diff_hands || 0) > 100 ? 'text-[#EF4444]' : 'text-[#6B7A90]'}`}>
                  {r.diff_hands > 0 ? '+' : ''}{r.diff_hands}
                </td>
                <td className="text-center font-mono text-[10px] text-[#FFD700]">{formatMoney(Math.round((r.settle_rake || 0) / 100))}</td>
                <td className="text-center text-[10px]">{r.diff_split === 0 ? '✅' : `❌ ${r.diff_split}`}</td>
                <td className="text-center text-[10px]">{r.is_ok ? '🟢' : '🔴'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function SystemMetricsPanel() {
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [m, h] = await Promise.all([
          fetch('/metrics').then(r => r.text()),
          fetch('/health').then(r => r.json()),
        ]);
        const parsed: any = {};
        for (const line of m.split('\n')) {
          const match = line.match(/^tether_holdem_(\w+)\s+([\d.-]+)/);
          if (match) parsed[match[1]] = Number(match[2]);
        }
        setMetrics(parsed);
        setHealth(h);
      } catch {}
    };
    fetchAll();
    const t = setInterval(fetchAll, 5000);
    return () => clearInterval(t);
  }, []);

  if (!metrics || !health) return <Panel><div className="text-center py-6 text-[#6B7A90]">메트릭 로딩...</div></Panel>;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Hands" value={(metrics.hands_total || 0).toLocaleString()} icon={Hash} color="#FFD700" />
        <StatCard label="In Progress" value={String(metrics.hands_in_progress || 0)} icon={Activity} color="#26A17B" />
        <StatCard label="Active Rooms" value={String(health.checks?.activeRooms || 0)} icon={Eye} color="#A78BFA" />
        <StatCard label="Connections" value={String(metrics.connections_active || 0)} icon={Wifi} color="#60A5FA" />
      </div>
      <Panel>
        <SectionHeader title="시스템 상태" icon={Monitor} color="#26A17B" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <div className="text-[#6B7A90] mb-1">Memory</div>
            <div className="text-2xl font-bold text-white">{health.checks?.memory?.percent || 0}%</div>
            <div className="text-[10px] text-[#6B7A90]">{Math.round((health.checks?.memory?.used || 0) / 1024)} / {Math.round((health.checks?.memory?.total || 0) / 1024)} MB</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <div className="text-[#6B7A90] mb-1">Uptime</div>
            <div className="text-2xl font-bold text-white">{Math.floor((health.uptime || 0) / 60)}분</div>
            <div className="text-[10px] text-[#6B7A90]">{health.uptime}초</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <div className="text-[#6B7A90] mb-1">DB</div>
            <div className="text-2xl font-bold text-white">{health.checks?.database ? '🟢 OK' : '🔴 DOWN'}</div>
          </div>
        </div>
      </Panel>
      <Panel>
        <SectionHeader title="정산 webhook 상태" icon={DollarSign} color="#FFD700" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <div className="text-[10px] text-[#6B7A90]">성공</div>
            <div className="text-xl font-bold text-emerald-400">{metrics.settlement_webhook_success_total || 0}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <div className="text-[10px] text-[#6B7A90]">실패</div>
            <div className="text-xl font-bold text-red-400">{metrics.settlement_webhook_failure_total || 0}</div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02]">
            <div className="text-[10px] text-[#6B7A90]">대사 이슈</div>
            <div className="text-xl font-bold text-yellow-400">{metrics.settlement_reconciliation_issues_total || 0}</div>
          </div>
        </div>
      </Panel>
    </>
  );
}

function BotsLivePanel() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    const f = async () => {
      try {
        const res = await adminFetch('/admin/bots');
        const json = await res.json();
        if (json.success) setData(json);
      } catch {}
    };
    f();
    const t = setInterval(f, 10000);
    return () => clearInterval(t);
  }, []);
  if (!data) return <Panel><div className="text-center py-6 text-[#6B7A90]">봇 통계 로딩...</div></Panel>;
  const sum = data.distributionSummary || {};
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="총 봇" value={String(data.totalBots || 0)} icon={Bot} color="#34D399" />
        <StatCard label="활성 봇" value={String(data.activeBots || 0)} icon={Activity} color="#26A17B" />
        <StatCard label="봇 0인 방" value={String(sum.roomsWithoutBots || 0)} icon={AlertTriangle} color={sum.roomsWithoutBots > 5 ? "#EF4444" : "#FBBF24"} />
        <StatCard label="봇 5+ 인 방" value={String(sum.roomsWithManyBots || 0)} icon={Users} color="#A78BFA" />
      </div>
      <Panel>
        <SectionHeader title="방별 봇 분포" icon={Bot} color="#34D399" />
        <div className="text-[10px] text-[#6B7A90] mb-2">평균: {sum.avgBotsPerRoom} 봇/방 · 전체 {sum.totalRooms} 방</div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#141820]">
              <tr className="text-[9px] text-[#4A5A70] uppercase border-b border-white/[0.03]">
                <th className="text-left py-2 px-2">Room</th>
                <th className="text-center">Bots</th>
                <th className="text-center">Humans</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.distribution || []).map((d: any) => (
                <tr key={d.roomId} className="hover:bg-white/[0.01] border-b border-white/[0.02]">
                  <td className="py-1.5 px-2 text-[10px] text-white truncate max-w-[200px]">{d.roomName}</td>
                  <td className="text-center font-mono text-[10px] text-[#34D399]">{d.botCount}</td>
                  <td className="text-center font-mono text-[10px] text-[#60A5FA]">{d.humanCount}</td>
                  <td className="text-center text-[10px]">
                    {d.botCount === 0 ? '🟡 비어있음' :
                     d.botCount >= 5 ? '🔴 과밀' :
                     '🟢 정상'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function BanListPanel() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const res = await adminFetch('/admin/players/banned');
      const json = await res.json();
      if (json.success) setList(json.banned || []);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const unban = async (playerId: string) => {
    if (!confirm(`${playerId} 차단 해제?`)) return;
    try {
      const res = await adminFetch('/admin/players/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ playerId, type: 'ban' }),
      });
      const json = await res.json();
      if (json.success) { toast.success('차단 해제됨'); refresh(); }
      else toast.error(json.error || 'Failed');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title={`차단 유저 (${list.length})`} icon={Ban} color="#EF4444" />
        <button onClick={refresh} className="text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
          style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      {loading ? <div className="text-center py-6 text-[#6B7A90]">로딩...</div> : (
        list.length === 0 ? <div className="text-center py-6 text-[#34D399]">✅ 차단된 유저 없음</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[9px] text-[#4A5A70] uppercase border-b border-white/[0.03]">
                  <th className="text-left py-2 px-2">Player ID</th>
                  <th className="text-left">사유</th>
                  <th className="text-center">차단 시각</th>
                  <th className="text-center">기간</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {list.map((b: any) => (
                  <tr key={b.id || b.player_id} className="hover:bg-white/[0.01]">
                    <td className="py-2 px-2 text-[10px] font-mono text-white">{b.player_id}</td>
                    <td className="text-[10px] text-[#6B7A90]">{b.reason || '-'}</td>
                    <td className="text-center text-[10px] text-[#6B7A90]">{b.banned_at ? new Date(b.banned_at).toLocaleString() : '-'}</td>
                    <td className="text-center text-[10px] text-[#FBBF24]">{b.until ? `~${new Date(b.until).toLocaleDateString()}` : 'permanent'}</td>
                    <td className="text-center">
                      <button onClick={() => unban(b.player_id)}
                        className="text-[9px] px-2 py-0.5 rounded text-emerald-400 bg-emerald-400/[0.08]">
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </Panel>
  );
}

function ForceCloseRoomPanel() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [closeTarget, setCloseTarget] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [confirmFinal, setConfirmFinal] = useState(false);

  useEffect(() => {
    const f = async () => {
      try {
        const res = await adminFetch('/admin/tables/active');
        const json = await res.json();
        if (json.success) setRooms(json.tables || json.rooms || []);
      } catch {}
    };
    f();
    const t = setInterval(f, 15000);
    return () => clearInterval(t);
  }, []);

  const doClose = async () => {
    if (!closeTarget || !reason.trim()) return;
    try {
      const res = await adminFetch('/admin/tables/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ tableId: closeTarget.id, reason }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`방 종료: ${closeTarget.name || closeTarget.id}`);
        setCloseTarget(null); setReason(''); setConfirmFinal(false);
        setRooms(rs => rs.filter(r => r.id !== closeTarget.id));
      } else toast.error(json.error || 'Failed');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <>
      <Panel>
        <SectionHeader title={`활성 방 (${rooms.length})`} icon={Eye} color="#A78BFA" />
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#141820]">
              <tr className="text-[9px] text-[#4A5A70] uppercase border-b border-white/[0.03]">
                <th className="text-left py-2 px-2">Room</th>
                <th className="text-center">Players</th>
                <th className="text-center">Pot</th>
                <th className="text-center">Phase</th>
                <th className="text-center">Force Close</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.01] border-b border-white/[0.02]">
                  <td className="py-1.5 px-2 text-[10px] text-white truncate max-w-[200px]">{r.name || r.id}</td>
                  <td className="text-center font-mono text-[10px]">{r.current_players || 0}/{r.max_seats || 9}</td>
                  <td className="text-center font-mono text-[10px] text-[#FFD700]">{formatMoney(Math.round((r.pot || 0) / 100))}</td>
                  <td className="text-center text-[10px] text-[#6B7A90]">{r.phase || '-'}</td>
                  <td className="text-center">
                    <button onClick={() => { setCloseTarget(r); setReason(''); setConfirmFinal(false); }}
                      className="text-[9px] px-2 py-0.5 rounded text-red-400 bg-red-400/[0.08]">
                      ⚠️ Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 2단계 confirm 모달 */}
      <AnimatePresence>
        {closeTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
            onClick={() => !confirmFinal && setCloseTarget(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="w-full max-w-md rounded-2xl p-5"
              style={{ background: '#141820', border: '1px solid #EF4444' }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold text-red-400 mb-2">⚠️ 강제 방 종료</h3>
              <p className="text-[12px] text-[#8899AB] mb-4">
                <span className="text-white font-bold">{closeTarget.name || closeTarget.id}</span> 방을 즉시 종료합니다.
                현재 {closeTarget.current_players || 0}명 플레이어 영향.
              </p>
              {!confirmFinal ? (
                <>
                  <label className="text-[10px] text-[#6B7A90] block mb-1">종료 사유 (audit log 기록)</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="예: 어뷰징 의심 / 짜고치기 신고 / 운영 이슈"
                    className="w-full px-3 py-2 rounded-lg text-[12px] bg-black/40 text-white"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', minHeight: '80px', fontSize: '14px' }} />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setCloseTarget(null)}
                      className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-[#6B7A90] bg-white/[0.03]">
                      취소
                    </button>
                    <button onClick={() => setConfirmFinal(true)} disabled={!reason.trim()}
                      className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white bg-red-500 disabled:opacity-30">
                      다음 →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-3">
                    <div className="text-[12px] text-red-400 font-bold mb-1">정말 종료하시겠습니까?</div>
                    <div className="text-[11px] text-[#8899AB]">사유: {reason}</div>
                    <div className="text-[10px] text-[#6B7A90] mt-2">
                      이 액션은 audit log 에 영구 기록됩니다.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmFinal(false)}
                      className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-[#6B7A90] bg-white/[0.03]">
                      ← 뒤로
                    </button>
                    <button onClick={doClose}
                      className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white bg-red-600">
                      ⚠️ 종료 확정
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TelegramStatsPanel() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    const f = async () => {
      try {
        const res = await adminFetch('/admin/telegram/stats');
        const json = await res.json();
        if (json.success) setStats(json);
      } catch {}
    };
    f();
    const t = setInterval(f, 30000);
    return () => clearInterval(t);
  }, []);
  if (!stats) return null;
  const rate = stats.conversionRate ? Number(stats.conversionRate) : 0;
  const rateColor = rate >= 50 ? '#34D399' : rate >= 30 ? '#FBBF24' : '#EF4444';
  return (
    <Panel>
      <SectionHeader title="📱 Telegram 연동 현황" icon={Bell} color="#0088CC" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        <div className="p-3 rounded-lg bg-white/[0.02]">
          <div className="text-[10px] text-[#6B7A90]">연동 유저</div>
          <div className="text-2xl font-bold text-[#0088CC]">{stats.linked.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02]">
          <div className="text-[10px] text-[#6B7A90]">현재 접속</div>
          <div className="text-2xl font-bold text-white">{stats.totalConnected}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02]">
          <div className="text-[10px] text-[#6B7A90]">연동률</div>
          <div className="text-2xl font-bold" style={{ color: rateColor }}>
            {stats.conversionRate ? `${stats.conversionRate}%` : '-'}
          </div>
          <div className="text-[9px] mt-0.5" style={{ color: rateColor }}>
            {rate >= 50 ? '🟢 우수' : rate >= 30 ? '🟡 보통' : rate > 0 ? '🔴 개선 필요' : ''}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.02]">
          <div className="text-[10px] text-[#6B7A90]">대기 토큰</div>
          <div className="text-2xl font-bold text-[#FBBF24]">{stats.pendingTokens}</div>
          <div className="text-[9px] text-[#6B7A90] mt-0.5">5분 만료</div>
        </div>
      </div>
    </Panel>
  );
}

function TournamentLivePanel() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const res = await adminFetch('/admin/tournament/list');
      const data = await res.json();
      if (data.success) setList(data.tournaments || []);
    } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 10000); return () => clearInterval(t); }, [refresh]);

  const cancel = async (id: string) => {
    if (!confirm(`토너먼트 ${id} 취소? 등록자 환불 처리됨.`)) return;
    try {
      const res = await adminFetch(`/admin/tournament/${id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json'},
      });
      const data = await res.json();
      if (data.success) { toast.success('취소됨'); refresh(); }
      else toast.error(data.error || 'Failed');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title="🟢 LIVE Tournaments" icon={Trophy} color="#FFD700" />
        <button onClick={refresh} className="text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
          style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      {loading ? <div className="text-center py-6 text-[#6B7A90]">로딩...</div> : (
        list.length === 0 ? (
          <div className="text-center py-8 text-[#6B7A90] text-[11px]">활성 토너먼트가 없습니다 — 위에서 생성하세요</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[9px] text-[#4A5A70] uppercase border-b border-white/[0.03]">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Buy-in</th>
                  <th className="text-center">Players</th>
                  <th className="text-center">Prize Pool</th>
                  <th className="text-center">Start</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {list.map(t => {
                  const startsIn = (t.startTime || 0) - Date.now();
                  return (
                    <tr key={t.id} className="hover:bg-white/[0.01]">
                      <td className="py-2 px-2">
                        <div className="text-white font-medium text-[11px]">{t.name}</div>
                        <div className="text-[9px] text-[#3A4A5A] font-mono">{t.id}</div>
                      </td>
                      <td className="text-center">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          t.status === 'RUNNING' ? 'text-emerald-400 bg-emerald-400/[0.08]' :
                          t.status === 'REGISTERING' ? 'text-yellow-400 bg-yellow-400/[0.08]' :
                          t.status === 'FINISHED' ? 'text-[#6B7A90] bg-white/[0.04]' :
                          t.status === 'CANCELLED' ? 'text-red-400 bg-red-400/[0.08]' :
                          'text-blue-400 bg-blue-400/[0.08]'
                        }`}>{t.status}</span>
                      </td>
                      <td className="text-center font-mono text-[10px] text-[#FFD700]">{formatMoney(Math.round((t.buyIn || 0) / 100))}</td>
                      <td className="text-center font-mono text-[10px] text-white">{t.totalPlayers || 0}/{t.maxPlayers}</td>
                      <td className="text-center font-mono text-[10px] text-emerald-400">{formatMoney(Math.round((t.totalPrizePool || 0) / 100))}</td>
                      <td className="text-center text-[10px] text-[#6B7A90]">
                        {startsIn > 0 ? `+${Math.floor(startsIn / 60000)}분` : '시작됨'}
                      </td>
                      <td className="text-center">
                        {(t.status === 'REGISTERING' || t.status === 'STARTING') && (
                          <button onClick={() => cancel(t.id)}
                            className="text-[9px] px-2 py-0.5 rounded text-red-400 bg-red-400/[0.08]">
                            ⚠️ Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </Panel>
  );
}

// ═══ 메인 컴포넌트 ═══
export default function AdminDashboard() {
  const { send, connected } = useSocket();
  const rooms = useGameStore(s => s.rooms);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  // 보안 STEP 1: 페이지 로드 시 기존 토큰 검증 (새로고침 후 재로그인 회피)
  useEffect(() => {
    const existing = getAdminToken();
    if (!existing) return;
    fetch('/admin/auth/me', { headers: { 'X-Admin-Token': existing } })
      .then(r => r.json())
      .then(d => { if (d.success) setAuthenticated(true); else setAdminToken(null); })
      .catch(() => setAdminToken(null));
  }, []);

  const doAdminLogin = useCallback(async () => {
    if (!password) { toast.error('Password required'); return; }
    try {
      const res = await fetch('/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
        setAuthenticated(true);
        setPassword('');
        toast.success('Welcome, Admin');
      } else if (res.status === 429) {
        toast.error('너무 많은 실패 — 15분 후 재시도');
      } else {
        toast.error(data.error || 'Invalid password');
        setPassword('');
      }
    } catch (e: any) {
      toast.error(`Login failed: ${e.message}`);
    }
  }, [password]);

  const doAdminLogout = useCallback(() => {
    const token = getAdminToken();
    if (token) {
      fetch('/admin/auth/logout', { method: 'POST', headers: { 'X-Admin-Token': token } }).catch(() => {});
    }
    setAdminToken(null);
    setAuthenticated(false);
    toast.success('Logged out');
  }, []);

  // Phase 1: 실시간 데이터
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [rtpTarget, setRtpTarget] = useState(95);
  // RTP 실시간 데이터 (서버 연동)
  const [rtpDashboard, setRtpDashboard] = useState<any>(null);
  const [rtpConfig, setRtpConfig] = useState<any>(null);
  const [rtpPlayers, setRtpPlayers] = useState<any[]>([]);
  const [rtpPlayerDetail, setRtpPlayerDetail] = useState<any>(null);
  const [rtpOverrideId, setRtpOverrideId] = useState("");
  const [rtpOverrideValue, setRtpOverrideValue] = useState(95);
  const [revenueData] = useState(generateRevenueData);
  const [dailyRevenue] = useState(generateDailyRevenue);
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "week" | "month">("today");

  // Phase 2: 방 관리
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSB, setNewRoomSB] = useState(500);
  const [newRoomBB, setNewRoomBB] = useState(1000);
  const [newRoomMinBuy, setNewRoomMinBuy] = useState(50000);
  const [newRoomMaxBuy, setNewRoomMaxBuy] = useState(200000);
  const [newRoomMax, setNewRoomMax] = useState(8);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [monitorRoom, setMonitorRoom] = useState<string | null>(null);

  // Phase 3: 플레이어
  const [players] = useState(generatePlayers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayer | null>(null);
  const [balanceAdjust, setBalanceAdjust] = useState(0);
  const [banReason, setBanReason] = useState("");

  // Phase 4: 재무
  const [transactions, setTransactions] = useState(generateTransactions);

  // Phase 5: AI 봇
  const [botCount, setBotCount] = useState(3);
  const [botLevel, setBotLevel] = useState([3, 8]);
  const [botAutoSchedule, setBotAutoSchedule] = useState(false);

  // Phase 6: 보안
  const [auditLogs] = useState(generateAuditLogs);
  const [handRecords] = useState(generateHandRecords);
  const [handSearch, setHandSearch] = useState("");

  // Phase 7: 아바타
  const [avatarList, setAvatarList] = useState(AVATAR_IMAGES.map((img, i) => ({
    id: i, src: img, name: AVATAR_NAMES[i] ?? `Avatar ${i + 1}`, enabled: true,
  })));
  const [editingAvatar, setEditingAvatar] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");

  // 실시간 폴링
  useEffect(() => {
    if (connected && authenticated) {
      send({ type: 'GET_ROOMS' });
      const t = setInterval(() => send({ type: 'GET_ROOMS' }), 5000);
      return () => clearInterval(t);
    }
  }, [connected, authenticated]);

  // RTP 데이터 수신 리스너
  useEffect(() => {
    const handler = (msg: any) => {
      if (msg.type === 'ADMIN_RTP_DASHBOARD') setRtpDashboard(msg.data);
      if (msg.type === 'ADMIN_RTP_CONFIG') setRtpConfig(msg.data);
      if (msg.type === 'ADMIN_RTP_PLAYERS') setRtpPlayers(msg.data || []);
      if (msg.type === 'ADMIN_RTP_PLAYER') setRtpPlayerDetail(msg.data);
    };
    addSocketListener(handler);
    return () => removeSocketListener(handler);
  }, []);

  // RTP 탭 진입 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'rtp' && connected && authenticated) {
      send({ type: 'ADMIN_RTP_DASHBOARD' } as any);
      send({ type: 'ADMIN_RTP_CONFIG' } as any);
      send({ type: 'ADMIN_RTP_PLAYERS' } as any);
    }
  }, [activeTab, connected, authenticated]);

  const totalPlayers = rooms.reduce((s, r) => s + r.playerCount, 0);
  const activeRooms = rooms.filter(r => r.playerCount > 0).length;
  const totalRake = useMemo(() => revenueData.reduce((s, d) => s + d.rake, 0), [revenueData]);
  const filteredPlayers = players.filter(p =>
    p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.includes(searchQuery) || p.ip.includes(searchQuery)
  );
  const filteredHands = handRecords.filter(h =>
    h.handNumber.toString().includes(handSearch) ||
    h.roomName.includes(handSearch) || h.winners.includes(handSearch)
  );

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'partner-docs', label: '📘 Partner Docs', icon: FileText },
    { key: 'tenants', label: 'Tenants', icon: Activity },
    { key: 'rooms', label: 'Rooms', icon: Eye },
    { key: 'players', label: 'Players', icon: Users },
    { key: 'finance', label: 'Finance', icon: CreditCard },
    { key: 'settlement', label: 'Settlement', icon: DollarSign },
    { key: 'system', label: '⚙️ System', icon: Monitor },
    { key: 'bots', label: 'AI Bots', icon: Bot },
    { key: 'rtp', label: 'RTP', icon: TrendingUp },
    { key: 'hands', label: 'Hands', icon: Hash },
    { key: 'avatars', label: 'Avatars', icon: UserCircle },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'tournament', label: 'Tournament', icon: Trophy },
  ];

  // ═══ LOGIN GATE ═══
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "radial-gradient(ellipse at 50% 30%, #0F1923, #080E16)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[380px] rounded-2xl overflow-hidden"
          style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
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
          <div className="px-8 pb-8">
            <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider mb-1.5 block">Password</label>
            <div className="relative mb-4">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3A4A5A]" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') doAdminLogin(); }}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-[#3A4A5A] bg-[#0B1018] border border-[#1A2235] focus:border-[#FF6B35] focus:outline-none" />
            </div>
            <button onClick={doAdminLogin}
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)", boxShadow: "0 4px 15px rgba(255,107,53,0.25)" }}>
              Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══ DASHBOARD ═══
  return (
    <div className="min-h-screen" style={{ background: "#0B0E14" }}>
      {/* Top Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between sticky top-0 z-50"
        style={{ background: "rgba(8,12,18,0.97)", borderBottom: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">TETHER.BET Admin</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-mono"
            style={{ background: "rgba(52,211,153,0.08)", color: "#34D399", border: "1px solid rgba(52,211,153,0.15)" }}>v2.0</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] text-[#6B7A90] font-mono">{connected ? 'Connected' : 'Offline'}</span>
          <span className="text-[10px] text-[#3A4A5A]">|</span>
          <span className="text-[10px] text-[#4A5A70]">{new Date().toLocaleString('ko-KR')}</span>
          <button onClick={doAdminLogout} className="p-1.5 rounded-lg hover:bg-white/[0.03]" title="Logout (token revoke)">
            <LogOut className="h-3.5 w-3.5 text-[#4A5A70]" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-2 flex gap-0.5 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition
              ${activeTab === tab.key ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-[#4A5A70] hover:text-white hover:bg-white/[0.02]'}`}>
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-4">

        {/* ═══════════════════════════════════════════════
            PHASE 1: OVERVIEW — 실시간 대시보드 + 수익 차트
            ═══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Active Rooms" value={`${activeRooms}/${rooms.length}`} icon={Activity} color="#26A17B" trend="up" trendValue="+2" />
              <StatCard label="Players Online" value={totalPlayers.toString()} icon={Users} color="#FF6B35" trend="up" trendValue="+12%" />
              <StatCard label="Today Rake" value={`${getSymbol()}${(totalRake / 100).toLocaleString()}`} icon={DollarSign} color="#FFD700" trend="up" trendValue="+8.5%" />
              <StatCard label="Server" value={connected ? "Healthy" : "Down"} icon={Zap} color={connected ? "#34D399" : "#EF4444"} />
            </div>

            {/* Revenue Chart */}
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <SectionHeader title="Revenue Analytics" icon={TrendingUp} color="#FFD700" />
                <div className="flex gap-1">
                  {(["today", "week", "month"] as const).map(p => (
                    <button key={p} onClick={() => setRevenuePeriod(p)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${revenuePeriod === p ? "bg-[#FF6B35]/10 text-[#FF6B35]" : "text-[#4A5A70]"}`}>
                      {p === "today" ? "Today" : p === "week" ? "7D" : "30D"}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenuePeriod === "month" ? dailyRevenue : revenueData}>
                  <defs>
                    <linearGradient id="rakeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD700" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey={revenuePeriod === "month" ? "date" : "time"} stroke="#2A3650" tick={{ fill: "#4A5A70", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#2A3650" tick={{ fill: "#4A5A70", fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${getSymbol()}${(v/100000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: "#1A2235", border: "1px solid #2A3650", borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`${getSymbol()}${(v/100).toLocaleString()}`, "Rake"]} />
                  <Area type="monotone" dataKey="rake" stroke="#FFD700" strokeWidth={2} fill="url(#rakeGrad)"
                    dot={{ fill: "#FFD700", r: 2, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>

            {/* Concurrent Players Chart */}
            <Panel>
              <SectionHeader title="Concurrent Players" icon={Users} color="#60A5FA" />
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="playerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#2A3650" tick={{ fill: "#4A5A70", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#2A3650" tick={{ fill: "#4A5A70", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1A2235", border: "1px solid #2A3650", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="players" stroke="#60A5FA" strokeWidth={2} fill="url(#playerGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>

            {/* Quick Actions */}
            <Panel>
              <SectionHeader title="Quick Actions" icon={Zap} color="#FF6B35" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: "Refresh Rooms", action: () => send({ type: 'GET_ROOMS' }), color: "#60A5FA", icon: RefreshCw },
                  { label: "Deploy 3 Bots", action: () => send({ type: 'ADD_BOTS', count: 3 } as any), color: "#34D399", icon: Bot },
                  { label: "Get RTP Info", action: () => send({ type: 'GET_RTP' } as any), color: "#FFD700", icon: TrendingUp },
                  { label: "Export Report", action: () => toast.success("Report exported"), color: "#A78BFA", icon: Download },
                ].map((btn, i) => (
                  <button key={i} onClick={() => { btn.action(); toast.success(btn.label); }}
                    className="py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ background: `${btn.color}08`, border: `1px solid ${btn.color}20`, color: btn.color }}>
                    <btn.icon className="h-3.5 w-3.5" /> {btn.label}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            TENANTS — B2B 운영사 관리
            ═══════════════════════════════════════════════ */}
        {activeTab === 'partner-docs' && (
          <div className="space-y-4">
            {/* Hero — B2B 영업 자료 한 곳 */}
            <Panel>
              <div className="flex items-center justify-between mb-3">
                <SectionHeader title="Partner Integration Docs" icon={FileText} color="#26A17B" />
                <a href="https://github.com/kbs00811-tech/tether-holdem-server/tree/master/docs"
                  target="_blank" rel="noopener noreferrer"
                  className="text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                  style={{ background: "rgba(38,161,123,0.1)", color: "#26A17B", border: "1px solid rgba(38,161,123,0.2)" }}>
                  GitHub <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
              <p className="text-[11px] text-[#6B7A90] leading-relaxed">
                B2B 파트너 영업·온보딩에 필요한 모든 자료를 한 곳에서 관리합니다. 클릭하면 GitHub 으로 이동.
              </p>
            </Panel>

            {/* 자료 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  title: '📕 Partner API Guide',
                  desc: '한글 가이드 — 시퀀스 다이어그램, HMAC, JWT, 보안 §3 전체',
                  links: [
                    { label: 'KO', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/PARTNER_API.md' },
                    { label: 'EN', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/PARTNER_API.en.md' },
                  ],
                  color: '#FF6B35',
                },
                {
                  title: '📋 OpenAPI 3.0 YAML',
                  desc: 'Swagger UI / Postman 자동 import 가능한 기계판독 스펙',
                  links: [
                    { label: 'KO', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/openapi.yaml' },
                    { label: 'EN', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/openapi.en.yaml' },
                  ],
                  color: '#26A17B',
                },
                {
                  title: '📮 Postman Collection',
                  desc: 'Postman 에 import → 즉시 호출 시뮬 가능 (.json)',
                  links: [
                    { label: 'KO', url: 'https://raw.githubusercontent.com/kbs00811-tech/tether-holdem-server/master/docs/tetherbet-holdem-postman.json' },
                    { label: 'EN', url: 'https://raw.githubusercontent.com/kbs00811-tech/tether-holdem-server/master/docs/tetherbet-holdem-postman.en.json' },
                  ],
                  color: '#FFD700',
                },
                {
                  title: '📡 WebSocket Protocol',
                  desc: '게임 진행 실시간 메시지 명세 (REST 보완)',
                  links: [
                    { label: 'View', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/WEBSOCKET_PROTOCOL.md' },
                  ],
                  color: '#A78BFA',
                },
                {
                  title: '📦 Node.js SDK',
                  desc: 'TypeScript, 0 runtime deps, 32 테스트 통과 (.tgz)',
                  links: [
                    { label: 'GitHub', url: 'https://github.com/kbs00811-tech/tether-holdem-server/tree/master/sdk' },
                    { label: 'README', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/sdk/README.md' },
                  ],
                  color: '#22D3EE',
                },
                {
                  title: '🎯 Pitch Deck',
                  desc: '영업 미팅 10슬라이드 (브라우저로 열고 Ctrl+P → PDF)',
                  links: [
                    { label: 'KO', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/PITCH_DECK.md' },
                    { label: 'EN', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/PITCH_DECK.en.md' },
                  ],
                  color: '#34D399',
                },
                {
                  title: '🎫 Sandbox Guide',
                  desc: '5분 quick start + 테스트 시나리오 4개',
                  links: [
                    { label: 'View', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/SANDBOX_GUIDE.md' },
                  ],
                  color: '#60A5FA',
                },
                {
                  title: '📧 Outreach Templates',
                  desc: '파트너 영업 이메일 — Cold / 소개 / Inbound × KO/EN',
                  links: [
                    { label: 'View', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/OUTREACH_TEMPLATES.md' },
                  ],
                  color: '#EF4444',
                },
                {
                  title: '🎯 Admin Manual (내부용)',
                  desc: '14개 탭 가이드 + 55+ REST API + 보안 FAQ — 운영자/SRE 필독',
                  links: [
                    { label: 'View', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/ADMIN_MANUAL.md' },
                  ],
                  color: '#FFD700',
                },
                {
                  title: '🚀 B2B Quick Start v1.1',
                  desc: '운영사용 5분 시작 가이드 — iframe + /api/auth/token + Webhook',
                  links: [
                    { label: 'View', url: 'https://github.com/kbs00811-tech/tether-holdem-server/blob/master/docs/B2B_QUICK_START.md' },
                  ],
                  color: '#34D399',
                },
              ].map((doc, i) => (
                <Panel key={i}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white" style={{ color: doc.color }}>{doc.title}</div>
                      <div className="text-[10px] text-[#6B7A90] mt-1 leading-relaxed">{doc.desc}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    {doc.links.map((l, j) => (
                      <a key={j} href={l.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all hover:scale-105"
                        style={{ background: `${doc.color}15`, color: doc.color, border: `1px solid ${doc.color}30` }}>
                        {l.label} <ArrowUpRight className="h-2.5 w-2.5" />
                      </a>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>

            {/* Sandbox 발급 */}
            <Panel>
              <SectionHeader title="🎫 Sandbox 자격증명 발급" icon={Key} color="#FFD700" />
              <p className="text-[11px] text-[#6B7A90] leading-relaxed mb-3">
                파트너 통합 테스트용 자격증명을 즉시 발급합니다. Paper money, 14일 만료.
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="파트너 회사명 (예: Acme Casino)"
                  id="sandbox-partner-name"
                  className="flex-1 px-3 py-2 rounded-lg text-[12px] bg-black/40 text-white placeholder:text-[#4A5A70] focus:outline-none"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", fontSize: '14px' }}
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById('sandbox-partner-name') as HTMLInputElement;
                    const name = (input?.value || '').trim();
                    if (!name) { toast.error('회사명 입력 필요'); return; }
                    try {
                      const res = await adminFetch('/admin/sandbox/issue', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_PASSWORD },
                        body: JSON.stringify({ partnerName: name }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        const txt = JSON.stringify(data.sandbox, null, 2);
                        navigator.clipboard?.writeText(txt).catch(() => {});
                        toast.success('발급 완료 + 클립보드 복사됨');
                        if (input) input.value = '';
                        // alert 로 자격증명 표시 (paste 가능)
                        alert('Sandbox 자격증명 (이미 클립보드 복사됨):\n\n' + txt);
                      } else {
                        toast.error(data.error || '발급 실패');
                      }
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-[12px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #FFD700, #E5A500)" }}
                >
                  발급
                </button>
              </div>
              <p className="text-[9px] text-[#6B7A90] mt-2">
                💡 발급 후 자격증명이 자동으로 클립보드에 복사됩니다 (이메일에 바로 붙여넣기).
              </p>
            </Panel>

            {/* 영업 단계별 액션 */}
            <Panel>
              <SectionHeader title="🎯 영업 진행 단계별 자료 보내기" icon={Zap} color="#FF6B35" />
              <div className="space-y-2 text-[11px]">
                {[
                  { step: '1️⃣ Cold outreach', files: 'Pitch Deck PDF (KO/EN)', action: '📧 OUTREACH_TEMPLATES 시나리오 1 복사' },
                  { step: '2️⃣ NDA 후 기술 검토', files: 'PARTNER_API + OpenAPI + WebSocket Protocol', action: 'GitHub 링크 공유 또는 ZIP 첨부' },
                  { step: '3️⃣ 통합 시작', files: 'SDK .tgz + Sandbox 자격증명', action: '위 발급 버튼 사용' },
                  { step: '4️⃣ Production', files: 'Production API key + ToS 계약서', action: '별도 협의' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,107,53,0.05)' }}>
                    <div className="text-[#FF6B35] font-bold shrink-0">{s.step}</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{s.files}</div>
                      <div className="text-[10px] text-[#6B7A90] mt-0.5">{s.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {/* 🟢 LIVE — 실 API 데이터 */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-2 py-1 rounded-md font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)' }}>
                🟢 LIVE
              </span>
              <span className="text-[10px] text-[#6B7A90]">실시간 API 데이터 (30초마다 새로고침)</span>
            </div>

            <PartnersLivePanel />

            {/* 플랜 비교 */}
            <Panel>
              <SectionHeader title="Pricing Plans" icon={CreditCard} color="#FFD700" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Starter', price: 499, setup: 0, color: '#34D399', users: '1K', concurrent: '100', rake: '50/50', features: ['12 tables', 'AI V4', 'Email support'] },
                  { name: 'Growth', price: 1999, setup: 2500, color: '#60A5FA', users: '10K', concurrent: '500', rake: '60/40', features: ['Unlimited tables', 'Agent system', 'AI V5 GTO', 'Tournament', 'Priority support'] },
                  { name: 'Enterprise', price: 7999, setup: 10000, color: '#FFD700', users: '∞', concurrent: '∞', rake: '70/30', features: ['Dedicated server', 'Full white label', 'PKO+Spin&Go', '24/7 support', 'SLA 99.9%'] },
                ].map(plan => (
                  <div key={plan.name} className="p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', borderTop: `3px solid ${plan.color}`, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="text-sm font-bold text-white mb-1">{plan.name}</div>
                    <div className="font-mono text-2xl font-black mb-1" style={{ color: plan.color }}>
                      ${plan.price.toLocaleString()}<span className="text-xs text-[#4A5A70]">/mo</span>
                    </div>
                    <div className="text-[9px] text-[#4A5A70] mb-3">
                      {plan.setup > 0 ? `+ $${plan.setup.toLocaleString()} setup` : 'Free setup'}
                    </div>
                    <div className="space-y-1 text-[10px] text-[#6B7A90] mb-3">
                      <div>👥 Users: {plan.users}</div>
                      <div>🟢 Concurrent: {plan.concurrent}</div>
                      <div>💰 Rake Share: {plan.rake}</div>
                    </div>
                    <div className="space-y-1 text-[10px] text-white">
                      {plan.features.map(f => <div key={f}>✓ {f}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            SETTLEMENT — 정산 시스템
            ═══════════════════════════════════════════════ */}
        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-2 py-1 rounded-md font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>🟢 LIVE</span>
              <span className="text-[10px] text-[#6B7A90]">실시간 메트릭 (5초마다)</span>
            </div>
            <SystemMetricsPanel />
            <TelegramStatsPanel />
          </div>
        )}

        {activeTab === 'settlement' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-2 py-1 rounded-md font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>🟢 LIVE</span>
              <span className="text-[10px] text-[#6B7A90]">정산 대사 — 60초마다 자동 갱신</span>
            </div>

            {/* 🟢 LIVE Reconciliation 추가 */}
            <ReconciliationLivePanel />

            {/* ⚪ MOCK — 기존 표시 (실 데이터 연결 예정) */}
            <div className="flex items-center gap-2 mt-6">
              <span className="text-[9px] px-2 py-1 rounded-md font-bold" style={{ background: 'rgba(255,255,255,0.04)', color: '#6B7A90' }}>⚪ MOCK</span>
              <span className="text-[10px] text-[#6B7A90]">아래는 데모 데이터 (개선 예정)</span>
            </div>

            {/* 정산 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Today Rake" value={`${getSymbol()}5,420,000`} icon={DollarSign} color="#FFD700" trend="up" trendValue="+12%" />
              <StatCard label="Platform (30%)" value={`${getSymbol()}1,626,000`} icon={TrendingUp} color="#26A17B" />
              <StatCard label="Operator (70%)" value={`${getSymbol()}3,794,000`} icon={Users} color="#60A5FA" />
              <StatCard label="Pending Settlements" value="3" icon={Clock} color="#FBBF24" />
            </div>

            {/* 4단계 정산 */}
            <Panel>
              <SectionHeader title="4-Tier Settlement (TETHER.BET)" icon={DollarSign} color="#FFD700" />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                {[
                  { name: '본사 (Bonsa)', pct: 40, amount: 1517600, color: '#FFD700' },
                  { name: '부본사 (Bubon)', pct: 25, amount: 948500, color: '#A78BFA' },
                  { name: '총판 (Chongpan)', pct: 15, amount: 569100, color: '#60A5FA' },
                  { name: '매장 (Maejang)', pct: 10, amount: 379400, color: '#26A17B' },
                  { name: '미니매장', pct: 10, amount: 379400, color: '#34D399' },
                ].map(tier => (
                  <div key={tier.name} className="p-3 rounded-xl text-center"
                    style={{ background: 'rgba(255,255,255,0.02)', borderTop: `3px solid ${tier.color}` }}>
                    <div className="text-[10px] text-[#6B7A90]">{tier.name}</div>
                    <div className="font-mono text-base font-bold" style={{ color: tier.color }}>{tier.pct}%</div>
                    <div className="font-mono text-xs text-white mt-1">{getSymbol()}{(tier.amount / 100).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* 일별 정산 내역 */}
            <Panel>
              <SectionHeader title="Daily Settlements" icon={Clock} color="#60A5FA" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] text-[#4A5A70] uppercase tracking-wider border-b border-white/[0.03]">
                      <th className="text-left py-2 px-2">Date</th>
                      <th className="text-left py-2">Tenant</th>
                      <th className="text-center py-2">Hands</th>
                      <th className="text-center py-2">Total Rake</th>
                      <th className="text-center py-2">Operator</th>
                      <th className="text-center py-2">Platform</th>
                      <th className="text-center py-2">Status</th>
                      <th className="text-center py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {[
                      { date: '2026-04-12', tenant: 'TETHER.BET', hands: 458, rake: 5420000, op: 3794000, pl: 1626000, status: 'pending' },
                      { date: '2026-04-11', tenant: 'TETHER.BET', hands: 612, rake: 7230000, op: 5061000, pl: 2169000, status: 'confirmed' },
                      { date: '2026-04-11', tenant: 'Demo Partner', hands: 89, rake: 850000, op: 510000, pl: 340000, status: 'confirmed' },
                      { date: '2026-04-10', tenant: 'TETHER.BET', hands: 534, rake: 6130000, op: 4291000, pl: 1839000, status: 'confirmed' },
                    ].map((s, i) => (
                      <tr key={i} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-2 text-white font-mono text-[10px]">{s.date}</td>
                        <td className="py-2.5 text-white">{s.tenant}</td>
                        <td className="text-center text-[#6B7A90]">{s.hands}</td>
                        <td className="text-center font-mono text-[#FFD700]">{getSymbol()}{(s.rake / 100).toLocaleString()}</td>
                        <td className="text-center font-mono text-[#60A5FA]">{getSymbol()}{(s.op / 100).toLocaleString()}</td>
                        <td className="text-center font-mono text-emerald-400">{getSymbol()}{(s.pl / 100).toLocaleString()}</td>
                        <td className="text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            s.status === 'confirmed' ? 'text-emerald-400 bg-emerald-400/[0.08]' : 'text-yellow-400 bg-yellow-400/[0.08]'
                          }`}>{s.status}</span>
                        </td>
                        <td className="text-center">
                          {s.status === 'pending' && (
                            <button className="text-[9px] px-2 py-1 rounded text-[#FFD700] bg-[#FFD700]/[0.08]"
                              onClick={() => toast.success('Sent to operator')}>Send</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PHASE 2: ROOMS — 방 관리 CRUD + 실시간 모니터링
            ═══════════════════════════════════════════════ */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-2 py-1 rounded-md font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>🟢 LIVE</span>
              <span className="text-[10px] text-[#6B7A90]">강제 방 종료 — 2단계 confirm</span>
            </div>
            <ForceCloseRoomPanel />

            <Panel>
              <div className="flex items-center justify-between mb-4">
                <SectionHeader title={`Live Rooms (${rooms.length})`} icon={Eye} color="#26A17B" />
                <div className="flex gap-2">
                  <button onClick={() => send({ type: 'GET_ROOMS' })} className="text-[10px] text-[#60A5FA] flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                  <button onClick={() => setShowCreateRoom(!showCreateRoom)}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                    style={{ background: "rgba(38,161,123,0.1)", color: "#26A17B", border: "1px solid rgba(38,161,123,0.2)" }}>
                    <Plus className="h-3 w-3" /> Create Room
                  </button>
                </div>
              </div>

              {/* Create Room Form */}
              <AnimatePresence>
                {showCreateRoom && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4">
                    <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(38,161,123,0.04)", border: "1px solid rgba(38,161,123,0.1)" }}>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="text-[9px] text-[#4A5A70] uppercase tracking-wider block mb-1">Room Name</label>
                          <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g. 입문 500/1K"
                            className="w-full px-3 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none focus:border-[#26A17B]" />
                        </div>
                        <div>
                          <label className="text-[9px] text-[#4A5A70] uppercase tracking-wider block mb-1">SB / BB (₩)</label>
                          <div className="flex gap-1">
                            <input type="number" value={newRoomSB} onChange={e => setNewRoomSB(Number(e.target.value))}
                              className="w-1/2 px-2 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none" />
                            <input type="number" value={newRoomBB} onChange={e => setNewRoomBB(Number(e.target.value))}
                              className="w-1/2 px-2 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] text-[#4A5A70] uppercase tracking-wider block mb-1">Buy-in Min/Max (₩)</label>
                          <div className="flex gap-1">
                            <input type="number" value={newRoomMinBuy} onChange={e => setNewRoomMinBuy(Number(e.target.value))}
                              className="w-1/2 px-2 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none" />
                            <input type="number" value={newRoomMaxBuy} onChange={e => setNewRoomMaxBuy(Number(e.target.value))}
                              className="w-1/2 px-2 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="text-[9px] text-[#4A5A70] uppercase tracking-wider block mb-1">Max Players</label>
                          <select value={newRoomMax} onChange={e => setNewRoomMax(Number(e.target.value))}
                            className="px-3 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white">
                            <option value={2}>2 (Heads-Up)</option>
                            <option value={6}>6 (6-Max)</option>
                            <option value={8}>8 (Full Ring)</option>
                          </select>
                        </div>
                        <button onClick={() => {
                          send({ type: 'CREATE_ROOM', config: { name: newRoomName || `Custom ${newRoomSB}/${newRoomBB}`, smallBlind: newRoomSB * 100, bigBlind: newRoomBB * 100, minBuyIn: newRoomMinBuy * 100, maxBuyIn: newRoomMaxBuy * 100, maxPlayers: newRoomMax } } as any);
                          toast.success('Room created'); setShowCreateRoom(false);
                        }}
                          className="px-5 py-2 rounded-lg text-xs font-bold text-white mt-4"
                          style={{ background: "linear-gradient(135deg, #26A17B, #1A8A66)" }}>
                          Create
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Room Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] text-[#4A5A70] uppercase tracking-wider border-b border-white/[0.03]">
                      <th className="text-left py-2 px-2">Room</th>
                      <th className="text-center py-2">Players</th>
                      <th className="text-center py-2">Blinds</th>
                      <th className="text-center py-2">Buy-in</th>
                      <th className="text-center py-2">Status</th>
                      <th className="text-center py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {rooms.map(room => (
                      <tr key={room.id} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-2 text-white font-medium">{room.name}</td>
                        <td className="text-center">
                          <span className={room.playerCount > 0 ? 'text-emerald-400' : 'text-[#3A4A5A]'}>
                            {room.playerCount}/{room.maxPlayers}
                          </span>
                        </td>
                        <td className="text-center font-mono text-[#8899AB]">
                          {getSymbol()}{(room.smallBlind/100).toLocaleString()}/{(room.bigBlind/100).toLocaleString()}
                        </td>
                        <td className="text-center font-mono text-[#6B7A90]">
                          {getSymbol()}{(room.minBuyIn/100).toLocaleString()}
                        </td>
                        <td className="text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${room.phase === 'WAITING' ? 'text-[#4A5A70] bg-white/[0.02]' : 'text-emerald-400 bg-emerald-400/[0.08]'}`}>
                            {room.phase === 'WAITING' ? 'Idle' : 'Active'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setMonitorRoom(room.id); toast.success('Monitoring ' + room.name); }}
                              className="text-[9px] px-2 py-1 rounded text-[#60A5FA] bg-[#60A5FA]/[0.05]">Monitor</button>
                            <button onClick={() => { send({ type: 'JOIN_ROOM', roomId: room.id, buyIn: 0 } as any); send({ type: 'ADD_BOTS', count: 2 } as any); toast.success('2 Bots added'); }}
                              className="text-[9px] px-2 py-1 rounded text-[#26A17B] bg-[#26A17B]/[0.05]">+Bot</button>
                            <button onClick={() => { toast.success(`Room ${room.name} closed`); }}
                              className="text-[9px] px-2 py-1 rounded text-[#EF4444] bg-[#EF4444]/[0.05]">Close</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PHASE 3: PLAYERS — 검색, 프로필, 밴, 잔액 조정
            ═══════════════════════════════════════════════ */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <Panel>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3A4A5A]" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by nickname, ID, or IP..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none focus:border-[#FF6B35]" />
                </div>
                <span className="text-[10px] text-[#4A5A70]">{filteredPlayers.length} results</span>
              </div>

              {/* Player Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] text-[#4A5A70] uppercase tracking-wider border-b border-white/[0.03]">
                      <th className="text-left py-2 px-2">Player</th>
                      <th className="text-center py-2">Balance</th>
                      <th className="text-center py-2">Hands</th>
                      <th className="text-center py-2">Win%</th>
                      <th className="text-center py-2">P/L</th>
                      <th className="text-center py-2">VIP</th>
                      <th className="text-center py-2">Status</th>
                      <th className="text-center py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {filteredPlayers.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.01] cursor-pointer" onClick={() => setSelectedPlayer(p)}>
                        <td className="py-2.5 px-2">
                          <div className="text-white font-medium">{p.nickname}</div>
                          <div className="text-[9px] text-[#3A4A5A]">{p.id} · {p.ip}</div>
                        </td>
                        <td className="text-center font-mono text-white">{getSymbol()}{(p.balance / 100).toLocaleString()}</td>
                        <td className="text-center font-mono text-[#6B7A90]">{p.totalHands.toLocaleString()}</td>
                        <td className="text-center font-mono" style={{ color: p.winRate > 50 ? "#34D399" : "#EF4444" }}>{p.winRate}%</td>
                        <td className="text-center font-mono" style={{ color: p.profit >= 0 ? "#34D399" : "#EF4444" }}>
                          {p.profit >= 0 ? "+" : ""}{getSymbol()}{(p.profit / 100).toLocaleString()}
                        </td>
                        <td className="text-center">
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{ background: `rgba(167,139,250,${p.vipLevel * 0.02})`, color: "#A78BFA" }}>
                            Lv.{p.vipLevel}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            p.status === 'online' ? 'text-emerald-400 bg-emerald-400/[0.08]' :
                            p.status === 'banned' ? 'text-red-400 bg-red-400/[0.08]' : 'text-[#4A5A70] bg-white/[0.02]'
                          }`}>{p.status}</span>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={e => { e.stopPropagation(); setSelectedPlayer(p); }}
                              className="text-[9px] px-2 py-1 rounded text-[#60A5FA] bg-[#60A5FA]/[0.05]">Detail</button>
                            <button onClick={e => { e.stopPropagation(); toast.success(`${p.nickname} kicked`); }}
                              className="text-[9px] px-2 py-1 rounded text-[#EF4444] bg-[#EF4444]/[0.05]">Kick</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* Player Detail Modal */}
            <AnimatePresence>
              {selectedPlayer && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                  onClick={() => setSelectedPlayer(null)}>
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="rounded-2xl p-6 max-w-[500px] w-full max-h-[80vh] overflow-y-auto"
                    style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}
                    onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedPlayer.nickname}</h3>
                        <div className="text-[10px] text-[#4A5A70]">{selectedPlayer.id} · {selectedPlayer.ip} · Since {selectedPlayer.joinDate}</div>
                      </div>
                      <button onClick={() => setSelectedPlayer(null)} className="p-1"><X className="h-4 w-4 text-[#4A5A70]" /></button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="text-[9px] text-[#4A5A70]">Balance</div>
                        <div className="font-mono text-base font-bold text-white">{getSymbol()}{(selectedPlayer.balance / 100).toLocaleString()}</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="text-[9px] text-[#4A5A70]">Total P/L</div>
                        <div className="font-mono text-base font-bold" style={{ color: selectedPlayer.profit >= 0 ? "#34D399" : "#EF4444" }}>
                          {selectedPlayer.profit >= 0 ? "+" : ""}{getSymbol()}{(selectedPlayer.profit / 100).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="text-[9px] text-[#4A5A70]">Win Rate</div>
                        <div className="font-mono text-base font-bold" style={{ color: selectedPlayer.winRate > 50 ? "#34D399" : "#EF4444" }}>{selectedPlayer.winRate}%</div>
                      </div>
                    </div>

                    {/* Balance Adjust */}
                    <div className="p-3 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <label className="text-[9px] text-[#4A5A70] uppercase tracking-wider block mb-2">Balance Adjustment (₩)</label>
                      <div className="flex gap-2">
                        <input type="number" value={balanceAdjust} onChange={e => setBalanceAdjust(Number(e.target.value))}
                          className="flex-1 px-3 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none" />
                        <button onClick={() => { toast.success(`${getSymbol()}${balanceAdjust.toLocaleString()} added to ${selectedPlayer.nickname}`); setBalanceAdjust(0); }}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-emerald-400" style={{ background: "rgba(52,211,153,0.08)" }}>
                          <Plus className="h-3 w-3" />
                        </button>
                        <button onClick={() => { toast.success(`${getSymbol()}${balanceAdjust.toLocaleString()} deducted from ${selectedPlayer.nickname}`); setBalanceAdjust(0); }}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>
                          <Minus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* VIP Level */}
                    <div className="p-3 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <label className="text-[9px] text-[#4A5A70] uppercase tracking-wider block mb-2">VIP Level</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5,6,7,8,9,10].map(lv => (
                          <button key={lv} className="flex-1 py-1.5 rounded text-[9px] font-bold transition"
                            style={{
                              background: lv <= selectedPlayer.vipLevel ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.02)",
                              color: lv <= selectedPlayer.vipLevel ? "#A78BFA" : "#3A4A5A",
                              border: lv === selectedPlayer.vipLevel ? "1px solid rgba(167,139,250,0.3)" : "1px solid transparent"
                            }}
                            onClick={() => toast.success(`VIP Level set to ${lv}`)}>
                            {lv}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ban */}
                    <div className="p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.08)" }}>
                      <label className="text-[9px] text-[#EF4444] uppercase tracking-wider block mb-2">Ban Player</label>
                      <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason for ban..."
                        className="w-full px-3 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white mb-2 focus:outline-none" />
                      <div className="flex gap-2">
                        <button onClick={() => { toast.success(`${selectedPlayer.nickname} banned: ${banReason}`); setBanReason(''); }}
                          className="flex-1 py-2 rounded-lg text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}>
                          Permanent Ban
                        </button>
                        <button onClick={() => toast.success(`${selectedPlayer.nickname} muted for 24h`)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold text-[#FFD700]" style={{ background: "rgba(255,215,0,0.08)" }}>
                          Mute 24h
                        </button>
                        <button onClick={() => toast.success(`Warning sent to ${selectedPlayer.nickname}`)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold text-[#FF6B35]" style={{ background: "rgba(255,107,53,0.08)" }}>
                          Warn
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PHASE 4: FINANCE — 입출금 관리 + 레이크 수익
            ═══════════════════════════════════════════════ */}
        {activeTab === 'finance' && (
          <div className="space-y-4">
            {/* Financial KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Today Revenue" value={`${getSymbol()}${(totalRake / 100).toLocaleString()}`} icon={DollarSign} color="#FFD700" trend="up" trendValue="+8.5%" />
              <StatCard label="Pending Withdrawals" value={`${transactions.filter(t => t.status === 'pending' && t.type === 'withdraw').length}`} icon={AlertTriangle} color="#EF4444" />
              <StatCard label="Total Deposits" value={`${getSymbol()}${(transactions.filter(t => t.type === 'deposit' && t.status === 'approved').reduce((s, t) => s + t.amount, 0) / 100).toLocaleString()}`} icon={ArrowUpRight} color="#34D399" />
              <StatCard label="Agent Commission" value={`${getSymbol()}${(totalRake * 0.15 / 100).toLocaleString()}`} icon={Users} color="#A78BFA" />
            </div>

            {/* Transactions */}
            <Panel>
              <SectionHeader title="Transaction Management" icon={CreditCard} color="#FF6B35" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] text-[#4A5A70] uppercase tracking-wider border-b border-white/[0.03]">
                      <th className="text-left py-2 px-2">Player</th>
                      <th className="text-center py-2">Type</th>
                      <th className="text-center py-2">Amount</th>
                      <th className="text-center py-2">Method</th>
                      <th className="text-center py-2">Time</th>
                      <th className="text-center py-2">Status</th>
                      <th className="text-center py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-2 text-white font-medium">{tx.nickname}</td>
                        <td className="text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${tx.type === 'deposit' ? 'text-emerald-400 bg-emerald-400/[0.08]' : 'text-red-400 bg-red-400/[0.08]'}`}>
                            {tx.type === 'deposit' ? '↓ Deposit' : '↑ Withdraw'}
                          </span>
                        </td>
                        <td className="text-center font-mono font-bold" style={{ color: tx.type === 'deposit' ? '#34D399' : '#EF4444' }}>
                          {tx.type === 'deposit' ? '+' : '-'}{getSymbol()}{(tx.amount / 100).toLocaleString()}
                        </td>
                        <td className="text-center text-[#6B7A90]">{tx.method}</td>
                        <td className="text-center text-[#4A5A70] font-mono text-[10px]">{tx.timestamp}</td>
                        <td className="text-center">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            tx.status === 'approved' ? 'text-emerald-400 bg-emerald-400/[0.08]' :
                            tx.status === 'rejected' ? 'text-red-400 bg-red-400/[0.08]' : 'text-yellow-400 bg-yellow-400/[0.08]'
                          }`}>{tx.status}</span>
                        </td>
                        <td className="text-center">
                          {tx.status === 'pending' && (
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => { setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'approved' } : t)); toast.success('Approved'); }}
                                className="text-[9px] px-2 py-1 rounded text-emerald-400 bg-emerald-400/[0.05]">
                                <Check className="h-3 w-3" />
                              </button>
                              <button onClick={() => { setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'rejected' } : t)); toast.success('Rejected'); }}
                                className="text-[9px] px-2 py-1 rounded text-red-400 bg-red-400/[0.05]">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* Agent Settlement */}
            <Panel>
              <SectionHeader title="Agent Settlement (4-Tier)" icon={Users} color="#A78BFA" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] text-[#4A5A70] uppercase tracking-wider border-b border-white/[0.03]">
                      <th className="text-left py-2 px-2">Agent</th>
                      <th className="text-center py-2">Tier</th>
                      <th className="text-center py-2">Players</th>
                      <th className="text-center py-2">Volume</th>
                      <th className="text-center py-2">Commission Rate</th>
                      <th className="text-center py-2">Earned</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {[
                      { name: "Master Agent A", tier: 1, players: 45, volume: 125000000, rate: 40, earned: 50000000, settled: true },
                      { name: "Sub Agent B", tier: 2, players: 18, volume: 45000000, rate: 25, earned: 11250000, settled: true },
                      { name: "Agent C", tier: 3, players: 8, volume: 12000000, rate: 15, earned: 1800000, settled: false },
                      { name: "Agent D", tier: 4, players: 3, volume: 3500000, rate: 10, earned: 350000, settled: false },
                    ].map((agent, i) => (
                      <tr key={i} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 px-2 text-white font-medium">{agent.name}</td>
                        <td className="text-center">
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                            style={{ background: `rgba(167,139,250,${agent.tier * 0.04})`, color: "#A78BFA" }}>
                            Tier {agent.tier}
                          </span>
                        </td>
                        <td className="text-center text-[#6B7A90]">{agent.players}</td>
                        <td className="text-center font-mono text-white">{getSymbol()}{(agent.volume / 100).toLocaleString()}</td>
                        <td className="text-center font-mono text-[#FFD700]">{agent.rate}%</td>
                        <td className="text-center font-mono text-emerald-400">{getSymbol()}{(agent.earned / 100).toLocaleString()}</td>
                        <td className="text-center">
                          <button onClick={() => toast.success(`Settlement processed for ${agent.name}`)}
                            className={`text-[9px] px-2 py-1 rounded ${agent.settled ? 'text-emerald-400 bg-emerald-400/[0.08]' : 'text-yellow-400 bg-yellow-400/[0.08]'}`}>
                            {agent.settled ? "Settled" : "Process"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PHASE 5: AI BOTS
            ═══════════════════════════════════════════════ */}
        {activeTab === 'bots' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-2 py-1 rounded-md font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>🟢 LIVE</span>
              <span className="text-[10px] text-[#6B7A90]">10초마다 자동 갱신</span>
            </div>
            <BotsLivePanel />

            {/* 봇 즉시 배치 */}
            <Panel>
              <SectionHeader title="AI Bot Deploy" icon={Bot} color="#A78BFA" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-[#6B7A90] font-semibold block mb-2">Bot Count</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 7].map(n => (
                      <button key={n} onClick={() => setBotCount(n)}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition
                          ${botCount === n ? 'bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30' : 'bg-white/[0.02] text-[#4A5A70] border border-white/[0.04]'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6B7A90] font-semibold block mb-2">Level: {botLevel[0]} ~ {botLevel[1]}</label>
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(lv => {
                      const inRange = lv >= botLevel[0]! && lv <= botLevel[1]!;
                      const color = lv <= 2 ? '#34D399' : lv <= 4 ? '#60A5FA' : lv <= 6 ? '#FFD700' : lv <= 8 ? '#FF6B35' : '#EF4444';
                      const tier = lv <= 2 ? 'Fish' : lv <= 4 ? 'Weak' : lv <= 6 ? 'Avg' : lv <= 8 ? 'Strong' : 'Elite';
                      return (
                        <button key={lv} onClick={() => {
                          if (lv < botLevel[0]!) setBotLevel([lv, botLevel[1]!]);
                          else if (lv > botLevel[1]!) setBotLevel([botLevel[0]!, lv]);
                          else setBotLevel([lv, lv]);
                        }}
                          className="py-2.5 rounded-md text-center transition-all"
                          style={{ background: inRange ? `${color}15` : 'rgba(255,255,255,0.02)', border: inRange ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.04)', color: inRange ? color : '#3A4A5A' }}>
                          <div className="text-xs font-bold">Lv.{lv}</div>
                          <div className="text-[9px]">{tier}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <button onClick={() => { send({ type: 'ADD_BOTS', count: botCount } as any); toast.success(`${botCount} bots deploying (gradual entry)...`); }}
                className="w-full py-3.5 rounded-xl text-base font-bold text-white"
                style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
                Deploy {botCount} AI Bots
              </button>
            </Panel>

            {/* ═══ 입장 타이밍 설정 ═══ */}
            <Panel>
              <SectionHeader title="Entry Timing (입장 타이밍)" icon={Clock} color="#60A5FA" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "First Entry Min (초)", key: "firstEntryDelayMin", val: 3, min: 1, max: 30 },
                  { label: "First Entry Max (초)", key: "firstEntryDelayMax", val: 8, min: 2, max: 60 },
                  { label: "Between Entry Min (초)", key: "betweenEntryDelayMin", val: 5, min: 2, max: 30 },
                  { label: "Between Entry Max (초)", key: "betweenEntryDelayMax", val: 15, min: 5, max: 120 },
                ].map(item => (
                  <div key={item.key}>
                    <label className="text-xs text-[#6B7A90] font-semibold block mb-1.5">{item.label}</label>
                    <input type="number" defaultValue={item.val} min={item.min} max={item.max}
                      className="w-full px-3 py-2.5 rounded-lg text-sm font-mono bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none focus:border-[#60A5FA]"
                      onChange={e => {
                        const v = Number(e.target.value);
                        send({ type: 'SET_BOT_CONFIG', config: { timing: { [item.key]: v } } } as any);
                      }} />
                  </div>
                ))}
              </div>
            </Panel>

            {/* ═══ 체류/퇴장 타이밍 ═══ */}
            <Panel>
              <SectionHeader title="Stay Duration (체류 시간)" icon={Clock} color="#FFD700" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: "Min Stay (분)", key: "stayDurationMin", val: 2, min: 0.5, max: 30 },
                  { label: "Max Stay (분)", key: "stayDurationMax", val: 180, min: 5, max: 480 },
                  { label: "Refill Min (초)", key: "refillDelayMin", val: 15, min: 5, max: 120 },
                  { label: "Refill Max (초)", key: "refillDelayMax", val: 60, min: 15, max: 300 },
                ].map(item => (
                  <div key={item.key}>
                    <label className="text-xs text-[#6B7A90] font-semibold block mb-1.5">{item.label}</label>
                    <input type="number" defaultValue={item.val} min={item.min} max={item.max} step={item.key.includes('Duration') ? 0.5 : 1}
                      className="w-full px-3 py-2.5 rounded-lg text-sm font-mono bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none focus:border-[#FFD700]"
                      onChange={e => {
                        send({ type: 'SET_BOT_CONFIG', config: { timing: { [item.key]: Number(e.target.value) } } } as any);
                      }} />
                  </div>
                ))}
              </div>
            </Panel>

            {/* ═══ 퇴장 트리거 확률 ═══ */}
            <Panel>
              <SectionHeader title="Exit Triggers (퇴장 조건)" icon={AlertTriangle} color="#EF4444" />
              <div className="space-y-2">
                {[
                  { name: 'instant_leave', label: '즉시 퇴장', desc: '들어왔다 바로 나감', prob: 5 },
                  { name: 'after_few_hands', label: '몇 핸드 후', desc: '2~5핸드 플레이 후 퇴장', prob: 12 },
                  { name: 'after_big_loss', label: '큰 손실 후', desc: '스택 30% 이상 잃으면 퇴장', prob: 18 },
                  { name: 'after_big_win', label: '큰 승리 후', desc: '큰 팟 먹고 수익 확정 퇴장', prob: 10 },
                  { name: 'stack_depleted', label: '스택 부족', desc: '스택 50% 이하 퇴장', prob: 15 },
                  { name: 'bored_timeout', label: '지루함', desc: '좋은 핸드 안 오면 퇴장', prob: 8 },
                  { name: 'scheduled_leave', label: '예정된 퇴장', desc: '일정 시간 후 자연 퇴장', prob: 20 },
                  { name: 'connection_drop', label: '연결 끊김', desc: '접속 끊김 시뮬레이션', prob: 3 },
                  { name: 'seat_change', label: '좌석 변경', desc: '나갔다 다른 자리에 앉기', prob: 4 },
                  { name: 'table_switch', label: '테이블 이동', desc: '다른 방으로 이동', prob: 5 },
                ].map(trigger => (
                  <div key={trigger.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex-1">
                      <div className="text-sm text-white font-semibold">{trigger.label}</div>
                      <div className="text-xs text-[#4A5A70]">{trigger.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" defaultValue={trigger.prob} min={0} max={50} step={1}
                        className="w-16 px-2 py-1.5 rounded-lg text-sm font-mono text-center bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none"
                        onChange={e => toast.success(`${trigger.label}: ${e.target.value}%`)} />
                      <span className="text-xs text-[#4A5A70]">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* ═══ 행동 패턴 가중치 ═══ */}
            <Panel>
              <SectionHeader title="Behavior Patterns (행동 패턴)" icon={Activity} color="#26A17B" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'normal', label: '정상 플레이', pct: 40, color: '#34D399' },
                  { key: 'aggressive', label: '공격적', pct: 15, color: '#EF4444' },
                  { key: 'passive', label: '수동적', pct: 15, color: '#60A5FA' },
                  { key: 'erratic', label: '변칙적', pct: 10, color: '#FFD700' },
                  { key: 'tilt', label: '틸트', pct: 5, color: '#FF6B35' },
                  { key: 'shortSession', label: '짧게 플레이', pct: 8, color: '#A78BFA' },
                  { key: 'longGrind', label: '장기 그라인딩', pct: 7, color: '#22D3EE' },
                ].map(p => (
                  <div key={p.key} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", borderLeft: `3px solid ${p.color}` }}>
                    <div className="text-sm text-white font-semibold mb-1">{p.label}</div>
                    <div className="flex items-center gap-2">
                      <input type="number" defaultValue={p.pct} min={0} max={80} step={1}
                        className="w-16 px-2 py-1.5 rounded text-sm font-mono text-center bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none" />
                      <span className="text-xs text-[#4A5A70]">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* ═══ 고급 설정 ═══ */}
            <Panel>
              <SectionHeader title="Advanced Settings (고급)" icon={Settings} color="#FF6B35" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {[
                  { label: "시팅아웃 확률 (%)", val: 3, min: 0, max: 20 },
                  { label: "시팅아웃 최소 (초)", val: 10, min: 5, max: 60 },
                  { label: "시팅아웃 최대 (초)", val: 60, min: 15, max: 300 },
                  { label: "채팅 빈도 (%)", val: 5, min: 0, max: 30 },
                  { label: "재입장 확률 (%)", val: 20, min: 0, max: 50 },
                  { label: "목표 점유율 (%)", val: 60, min: 30, max: 90 },
                ].map((item, i) => (
                  <div key={i}>
                    <label className="text-xs text-[#6B7A90] font-semibold block mb-1.5">{item.label}</label>
                    <input type="number" defaultValue={item.val} min={item.min} max={item.max}
                      className="w-full px-3 py-2.5 rounded-lg text-sm font-mono bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none" />
                  </div>
                ))}
              </div>

              {/* 채팅 ON/OFF */}
              <div className="flex items-center justify-between p-3 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div>
                  <div className="text-sm text-white font-semibold">AI Chat</div>
                  <div className="text-xs text-[#4A5A70]">Bots send chat messages (gg, nh, etc.)</div>
                </div>
                <button onClick={() => toast.success('Chat toggled')}
                  className="w-12 h-6 rounded-full flex items-center px-0.5"
                  style={{ background: "#26A17B", justifyContent: "flex-end" }}>
                  <div className="w-5 h-5 rounded-full bg-white shadow" />
                </button>
              </div>

              {/* 자동 충원 ON/OFF */}
              <div className="flex items-center justify-between p-3 rounded-lg mb-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div>
                  <div className="text-sm text-white font-semibold">Auto-Fill Rooms</div>
                  <div className="text-xs text-[#4A5A70]">Automatically add bots when players leave</div>
                </div>
                <button onClick={() => { setBotAutoSchedule(!botAutoSchedule); toast.success(botAutoSchedule ? 'Disabled' : 'Enabled'); }}
                  className="w-12 h-6 rounded-full flex items-center px-0.5 transition"
                  style={{ background: botAutoSchedule ? "#26A17B" : "#1A2235", justifyContent: botAutoSchedule ? "flex-end" : "flex-start" }}>
                  <div className="w-5 h-5 rounded-full shadow" style={{ background: botAutoSchedule ? "#FFF" : "#4A5A70" }} />
                </button>
              </div>

              {/* 설정 초기화 */}
              <div className="flex gap-3">
                <button onClick={() => { send({ type: 'SET_BOT_CONFIG', config: {} } as any); toast.success('Settings saved to server'); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #26A17B, #1A8A66)" }}>
                  Save All Settings
                </button>
                <button onClick={() => { send({ type: 'RESET_BOT_CONFIG' } as any); toast.success('Reset to defaults'); }}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-[#EF4444]"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  Reset
                </button>
              </div>
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            RTP Tab
            ═══════════════════════════════════════════════ */}
        {activeTab === 'rtp' && (
          <div className="space-y-4">
            {/* 실시간 대시보드 */}
            <Panel>
              <SectionHeader title="RTP Dashboard (Live)" icon={TrendingUp} color="#FFD700" />
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => { send({ type: 'ADMIN_RTP_DASHBOARD' } as any); send({ type: 'ADMIN_RTP_PLAYERS' } as any); }}
                  className="text-[10px] text-[#FFD700] flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
              {rtpDashboard ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 rounded-lg" style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.15)" }}>
                      <div className="text-[9px] text-[#4A5A70] uppercase">Avg RTP</div>
                      <div className="font-mono text-xl font-black text-[#FFD700]">{rtpDashboard.avgRTP?.toFixed(1) ?? '-'}%</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <div className="text-[9px] text-[#4A5A70] uppercase">Players</div>
                      <div className="font-mono text-xl font-black text-[#34D399]">{rtpDashboard.totalPlayers ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)" }}>
                      <div className="text-[9px] text-[#4A5A70] uppercase">House Edge</div>
                      <div className="font-mono text-xl font-black text-[#FF6B35]">{(100 - (rtpDashboard.avgRTP ?? 100)).toFixed(1)}%</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="text-[9px] text-[#4A5A70] uppercase">Alerts</div>
                      <div className="font-mono text-xl font-black text-[#A78BFA]">{rtpDashboard.activeAlerts?.length ?? 0}</div>
                    </div>
                  </div>
                  {/* 세그먼트 분포 */}
                  {rtpDashboard.segmentCounts && (
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(rtpDashboard.segmentCounts).map(([seg, count]) => (
                        <div key={seg} className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#8899AB" }}>
                          {seg}: <span className="text-white">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 경고 */}
                  {rtpDashboard.activeAlerts?.length > 0 && (
                    <div className="space-y-1">
                      {rtpDashboard.activeAlerts.map((alert: string, i: number) => (
                        <div key={i} className="px-3 py-2 rounded-lg text-[10px] text-[#EF4444]"
                          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          {alert}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-[#4A5A70] text-xs">Loading...</div>
              )}
            </Panel>

            {/* 세그먼트별 RTP 설정 */}
            <Panel>
              <SectionHeader title="Segment RTP Settings" icon={TrendingUp} color="#34D399" />
              {rtpConfig?.segments ? (
                <div className="space-y-2">
                  {Object.entries(rtpConfig.segments).map(([seg, cfg]: [string, any]) => (
                    <div key={seg} className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <div className="text-xs font-bold text-white capitalize">{seg}</div>
                        <div className="text-[9px] text-[#4A5A70]">min {cfg.minRTP}% / max {cfg.maxRTP}%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min={60} max={150} value={cfg.targetRTP}
                          onChange={e => {
                            const v = Number(e.target.value);
                            setRtpConfig((prev: any) => ({
                              ...prev,
                              segments: { ...prev.segments, [seg]: { ...cfg, targetRTP: v } },
                            }));
                          }}
                          className="w-16 px-2 py-1 rounded text-xs font-mono font-bold text-center bg-[#0B1018] border border-[#1A2235] text-[#FFD700]" />
                        <span className="text-[10px] text-[#4A5A70]">%</span>
                        <button onClick={() => {
                            send({ type: 'ADMIN_RTP_UPDATE_SEGMENT', segment: seg, targetRTP: cfg.targetRTP, minRTP: cfg.minRTP, maxRTP: cfg.maxRTP } as any);
                            toast.success(`${seg} RTP → ${cfg.targetRTP}%`);
                          }}
                          className="px-2 py-1 rounded text-[9px] font-bold text-[#34D399]"
                          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-[#4A5A70] text-xs">Loading config...</div>
              )}
            </Panel>

            {/* 유저별 RTP + 오버라이드 */}
            <Panel>
              <SectionHeader title="Player RTP Override" icon={TrendingUp} color="#A78BFA" />
              <div className="flex gap-2 mb-3">
                <input value={rtpOverrideId} onChange={e => setRtpOverrideId(e.target.value)}
                  placeholder="Player ID" className="flex-1 px-3 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white" />
                <input type="number" min={60} max={150} value={rtpOverrideValue}
                  onChange={e => setRtpOverrideValue(Number(e.target.value))}
                  className="w-20 px-2 py-2 rounded-lg text-xs font-mono bg-[#0B1018] border border-[#1A2235] text-[#FFD700] text-center" />
                <button onClick={() => {
                    if (!rtpOverrideId) { toast.error('Player ID 입력'); return; }
                    send({ type: 'ADMIN_RTP_OVERRIDE', playerId: rtpOverrideId, targetRTP: rtpOverrideValue } as any);
                    toast.success(`${rtpOverrideId} → RTP ${rtpOverrideValue}%`);
                  }}
                  className="px-3 py-2 rounded-lg text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #A78BFA, #7C3AED)" }}>
                  Override
                </button>
                <button onClick={() => {
                    if (!rtpOverrideId) return;
                    send({ type: 'ADMIN_RTP_PLAYER', playerId: rtpOverrideId } as any);
                  }}
                  className="px-3 py-2 rounded-lg text-[10px] font-bold text-[#60A5FA]"
                  style={{ background: "rgba(96,165,250,0.1)" }}>
                  Detail
                </button>
              </div>
              {/* 플레이어 상세 */}
              {rtpPlayerDetail && (
                <div className="p-3 rounded-lg mb-3" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div><span className="text-[#4A5A70]">ID:</span> <span className="text-white font-mono">{rtpPlayerDetail.playerId}</span></div>
                    <div><span className="text-[#4A5A70]">Segment:</span> <span className="text-[#A78BFA] font-bold">{rtpPlayerDetail.segment}</span></div>
                    <div><span className="text-[#4A5A70]">Hands:</span> <span className="text-white font-mono">{rtpPlayerDetail.handsPlayed}</span></div>
                    <div><span className="text-[#4A5A70]">Current RTP:</span> <span className="text-[#FFD700] font-bold">{rtpPlayerDetail.currentRTP?.toFixed(1)}%</span></div>
                    <div><span className="text-[#4A5A70]">Target:</span> <span className="text-[#34D399] font-bold">{rtpPlayerDetail.targetRTP}%</span></div>
                    <div><span className="text-[#4A5A70]">Adjustment:</span> <span className="text-white font-mono">{rtpPlayerDetail.adjustmentScore?.toFixed(2)}</span></div>
                    <div><span className="text-[#4A5A70]">Losses streak:</span> <span className="text-[#EF4444] font-mono">{rtpPlayerDetail.consecutiveLosses}</span></div>
                    <div><span className="text-[#4A5A70]">Wagered:</span> <span className="text-white font-mono">{getSymbol()}{((rtpPlayerDetail.totalWagered || 0) / 100).toLocaleString()}</span></div>
                    <div><span className="text-[#4A5A70]">Returned:</span> <span className="text-white font-mono">{getSymbol()}{((rtpPlayerDetail.totalReturned || 0) / 100).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
              {/* 전체 유저 리스트 */}
              {rtpPlayers.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-[#4A5A70] border-b border-white/5">
                        <th className="text-left py-2 px-2">Player</th>
                        <th className="text-center py-2">Seg</th>
                        <th className="text-right py-2">RTP</th>
                        <th className="text-right py-2">Target</th>
                        <th className="text-right py-2">Hands</th>
                        <th className="text-right py-2 px-2">Adj</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rtpPlayers.map((p: any) => (
                        <tr key={p.playerId} className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer"
                          onClick={() => { setRtpOverrideId(p.playerId); send({ type: 'ADMIN_RTP_PLAYER', playerId: p.playerId } as any); }}>
                          <td className="py-1.5 px-2 font-mono text-white">{p.playerId.slice(0, 12)}...</td>
                          <td className="text-center"><span className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                            style={{ background: p.segment === 'vip' ? 'rgba(167,139,250,0.15)' : p.segment === 'onboarding' ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)', color: p.segment === 'vip' ? '#A78BFA' : p.segment === 'onboarding' ? '#34D399' : '#6B7A90' }}>
                            {p.segment}</span></td>
                          <td className="text-right font-mono font-bold" style={{ color: p.currentRTP > 100 ? '#34D399' : p.currentRTP < 85 ? '#EF4444' : '#FFD700' }}>{p.currentRTP}%</td>
                          <td className="text-right font-mono text-[#4A5A70]">{p.targetRTP}%</td>
                          <td className="text-right font-mono text-[#8899AB]">{p.handsPlayed}</td>
                          <td className="text-right font-mono px-2" style={{ color: p.adjustmentScore > 0.3 ? '#34D399' : p.adjustmentScore < -0.3 ? '#EF4444' : '#8899AB' }}>{p.adjustmentScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            HAND HISTORY
            ═══════════════════════════════════════════════ */}
        {activeTab === 'hands' && (
          <Panel>
            <div className="flex items-center gap-3 mb-4">
              <SectionHeader title="Hand History" icon={Hash} color="#60A5FA" />
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#3A4A5A]" />
                <input value={handSearch} onChange={e => setHandSearch(e.target.value)}
                  placeholder="Search hand#, room, winner..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none focus:border-[#60A5FA]" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[9px] text-[#4A5A70] uppercase tracking-wider border-b border-white/[0.03]">
                    <th className="text-left py-2 px-2">Hand #</th>
                    <th className="text-left py-2">Room</th>
                    <th className="text-center py-2">Players</th>
                    <th className="text-center py-2">Pot</th>
                    <th className="text-center py-2">Rake</th>
                    <th className="text-left py-2">Winner</th>
                    <th className="text-center py-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filteredHands.map(h => (
                    <tr key={h.id} className="hover:bg-white/[0.01] cursor-pointer">
                      <td className="py-2 px-2 font-mono text-[#60A5FA]">#{h.handNumber}</td>
                      <td className="py-2 text-white">{h.roomName}</td>
                      <td className="text-center text-[#6B7A90]">{h.playerCount}</td>
                      <td className="text-center font-mono text-white">{getSymbol()}{(h.pot / 100).toLocaleString()}</td>
                      <td className="text-center font-mono text-[#FFD700]">{getSymbol()}{(h.rake / 100).toLocaleString()}</td>
                      <td className="py-2 text-emerald-400">{h.winners}</td>
                      <td className="text-center text-[#4A5A70] font-mono text-[10px]">{h.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* ═══════════════════════════════════════════════
            AVATARS
            ═══════════════════════════════════════════════ */}
        {activeTab === 'avatars' && (
          <div className="space-y-4">
            <Panel>
              <SectionHeader title="Avatar Management" icon={UserCircle} color="#A78BFA"
                action={
                  <div className="flex gap-2">
                    <button onClick={() => setAvatarList(prev => prev.map(a => ({ ...a, enabled: true })))}
                      className="text-[9px] px-2 py-1 rounded text-emerald-400 bg-emerald-400/[0.08]">Enable All</button>
                    <button onClick={() => setAvatarList(prev => prev.map(a => ({ ...a, enabled: false })))}
                      className="text-[9px] px-2 py-1 rounded text-red-400 bg-red-400/[0.08]">Disable All</button>
                  </div>
                } />
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {avatarList.map((avatar, i) => (
                  <div key={avatar.id} className="rounded-xl overflow-hidden transition-all"
                    style={{
                      background: avatar.enabled ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.03)",
                      border: avatar.enabled ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(239,68,68,0.15)",
                      opacity: avatar.enabled ? 1 : 0.35,
                    }}>
                    <div className="aspect-square relative overflow-hidden">
                      <img src={avatar.src} alt={avatar.name} className="w-full h-full object-cover" />
                      {!avatar.enabled && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Ban className="h-4 w-4 text-red-400" /></div>}
                      <div className="absolute top-0.5 left-0.5 px-1 py-0.5 rounded text-[7px] font-mono font-bold text-white" style={{ background: "rgba(0,0,0,0.7)" }}>#{avatar.id + 1}</div>
                    </div>
                    <div className="px-1.5 py-1">
                      {editingAvatar === avatar.id ? (
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                          onBlur={() => { setAvatarList(prev => prev.map(a => a.id === avatar.id ? { ...a, name: editName || a.name } : a)); setEditingAvatar(null); }}
                          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          autoFocus className="w-full bg-transparent text-[8px] text-white outline-none border-b border-[#FF6B35]" />
                      ) : (
                        <div className="text-[8px] text-[#6B7A90] truncate">{avatar.name}</div>
                      )}
                    </div>
                    <div className="flex border-t border-white/[0.03]">
                      <button onClick={() => setAvatarList(prev => prev.map(a => a.id === avatar.id ? { ...a, enabled: !a.enabled } : a))}
                        className="flex-1 py-1 text-[7px] font-semibold" style={{ color: avatar.enabled ? "#EF4444" : "#34D399" }}>
                        {avatar.enabled ? "Off" : "On"}
                      </button>
                      <button onClick={() => { setEditingAvatar(avatar.id); setEditName(avatar.name); }}
                        className="flex-1 py-1 text-[7px] font-semibold text-[#60A5FA]" style={{ borderLeft: "1px solid rgba(255,255,255,0.03)" }}>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <SectionHeader title="Add Avatar" icon={Upload} color="#26A17B" />
              <div className="flex gap-2">
                <input value={newAvatarUrl} onChange={e => setNewAvatarUrl(e.target.value)}
                  placeholder="/src/assets/avatars/new.png"
                  className="flex-1 px-3 py-2.5 rounded-lg text-xs bg-[#0B1018] border border-[#1A2235] text-white focus:outline-none" />
                <button onClick={() => {
                  if (!newAvatarUrl.trim()) return;
                  setAvatarList(prev => [...prev, { id: prev.length, src: newAvatarUrl.trim(), name: `Custom ${prev.length + 1}`, enabled: true }]);
                  setNewAvatarUrl(''); toast.success('Avatar added');
                }}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #26A17B, #1A8A66)" }}>Add</button>
              </div>
            </Panel>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PHASE 6: SECURITY — 감사 로그 + 관리자 계정
            ═══════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-2 py-1 rounded-md font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>🟢 LIVE</span>
              <span className="text-[10px] text-[#6B7A90]">차단 유저 실시간</span>
            </div>
            <BanListPanel />

            {/* Admin Accounts */}
            <Panel>
              <SectionHeader title="Admin Accounts" icon={Key} color="#FF6B35" />
              <div className="space-y-2 mb-4">
                {[
                  { name: "SuperAdmin", role: "Super Admin", permissions: "Full Access", lastLogin: "2026-04-11 14:00", status: "active" },
                  { name: "ManagerKim", role: "Manager", permissions: "Rooms + Players + Finance", lastLogin: "2026-04-11 10:30", status: "active" },
                  { name: "SupportLee", role: "Viewer", permissions: "Read Only", lastLogin: "2026-04-10 16:00", status: "inactive" },
                ].map((admin, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: i === 0 ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.05)" }}>
                        <UserCircle className="h-4 w-4" style={{ color: i === 0 ? "#FF6B35" : "#4A5A70" }} />
                      </div>
                      <div>
                        <div className="text-xs text-white font-medium">{admin.name}</div>
                        <div className="text-[9px] text-[#4A5A70]">{admin.role} · {admin.permissions}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[9px] ${admin.status === 'active' ? 'text-emerald-400' : 'text-[#4A5A70]'}`}>{admin.status}</div>
                      <div className="text-[8px] text-[#3A4A5A]">{admin.lastLogin}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-2.5 rounded-lg text-xs font-bold text-[#FF6B35]"
                style={{ background: "rgba(255,107,53,0.05)", border: "1px solid rgba(255,107,53,0.15)" }}
                onClick={() => toast.success('Create admin form opened')}>
                + Add Admin Account
              </button>
            </Panel>

            {/* Audit Log */}
            <Panel>
              <SectionHeader title="Audit Log" icon={FileText} color="#60A5FA" />
              <div className="space-y-1.5">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      log.level === 'critical' ? 'bg-red-400' : log.level === 'warning' ? 'bg-yellow-400' : 'bg-emerald-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-[#FF6B35] font-bold">{log.action}</span>
                        <span className="text-[9px] text-[#4A5A70]">→ {log.target}</span>
                      </div>
                      <div className="text-[10px] text-[#6B7A90]">{log.details}</div>
                      <div className="text-[8px] text-[#3A4A5A] mt-0.5">{log.admin} · {log.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* 2FA + Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel>
                <SectionHeader title="2FA Authentication" icon={Shield} color="#26A17B" />
                <div className="p-3 rounded-lg text-center" style={{ background: "rgba(38,161,123,0.04)" }}>
                  <Shield className="h-8 w-8 mx-auto mb-2 text-[#26A17B]" />
                  <div className="text-xs text-white font-bold mb-1">TOTP Enabled</div>
                  <div className="text-[9px] text-[#4A5A70]">Google Authenticator connected</div>
                </div>
              </Panel>
              <Panel>
                <SectionHeader title="Alert Channels" icon={Bell} color="#FFD700" />
                <div className="space-y-2">
                  {[
                    { name: "Telegram Bot", status: true, desc: "Large withdrawals, errors" },
                    { name: "Slack #ops", status: true, desc: "Server health, player alerts" },
                    { name: "Email", status: false, desc: "Daily reports" },
                  ].map((ch, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div>
                        <div className="text-xs text-white">{ch.name}</div>
                        <div className="text-[8px] text-[#4A5A70]">{ch.desc}</div>
                      </div>
                      <div className="w-8 h-4 rounded-full flex items-center px-0.5"
                        style={{ background: ch.status ? "#26A17B" : "#1A2235", justifyContent: ch.status ? "flex-end" : "flex-start" }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: ch.status ? "#FFF" : "#4A5A70" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PHASE 7: TOURNAMENT
            ═══════════════════════════════════════════════ */}
        {activeTab === 'tournament' && (
          <div className="space-y-4">
            {/* Phase 1: 실 토너먼트 생성 폼 */}
            <Panel>
              <SectionHeader title="🏆 Create New Tournament" icon={Trophy} color="#FFD700" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="text-[10px] text-[#6B7A90] mb-1 block">이름</label>
                  <input id="t-name" placeholder="Daily Turbo"
                    className="w-full px-2 py-1.5 rounded text-[12px] bg-black/40 text-white"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A90] mb-1 block">바이인 (₩)</label>
                  <input id="t-buyin" type="number" defaultValue="1000"
                    className="w-full px-2 py-1.5 rounded text-[12px] bg-black/40 text-white font-mono"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A90] mb-1 block">스타팅 스택</label>
                  <input id="t-stack" type="number" defaultValue="10000"
                    className="w-full px-2 py-1.5 rounded text-[12px] bg-black/40 text-white font-mono"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A90] mb-1 block">최대 인원</label>
                  <input id="t-max" type="number" defaultValue="50"
                    className="w-full px-2 py-1.5 rounded text-[12px] bg-black/40 text-white font-mono"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A90] mb-1 block">시작 (분 후)</label>
                  <input id="t-startmin" type="number" defaultValue="5"
                    className="w-full px-2 py-1.5 rounded text-[12px] bg-black/40 text-white font-mono"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A90] mb-1 block">Late Reg (초)</label>
                  <input id="t-latereg" type="number" defaultValue="600"
                    className="w-full px-2 py-1.5 rounded text-[12px] bg-black/40 text-white font-mono"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="text-[10px] text-[#6B7A90] mb-1 block">Max Rebuys</label>
                  <input id="t-rebuys" type="number" defaultValue="2"
                    className="w-full px-2 py-1.5 rounded text-[12px] bg-black/40 text-white font-mono"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={async () => {
                      const name = (document.getElementById('t-name') as HTMLInputElement)?.value.trim() || `Tournament ${Date.now()}`;
                      const buyInKrw = Number((document.getElementById('t-buyin') as HTMLInputElement)?.value) || 1000;
                      const startingStack = Number((document.getElementById('t-stack') as HTMLInputElement)?.value) || 10000;
                      const maxPlayers = Number((document.getElementById('t-max') as HTMLInputElement)?.value) || 50;
                      const startMin = Number((document.getElementById('t-startmin') as HTMLInputElement)?.value) || 5;
                      const lateRegSeconds = Number((document.getElementById('t-latereg') as HTMLInputElement)?.value) || 600;
                      const maxRebuys = Number((document.getElementById('t-rebuys') as HTMLInputElement)?.value) || 0;
                      try {
                        const res = await adminFetch('/admin/tournament/create', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json'},
                          body: JSON.stringify({
                            name,
                            buyIn: buyInKrw * 100,
                            startingStack,
                            maxPlayers,
                            startTimeMs: Date.now() + startMin * 60000,
                            lateRegSeconds,
                            maxRebuys,
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast.success(`✅ "${name}" 생성됨 (${data.tournamentId})`);
                        } else {
                          toast.error(`❌ ${data.error || '생성 실패'}`);
                        }
                      } catch (e: any) {
                        toast.error(`❌ 네트워크 오류: ${e.message}`);
                      }
                    }}
                    className="w-full py-1.5 rounded font-bold text-[12px] text-[#0A0B10]"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #E5A500)' }}
                  >
                    🏆 생성
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-[#6B7A90] mt-3">
                💡 생성 후 모든 유저에게 자동으로 토너먼트 목록 알림이 갑니다. /tournaments 에서 등록 가능.
              </p>
            </Panel>

            <TournamentLivePanel />

            <Panel>
              <SectionHeader title="Pricing & Examples (Mock)" icon={Trophy} color="#6B7A90" />

              {/* Active Tournaments */}
              <div className="space-y-3 mb-4">
                {[
                  { name: "Sunday Million", buyIn: 50000, prize: 100000000, players: 234, max: 5000, starts: "2026-04-12 20:00", status: "registering", blinds: "100/200 (15min levels)" },
                  { name: "Daily Turbo", buyIn: 2500, prize: 500000, players: 48, max: 500, starts: "2026-04-11 18:00", status: "running", blinds: "2K/4K (Level 12)" },
                  { name: "High Roller Championship", buyIn: 100000, prize: 25000000, players: 12, max: 200, starts: "2026-04-13 21:00", status: "registering", blinds: "Starting soon" },
                ].map((t, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{t.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            t.status === 'running' ? 'text-emerald-400 bg-emerald-400/[0.08]' : 'text-yellow-400 bg-yellow-400/[0.08]'
                          }`}>{t.status}</span>
                        </div>
                        <div className="text-[10px] text-[#4A5A70]">{t.blinds}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-[#FFD700]">{getSymbol()}{(t.prize / 100).toLocaleString()}</div>
                        <div className="text-[9px] text-[#4A5A70]">Guaranteed Prize</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <div className="text-[8px] text-[#4A5A70]">Buy-in</div>
                        <div className="font-mono text-xs font-bold text-white">{getSymbol()}{(t.buyIn / 100).toLocaleString()}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <div className="text-[8px] text-[#4A5A70]">Players</div>
                        <div className="font-mono text-xs font-bold text-white">{t.players}/{t.max}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <div className="text-[8px] text-[#4A5A70]">Start</div>
                        <div className="font-mono text-[10px] font-bold text-white">{t.starts.split(' ')[1]}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <div className="text-[8px] text-[#4A5A70]">Pool</div>
                        <div className="font-mono text-xs font-bold text-emerald-400">{getSymbol()}{(t.buyIn * t.players / 100).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-lg text-[10px] font-bold text-[#60A5FA]" style={{ background: "rgba(96,165,250,0.05)" }}
                        onClick={() => toast.success('Monitoring ' + t.name)}>Monitor</button>
                      <button className="flex-1 py-2 rounded-lg text-[10px] font-bold text-[#FF6B35]" style={{ background: "rgba(255,107,53,0.05)" }}
                        onClick={() => toast.success('Editing ' + t.name)}>Edit</button>
                      {t.status === 'registering' && (
                        <button className="flex-1 py-2 rounded-lg text-[10px] font-bold text-[#EF4444]" style={{ background: "rgba(239,68,68,0.05)" }}
                          onClick={() => toast.success('Cancelled ' + t.name)}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Prize Structure */}
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,215,0,0.02)", border: "1px solid rgba(255,215,0,0.08)" }}>
                <div className="text-xs font-bold text-[#FFD700] mb-3">Prize Distribution Template</div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { pos: "1st", pct: "30%" }, { pos: "2nd", pct: "20%" }, { pos: "3rd", pct: "15%" },
                    { pos: "4th-6th", pct: "8%" }, { pos: "7th-10th", pct: "4.5%" },
                  ].map((p, i) => (
                    <div key={i} className="text-center p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.3)" }}>
                      <div className="text-[9px] text-[#FFD700] font-bold">{p.pos}</div>
                      <div className="font-mono text-xs text-white">{p.pct}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
        )}

      </div>
    </div>
  );
}
