import { formatMoney, getSymbol } from "../utils/currency";
import { useState } from "react";
import { Lock, Users, Zap, Crown, UserPlus, X as XIcon } from "lucide-react";
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
  invites?: string[];  // V12: 초대할 유저 닉네임/이메일 목록 (방 생성 시에만)
}

const blindPresets = [
  { label: "Beginner", sub: "₩500/1K", small: 500, big: 1000, color: "#34D399" },
  { label: "Standard", sub: "₩2K/5K", small: 2000, big: 5000, color: "#60A5FA" },
  { label: "Standard+", sub: "₩5K/10K", small: 5000, big: 10000, color: "#FF6B35" },
  { label: "High", sub: "₩10K/20K", small: 10000, big: 20000, color: "#FFD700" },
  { label: "High+", sub: "₩20K/50K", small: 20000, big: 50000, color: "#FFA500" },
  { label: "VIP", sub: "₩50K/100K", small: 50000, big: 100000, color: "#A78BFA" },
  { label: "VIP+", sub: "₩100K/200K", small: 100000, big: 200000, color: "#EF4444" },
];

export function CreateRoomModal({ open, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [blindIdx, setBlindIdx] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(9);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  // V12: 초대 기능 — 방 생성 시에만 가능
  const [inviteInput, setInviteInput] = useState("");
  const [invites, setInvites] = useState<string[]>([]);

  const blind = blindPresets[blindIdx]!;
  const minBuyIn = blind.big * 20;
  const maxBuyIn = blind.big * 100;

  const addInvite = () => {
    let v = inviteInput.trim().replace(/^@+/, '@'); // 앞 @ 정리
    if (!v) return;
    // @ 자동 prefix (사용자가 안 붙이면 추가)
    if (!v.startsWith('@')) v = '@' + v;
    // Telegram username 규칙: 5~32자, 영숫자+_
    if (!/^@[a-zA-Z0-9_]{5,32}$/.test(v)) {
      toast.error('Telegram ID 형식: @username (5~32자 영숫자/_)');
      return;
    }
    if (invites.includes(v)) { toast.error("이미 추가된 초대"); return; }
    if (invites.length >= 8) { toast.error("최대 8명"); return; }
    setInvites([...invites, v]);
    setInviteInput("");
  };

  const removeInvite = (name: string) => {
    setInvites(invites.filter(n => n !== name));
  };

  const handleCreate = () => {
    if (!roomName.trim()) { toast.error("Enter a table name"); return; }
    onCreateRoom({
      name: roomName, smallBlind: blind.small, bigBlind: blind.big,
      maxPlayers, minBuyIn, maxBuyIn,
      password: usePassword ? password : undefined,
      invites: invites.length > 0 ? invites : undefined,
    });
    setRoomName(""); setPassword(""); setUsePassword(false);
    setInvites([]); setInviteInput("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* V12: 모바일 dvh 사용 — iOS 주소바 포함 해결 + footer 절대 안 가려짐 */}
      <DialogContent
        className="max-w-[440px] w-[calc(100vw-16px)] p-0 overflow-hidden border-0 flex flex-col"
        style={{ maxHeight: 'min(80vh, 80dvh, calc(100dvh - 2rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)))' }}
        hideClose
      >
        {/* Header */}
        <div className="relative px-5 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 shrink-0" style={{
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

        {/* Body — 모바일은 스크롤 (min-h-0 필수: flex 자식 overflow 활성화) */}
        <div className="px-4 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-5 overflow-y-auto flex-1 min-h-0" style={{ background: "#0F1520" }}>

          {/* Table Name */}
          <div>
            <label className="text-[11px] text-[#4A5A70] uppercase tracking-wider mb-1.5 block">Table Name</label>
            <Input placeholder="e.g. VIP Lounge" value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="bg-[#0B1018] border-[#1A2235] focus:border-[#FF6B35] h-11 text-sm" />
          </div>

          {/* Blinds — 모바일 가로 스크롤, 데스크탑 균등 분할 */}
          <div>
            <label className="text-[11px] text-[#4A5A70] uppercase tracking-wider mb-2 block">Blinds</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {blindPresets.map((p, i) => (
                <button key={i} onClick={() => setBlindIdx(i)}
                  className="shrink-0 min-w-[72px] py-2 rounded-lg text-center transition-all"
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

          {/* V12: 초대 (방 생성 시에만) — 텔레그램 ID 기반 */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] text-[#4A5A70] uppercase tracking-wider mb-2">
              <UserPlus className="h-3 w-3" /> Invite via Telegram (optional · max 8)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="@telegram_username"
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInvite(); } }}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                name="invite-telegram-id"
                inputMode="text"
                className="bg-[#0B1018] border-[#1A2235] focus:border-[#FF6B35] h-10 text-sm"
              />
              <button
                onClick={addInvite}
                disabled={!inviteInput.trim() || invites.length >= 8}
                className="px-3 rounded-lg text-[11px] font-bold text-white disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #0088CC, #0066AA)' }}
                title="Telegram 알림 전송"
              >
                Add
              </button>
            </div>
            {invites.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {invites.map(n => (
                  <span key={n} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', color: '#22D3EE' }}>
                    {n}
                    <button onClick={() => removeInvite(n)} className="hover:text-white">
                      <XIcon className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[9px] text-[#3A4A5A] mt-1.5">
              ⚠️ Telegram Bot이 @username 으로 방 링크 DM 발송
              <br />
              ⚠️ 초대는 방 생성 시에만 가능 — 진행 중인 방에는 초대 불가
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-5 pb-4 sm:pb-5 shrink-0 border-t border-white/[0.05]" style={{ background: "#0F1520" }}>
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
