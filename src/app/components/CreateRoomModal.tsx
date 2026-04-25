import { formatMoney, getSymbol } from "../utils/currency";
import { useState } from "react";
import { Lock, Users, Zap, Crown, UserPlus, X as XIcon } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useT } from "../../i18n";

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
  const t = useT();
  const [roomName, setRoomName] = useState("");
  const [blindIdx, setBlindIdx] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(9);
  // V22: 비밀번호 제거 — isPrivate 토글만 유지 (방 코드 공유 방식)
  // V22: 텔레그램 초대는 방 생성 후 친구 초대 모달에서 처리
  const [isPrivate, setIsPrivate] = useState(false);
  // V22 Phase 2+: Show/Muck 선택 (default true, 유저 권고)
  const [showMuckChoice, setShowMuckChoice] = useState(true);

  const blind = blindPresets[blindIdx]!;
  const minBuyIn = blind.big * 20;
  const maxBuyIn = blind.big * 100;

  const handleCreate = () => {
    if (!roomName.trim()) { toast.error(t('createRoom.enterName')); return; }
    // V22: 비밀번호 제거 + 텔레그램 초대는 방 생성 후 친구 초대 모달에서 처리
    onCreateRoom({
      name: roomName,
      smallBlind: blind.small * 100,
      bigBlind: blind.big * 100,
      maxPlayers,
      minBuyIn: minBuyIn * 100,
      maxBuyIn: maxBuyIn * 100,
      isPrivate,
      showMuckChoice, // V22 Phase 2+
    } as any);
    setRoomName(""); setIsPrivate(false); setShowMuckChoice(true);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* 모바일 반응형 V3 (2026-04-23 재감사):
          - dvh + safe-area + 720px cap
          - 🔴 CRITICAL FIX: overflow-y-hidden 명시 (Radix Dialog 기본 overflow-y-auto 제거)
          - 🔴 gap-0 명시 (기본 gap-4 제거 → Header/Body/Footer 간격 정확히 0)
          - 내부 Body 만 스크롤 (flex-1 min-h-0 + overflow-y-auto) */}
      <DialogContent
        className="w-[min(440px,calc(100vw-16px))] sm:w-[440px] max-w-none p-0 gap-0 overflow-hidden overflow-y-hidden border-0 flex flex-col"
        style={{
          maxHeight: 'min(720px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 16px))',
          marginTop: 'env(safe-area-inset-top, 0px)',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        hideClose
      >
        {/* Header — shrink-0, 터치타겟 ≥44px */}
        <div className="relative px-4 sm:px-6 pt-3.5 sm:pt-5 pb-3 sm:pb-4 shrink-0" style={{
          background: "linear-gradient(135deg, #0F1923, #162033)",
          borderBottom: "1px solid rgba(255,107,53,0.1)",
        }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #FF6B35, #26A17B, transparent)" }} />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] sm:text-base font-bold text-white truncate">{t('createRoom.title')}</h2>
              <span className="text-[11px] text-[#6B7A90] block truncate">{t('createRoom.subtitle')}</span>
            </div>
            <button onClick={onClose}
              aria-label="Close"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#6B7A90] hover:text-white transition shrink-0 text-lg">
              ×
            </button>
          </div>
        </div>

        {/* Body — 스크롤, overscroll 제어, 키보드시 input 자동 스크롤 */}
        <div
          className="px-4 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-5 overflow-y-auto flex-1 min-h-0"
          style={{ background: "#141A24", overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >

          {/* Table Name — input font-size 16px (iOS zoom 회피) + 터치 44px */}
          <div>
            <label className="text-[11px] text-[#8899AB] uppercase tracking-wider mb-1.5 block">{t('createRoom.roomName')}</label>
            <Input placeholder={t('createRoom.namePlaceholder')} value={roomName}
              onChange={e => setRoomName(e.target.value)}
              onFocus={e => setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250)}
              className="bg-[#0B1018] border-[#1A2235] focus:border-[#FF6B35] h-11"
              style={{ fontSize: '16px' }}
            />
          </div>

          {/* Blinds — 모바일 가로 스크롤, 데스크탑 균등 분할 */}
          <div>
            <label className="text-[11px] text-[#8899AB] uppercase tracking-wider mb-2 block">{t('createRoom.blinds')}</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {blindPresets.map((p, i) => (
                <button key={i} onClick={() => setBlindIdx(i)}
                  className="shrink-0 min-w-[76px] min-h-[48px] py-2.5 rounded-lg text-center transition-all flex flex-col items-center justify-center"
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
            <label className="text-[11px] text-[#8899AB] uppercase tracking-wider mb-2 block">{t('createRoom.maxPlayers')}</label>
            <div className="flex gap-2">
              {[
                { n: 2, label: "Heads-Up", icon: Zap },
                { n: 6, label: "6-Max", icon: Users },
                { n: 9, label: "Full Ring", icon: Crown },
              ].map(opt => (
                <button key={opt.n} onClick={() => setMaxPlayers(opt.n)}
                  className="flex-1 min-h-[60px] py-2.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all"
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
              <span className="text-[10px] text-[#8899AB]">{t('createRoom.buyIn')}</span>
              <span className="text-[9px] text-[#6B7A90]">{t('createRoom.buyInAuto')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#8899AB]">{getSymbol()}{minBuyIn.toLocaleString()}</span>
              <div className="flex-1 mx-3 h-px" style={{ background: "linear-gradient(90deg, rgba(255,107,53,0.2), rgba(255,215,0,0.2))" }} />
              <span className="font-mono text-xs text-[#FF6B35] font-semibold">{getSymbol()}{maxBuyIn.toLocaleString()}</span>
            </div>
          </div>

          {/* V22: 비공개 방 — 비밀번호 제거, 방 코드 공유로 제어 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[11px] text-[#8899AB]">
                <Lock className="h-3 w-3" /> 비공개 방 (방 코드로만 입장)
              </label>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
            {isPrivate && (
              <p className="text-[10px] text-[#6B7A90] leading-relaxed mt-1">
                ⚙️ 로비 목록에 숨겨집니다. 친구 초대 모달의 <b className="text-[#22D3EE]">방 코드</b>를 받은 사람만 입장 가능합니다.
              </p>
            )}
          </div>

          {/* V22: 텔레그램 초대는 방 생성 후 "친구 초대" 모달에서 직접 입력·전송 */}
          <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#22D3EE] mb-1">
              <UserPlus className="h-3 w-3" /> 친구 초대
            </div>
            <p className="text-[10px] text-[#8899AB] leading-relaxed">
              방 생성 후 자동으로 열리는 <b className="text-[#22D3EE]">"친구 초대"</b> 모달에서 방 코드 복사 + 텔레그램 자동 전송 가능.
            </p>
          </div>
        </div>

        {/* Footer — 안전영역 하단 패딩 + 터치타겟 48px */}
        <div
          className="flex gap-2 sm:gap-3 px-4 sm:px-6 pt-3 sm:pt-4 shrink-0 border-t border-white/[0.05]"
          style={{
            background: "#141A24",
            paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))',
          }}>
          <button onClick={onClose}
            className="flex-1 min-h-[48px] py-3 rounded-lg text-[14px] font-semibold text-[#6B7A90]
              bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all">
            {t('common.cancel')}
          </button>
          <button onClick={handleCreate}
            disabled={!roomName.trim()}
            className="flex-1 min-h-[48px] py-3 rounded-lg text-[14px] font-bold text-white relative overflow-hidden group
              disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: roomName.trim() ? "linear-gradient(135deg, #FF6B35, #E85D2C)" : "#2A3040",
              boxShadow: roomName.trim() ? "0 4px 15px rgba(255,107,53,0.25)" : "none",
            }}>
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> {t('createRoom.create')}
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
