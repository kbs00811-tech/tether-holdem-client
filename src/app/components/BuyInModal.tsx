import { formatMoney, getSymbol } from "../utils/currency";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Slider } from "./ui/slider";
import { motion } from "motion/react";
import { Wallet, Zap, ChevronDown, ChevronUp } from "lucide-react";

interface BuyInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minBuyIn: number;
  maxBuyIn: number;
  currentBalance: number;
  tableName: string;
  blinds: string;
  onJoinTable: (amount: number) => void;
}

export function BuyInModal({
  open, onOpenChange, minBuyIn, maxBuyIn, currentBalance, tableName, blinds, onJoinTable,
}: BuyInModalProps) {
  const [amount, setAmount] = useState(minBuyIn);
  const canAfford = amount <= currentBalance;
  const bigBlindCount = Math.floor(amount / (maxBuyIn / 100));

  useEffect(() => { setAmount(minBuyIn); }, [minBuyIn]);

  const presets = [
    { label: "Min", value: minBuyIn },
    { label: "25%", value: Math.floor(minBuyIn + (maxBuyIn - minBuyIn) * 0.25) },
    { label: "50%", value: Math.floor((minBuyIn + maxBuyIn) / 2) },
    { label: "75%", value: Math.floor(minBuyIn + (maxBuyIn - minBuyIn) * 0.75) },
    { label: "Max", value: Math.min(maxBuyIn, currentBalance) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden border-0" hideClose>
        {/* Header — gradient accent */}
        <div className="relative px-6 pt-5 pb-4"
          style={{
            background: "linear-gradient(135deg, #0F1923 0%, #162033 50%, #0F1923 100%)",
            borderBottom: "1px solid rgba(255,107,53,0.15)",
          }}>
          {/* Neon accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #FF6B35, #26A17B, transparent)" }} />

          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[15px] font-bold text-white">{tableName}</h2>
              <span className="text-[11px] text-[#6B7A90]">Blinds {blinds}</span>
            </div>
            <button onClick={() => onOpenChange(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#6B7A90] hover:text-white transition">
              ×
            </button>
          </div>

          {/* Balance */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <Wallet className="h-3.5 w-3.5 text-[#FF6B35]" />
            <span className="text-[11px] text-[#6B7A90]">Balance</span>
            <span className="ml-auto font-mono text-[13px] font-semibold text-white">
              {getSymbol()}{currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5" style={{ background: "#0F1520" }}>
          {/* Amount display */}
          <div className="text-center">
            <div className="text-[11px] text-[#6B7A90] mb-1 uppercase tracking-wider">Buy-in Amount</div>
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => setAmount(Math.max(minBuyIn, amount - 100))}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#6B7A90] hover:text-white transition">
                <ChevronDown className="h-4 w-4" />
              </button>
              <motion.div key={amount} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="font-mono text-[32px] font-bold text-white px-4 min-w-[180px] text-center">
                {getSymbol()}{amount.toLocaleString()}
              </motion.div>
              <button onClick={() => setAmount(Math.min(maxBuyIn, amount + 100))}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#6B7A90] hover:text-white transition">
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <div className="text-[10px] text-[#4A5568] mt-1">
              ~{bigBlindCount} Big Blinds
            </div>
          </div>

          {/* Slider */}
          <div className="px-1">
            <Slider
              value={[amount]}
              onValueChange={(v) => setAmount(v[0]!)}
              min={minBuyIn}
              max={Math.min(maxBuyIn, currentBalance)}
              step={Math.max(1, Math.floor((maxBuyIn - minBuyIn) / 200))}
              className="[&_[data-slot=slider-track]]:bg-[#1A2235] [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-[#FF6B35] [&_[data-slot=slider-range]]:to-[#26A17B] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-[#FF6B35] [&_[data-slot=slider-thumb]]:shadow-[0_0_8px_rgba(255,107,53,0.4)]"
            />
            <div className="flex justify-between text-[10px] text-[#4A5568] mt-1.5">
              <span>{getSymbol()}{minBuyIn.toLocaleString()}</span>
              <span>{getSymbol()}{Math.min(maxBuyIn, currentBalance).toLocaleString()}</span>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex gap-1.5">
            {presets.map(p => (
              <button key={p.label}
                onClick={() => setAmount(p.value)}
                className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all
                  ${amount === p.value
                    ? "bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30"
                    : "bg-white/[0.03] text-[#6B7A90] border border-white/[0.04] hover:bg-white/[0.06] hover:text-white"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Insufficient warning + PeerX 지갑 CTA */}
          {!canAfford && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20">
                <span className="text-[11px] text-[#EF4444]">
                  💸 잔액이 부족합니다. PeerX 지갑에서 충전하세요.
                </span>
              </div>
              <button
                onClick={() => {
                  // 부모창(B2C HoldemPage)에 PeerX 지갑 열기 요청
                  if (typeof window !== 'undefined' && window.parent !== window) {
                    window.parent.postMessage({ type: 'OPEN_PEERX_WALLET', action: 'wallet-balance' }, '*');
                  } else {
                    window.open('/cashier', '_blank');
                  }
                }}
                className="w-full py-2.5 rounded-lg text-[12px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #34D399, #059669)",
                  boxShadow: "0 4px 14px rgba(52,211,153,0.3)",
                }}>
                🪙 PeerX 지갑에서 충전하기
              </button>
            </motion.div>
          )}
        </div>

        {/* Footer — action buttons */}
        <div className="flex gap-3 px-6 pb-5 pt-0" style={{ background: "#0F1520" }}>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-[#6B7A90]
              bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { onJoinTable(amount); onOpenChange(false); }}
            disabled={!canAfford || amount < minBuyIn || amount > maxBuyIn}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-bold text-white
              transition-all relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canAfford
                ? "linear-gradient(135deg, #FF6B35 0%, #E85D2C 100%)"
                : "#2A3040",
              boxShadow: canAfford ? "0 4px 15px rgba(255,107,53,0.25)" : "none",
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Join Table
            </span>
            {canAfford && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
