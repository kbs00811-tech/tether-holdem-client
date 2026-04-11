import { formatMoney } from "../utils/currency";
import { Wallet, ExternalLink, ArrowUpFromLine, ArrowDownToLine, Shield, Zap, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

const TETHER_BET_CASHIER_URL = "http://localhost:5173/cashier"; // 프로덕션: https://tether.bet/cashier

export default function Cashier() {
  const balance = 12450.50;
  const inPlay = 8200.00;
  const available = balance - inPlay;

  const recentActivity = [
    { type: "buy_in", table: "High Rollers", amount: -2000, time: "5분 전" },
    { type: "cash_out", table: "Medium Stakes", amount: 3240, time: "1시간 전" },
    { type: "buy_in", table: "6-Max 1/2", amount: -1000, time: "2시간 전" },
    { type: "cash_out", table: "VIP Room", amount: 5800, time: "어제" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative mx-3 sm:mx-5 mt-3 rounded-2xl overflow-hidden" style={{ height: "clamp(120px, 18vh, 180px)" }}>
        <img src="/src/assets/banners/hero_bonus.png" alt="Cashier" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(110deg, rgba(5,8,12,0.97) 0%, rgba(5,8,12,0.85) 40%, rgba(5,8,12,0.3) 70%, transparent 100%)",
        }} />
        <div className="relative z-10 h-full flex flex-col justify-end px-5 sm:px-8 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-[#FF6B35]" />
            <span className="text-[10px] uppercase tracking-widest text-[#FF6B35] font-bold">Balance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">My Funds</h1>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-3 sm:px-5 py-5">

        {/* ═══ Balance Cards ═══ */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Balance", value: balance, color: "#FF6B35", icon: Wallet },
            { label: "In Play", value: inPlay, color: "#FFD700", icon: Zap },
            { label: "Available", value: available, color: "#34D399", icon: Shield },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="relative rounded-xl p-4 overflow-hidden"
              style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${item.color}66, transparent)` }} />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#4A5A70]">{item.label}</span>
                <item.icon className="h-3.5 w-3.5" style={{ color: item.color, opacity: 0.5 }} />
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold" style={{ color: i === 0 ? item.color : "white" }}>
                {getSymbol()}{item.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══ Deposit / Withdraw — TETHER.BET 캐셔 연결 ═══ */}
        <div className="rounded-xl p-6 mb-6 text-center"
          style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
          <Wallet className="h-10 w-10 mx-auto mb-3 text-[#FF6B35] opacity-30" />
          <h3 className="text-base font-bold text-white mb-1">입출금은 TETHER.BET 캐셔에서</h3>
          <p className="text-[12px] text-[#4A5A70] mb-5 max-w-sm mx-auto">
            USDT 입금/출금은 TETHER.BET 메인 캐셔에서 PeerX를 통해 안전하게 처리됩니다.
          </p>

          <div className="flex gap-3 justify-center">
            <a href={TETHER_BET_CASHIER_URL} target="_blank" rel="noopener noreferrer">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl text-[13px] font-bold text-white inline-flex items-center gap-2 relative overflow-hidden group"
                style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)", boxShadow: "0 4px 15px rgba(255,107,53,0.25)" }}>
                <ArrowDownToLine className="h-4 w-4" />
                입금하기
                <ExternalLink className="h-3 w-3 opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.button>
            </a>
            <a href={TETHER_BET_CASHIER_URL} target="_blank" rel="noopener noreferrer">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl text-[13px] font-bold text-[#8899AB] inline-flex items-center gap-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <ArrowUpFromLine className="h-4 w-4" />
                출금하기
                <ExternalLink className="h-3 w-3 opacity-30" />
              </motion.button>
            </a>
          </div>
        </div>

        {/* ═══ Recent Table Activity ═══ */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-[11px] text-[#4A5A70] uppercase tracking-wider font-semibold">Recent Table Activity</span>
            <button className="text-[#4A5A70] hover:text-white transition">
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {recentActivity.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: item.amount > 0 ? "rgba(52,211,153,0.06)" : "rgba(255,107,53,0.06)" }}>
                    {item.amount > 0
                      ? <ArrowDownToLine className="h-3.5 w-3.5 text-[#34D399]" />
                      : <ArrowUpFromLine className="h-3.5 w-3.5 text-[#FF6B35]" />
                    }
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">
                      {item.type === "buy_in" ? "Buy-in" : "Cash Out"} — {item.table}
                    </div>
                    <div className="text-[10px] text-[#4A5A70]">{item.time}</div>
                  </div>
                </div>
                <div className="font-mono text-sm font-semibold"
                  style={{ color: item.amount > 0 ? "#34D399" : "#FF6B35" }}>
                  {item.amount > 0 ? "+" : ""}{getSymbol()}{Math.abs(item.amount).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 px-4 py-3 rounded-lg flex items-start gap-2"
          style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.08)" }}>
          <span className="text-[11px]">ℹ️</span>
          <span className="text-[11px] text-[#60A5FA]/70">
            홀덤 테이블에서의 바이인/캐시아웃은 TETHER.BET 잔액에서 자동 처리됩니다.
            입출금(USDT)은 TETHER.BET 메인 캐셔에서 PeerX를 통해 진행하세요.
          </span>
        </div>
      </div>
    </div>
  );
}
