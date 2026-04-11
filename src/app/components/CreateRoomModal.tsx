import { formatMoney } from "../utils/currency";
import { useState } from "react";
import { Lock, Users, Zap, Crown, ChevronDown } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onCreateRoom: (config: RoomConfig) => void;
}

export interface RoomConfig {
  name: string;
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  minBuyIn: number;
  maxBuyIn: number;
  password?: string;
}

const blindPresets = [
  { label: "Micro", sub: "1/2", small: 1, big: 2, color: "#34D399" },
  { label: "Low", sub: "5/10", small: 5, big: 10, color: "#60A5FA" },
  { label: "Mid", sub: "25/50", small: 25, big: 50, color: "#FF6B35" },
  { label: "High", sub: "50/100", small: 50, big: 100, color: "#A78BFA" },
  { label: "VIP", sub: "100/200", small: 100, big: 200, color: "#FFD700" },
];

export function CreateRoomModal({ open, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [blindIdx, setBlindIdx] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(9);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");

  const blind = blindPresets[blindIdx]!;
  const minBuyIn = blind.big * 20;
  const maxBuyIn = blind.big * 100;

  const handleCreate = () => {
    if (!roomName.trim()) { toast.error("Enter a table name"); return; }
    onCreateRoom({
      name: roomName, smallBlind: blind.small, bigBlind: blind.big,
      maxPlayers, minBuyIn, maxBuyIn, password: usePassword ? password : undefined,
    });
    setRoomName(""); setPassword(""); setUsePassword(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[440px] p-0 overflow-hidden border-0" hideClose>
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4" style={{
          background: "linear-gradient(135deg, #0F1923, #162033)",
          borderBottom: "1px solid rgba(255,107,53,0.1)",
        }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #FF6B35, #26A17B, transparent)" }} />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-white">Create Table</h2>
              <span className="text-[11px] text-[#4A5A70]">Set up your private holdem table</span>
            </div>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#6B7A90] hover:text-white transition">
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5" style={{ background: "#0F1520" }}>

          {/* Table Name */}
          <div>
            <label className="text-[11px] text-[#4A5A70] uppercase tracking-wider mb-1.5 block">Table Name</label>
            <Input placeholder="e.g. VIP Lounge" value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="bg-[#0B1018] border-[#1A2235] focus:border-[#FF6B35] h-11 text-sm" />
          </div>

          {/* Blinds — horizontal scroll */}
          <div>
            <label className="text-[11px] text-[#4A5A70] uppercase tracking-wider mb-2 block">Blinds</label>
            <div className="flex gap-1.5">
              {blindPresets.map((p, i) => (
                <button key={i} onClick={() => setBlindIdx(i)}
                  className="flex-1 py-2 rounded-lg text-center transition-all"
                  style={{
                    background: blindIdx === i ? `${p.color}12` : "rgba(255,255,255,0.02)",
                    border: blindIdx === i ? `1px solid ${p.color}30` : "1px solid rgba(255,255,255,0.04)",
                  }}>
                  <div className="text-[10px] font-bold" style={{ color: blindIdx === i ? p.color : "#4A5A70" }}>{p.label}</div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: blindIdx === i ? p.color : "#3A4A5A" }}>{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="text-[11px] text-[#4A5A70] uppercase tracking-wider mb-2 block">Players</label>
            <div className="flex gap-2">
              {[
                { n: 2, label: "Heads-Up", icon: Zap },
                { n: 6, label: "6-Max", icon: Users },
                { n: 9, label: "Full Ring", icon: Crown },
              ].map(opt => (
                <button key={opt.n} onClick={() => setMaxPlayers(opt.n)}
                  className="flex-1 py-2.5 rounded-lg flex flex-col items-center gap-0.5 transition-all"
                  style={{
                    background: maxPlayers === opt.n ? "rgba(255,107,53,0.08)" : "rgba(255,255,255,0.02)",
                    border: maxPlayers === opt.n ? "1px solid rgba(255,107,53,0.2)" : "1px solid rgba(255,255,255,0.04)",
                  }}>
                  <opt.icon className="h-3.5 w-3.5" style={{ color: maxPlayers === opt.n ? "#FF6B35" : "#3A4A5A" }} />
                  <span className="text-[10px] font-semibold" style={{ color: maxPlayers === opt.n ? "#FF6B35" : "#4A5A70" }}>{opt.label}</span>
                  <span className="text-[8px] font-mono" style={{ color: maxPlayers === opt.n ? "#FF6B35" : "#2A3A4A" }}>{opt.n} seats</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buy-in Info */}
          <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#4A5A70]">Buy-in Range</span>
              <span className="text-[9px] text-[#3A4A5A]">Auto: 20BB – 100BB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#8899AB]">{getSymbol()}{minBuyIn.toLocaleString()}</span>
              <div className="flex-1 mx-3 h-px" style={{ background: "linear-gradient(90deg, rgba(255,107,53,0.2), rgba(255,215,0,0.2))" }} />
              <span className="font-mono text-xs text-[#FF6B35] font-semibold">{getSymbol()}{maxBuyIn.toLocaleString()}</span>
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[11px] text-[#4A5A70]">
                <Lock className="h-3 w-3" /> Private Table
              </label>
              <Switch checked={usePassword} onCheckedChange={setUsePassword} />
            </div>
            <AnimatePresence>
              {usePassword && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Input type="password" placeholder="Enter password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-[#0B1018] border-[#1A2235] focus:border-[#FF6B35] h-10 text-sm" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-5" style={{ background: "#0F1520" }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-[#6B7A90]
              bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all">
            Cancel
          </button>
          <button onClick={handleCreate}
            disabled={!roomName.trim()}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-bold text-white relative overflow-hidden group
              disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: roomName.trim() ? "linear-gradient(135deg, #FF6B35, #E85D2C)" : "#2A3040",
              boxShadow: roomName.trim() ? "0 4px 15px rgba(255,107,53,0.25)" : "none",
            }}>
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Create Table
            </span>
            {roomName.trim() && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
