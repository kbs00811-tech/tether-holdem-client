import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Switch } from "./ui/switch";
import { motion } from "motion/react";
import { Volume2, Music, Sparkles, Check } from "lucide-react";
import { setMuted } from "../hooks/useSound";
import { useSettingsStore, AVATAR_IMAGES, AVATAR_NAMES, CARD_SKINS, TABLE_FELTS } from "../stores/settingsStore";
import { CountryPicker } from "./CountryPicker";
import { useGameStore } from "../stores/gameStore";
import { wsSend } from "../hooks/useSocket";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const cardSkinList = [
  { id: 1, name: "Classic", desc: "Traditional red & black", colors: ["#CC0000", "#111111"] },
  { id: 2, name: "4-Color", desc: "Suit-distinct", colors: ["#CC0000", "#1D4ED8", "#059669", "#111111"] },
  { id: 3, name: "Neon", desc: "Cyberpunk glow", colors: ["#FF6B35", "#26A17B", "#A78BFA", "#FFD700"] },
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const {
    avatar, cardSkin, soundEnabled, musicEnabled, cardAnimations, runItMode, nickname, countryCode, tableFelt, showMuckMode,
    setAvatar, setCardSkin, setSoundEnabled, setMusicEnabled, setCardAnimations, setRunItMode, setNickname, setCountryCode, setTableFelt, setShowMuckMode,
  } = useSettingsStore();

  // V3 P2C1: 로컬 input state — 타이핑 중엔 store 동기화 하지 않고, blur/Enter 에서 저장
  const [nickDraft, setNickDraft] = useState<string>(nickname);
  useEffect(() => { setNickDraft(nickname); }, [nickname]);

  // V3 Task 4 Phase C: 방장 Rakeback 상태 조회 (모달 열릴 때)
  const ownerRakeback = useGameStore(s => s.ownerRakeback);
  useEffect(() => {
    if (open) {
      try { wsSend({ type: 'GET_OWNER_RAKEBACK' } as any); } catch {}
    }
  }, [open]);
  const handleClaimRakeback = () => {
    try { wsSend({ type: 'CLAIM_OWNER_RAKEBACK' } as any); } catch {}
  };
  const nickValid = (() => {
    const t = nickDraft.trim();
    if (t.length < 2 || t.length > 16) return false;
    return /^[가-힣a-zA-Z0-9 ._-]+$/.test(t);
  })();
  const commitNick = () => {
    if (nickValid && nickDraft.trim() !== nickname) setNickname(nickDraft.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] max-h-[85vh] overflow-y-auto p-0 border-0" hideClose>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 sticky top-0 z-10"
          style={{ background: "linear-gradient(135deg, #0F1923, #162033)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, #FF6B35, #26A17B, transparent)" }} />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Settings</h2>
            <button onClick={() => onOpenChange(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-[#6B7A90] hover:text-white transition">×</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6" style={{ background: "#0F1520" }}>

          {/* ═══ V3 P2C1: Nickname — 한글/영어 2~16자 ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Nickname</h3>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={nickDraft}
                onChange={(e) => setNickDraft(e.target.value)}
                onBlur={commitNick}
                onKeyDown={(e) => { if (e.key === 'Enter') { commitNick(); (e.currentTarget as HTMLInputElement).blur(); } }}
                placeholder="2~16자 (한글/영어/숫자)"
                maxLength={16}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${nickDraft.length === 0 ? "rgba(255,255,255,0.1)" : nickValid ? "rgba(52,211,153,0.5)" : "rgba(239,68,68,0.5)"}`,
                }}
              />
              <button
                onClick={commitNick}
                disabled={!nickValid || nickDraft.trim() === nickname}
                className="px-3 py-2 rounded-lg text-[11px] font-black text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #FF6B35, #E85D2C)",
                  boxShadow: "0 2px 8px rgba(255,107,53,0.25)",
                }}
              >
                SAVE
              </button>
            </div>
            <p className="text-[9px] text-[#5A6A7E] mt-1.5 leading-tight">
              한글, 영어, 숫자, 공백, 점/밑줄/하이픈 허용 · 2~16자 · 저장 시 즉시 반영
            </p>
          </div>

          {/* V3 Task 4 Phase C: 방장 Rakeback */}
          {ownerRakeback && (ownerRakeback.totalEarned > 0 || ownerRakeback.pending > 0) && (
            <div>
              <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <span>👑</span> 방장 Rakeback
                <span className="text-[9px] font-normal text-[#4A5A70] ml-1">({ownerRakeback.percent}% 자동 적립)</span>
              </h3>
              <div className="p-3 rounded-xl space-y-2.5"
                style={{
                  background: "linear-gradient(135deg, rgba(255,215,0,0.06), rgba(245,158,11,0.03))",
                  border: "1px solid rgba(255,215,0,0.2)",
                }}>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg text-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <div className="text-[8px] text-[#6B7A90] uppercase tracking-wider">미청구</div>
                    <div className="text-[14px] font-mono font-black text-[#FBBF24]">
                      ₩{Math.floor(ownerRakeback.pending / 100).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <div className="text-[8px] text-[#6B7A90] uppercase tracking-wider">청구 완료</div>
                    <div className="text-[12px] font-mono font-bold text-[#8899AB]">
                      ₩{Math.floor(ownerRakeback.claimed / 100).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                    <div className="text-[8px] text-[#6B7A90] uppercase tracking-wider">총 적립</div>
                    <div className="text-[12px] font-mono font-bold text-[#34D399]">
                      ₩{Math.floor(ownerRakeback.totalEarned / 100).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClaimRakeback}
                  disabled={ownerRakeback.pending < 100000}
                  className="w-full py-2 rounded-lg text-[11px] font-black disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: ownerRakeback.pending >= 100000
                      ? "linear-gradient(135deg, #FBBF24, #F59E0B)"
                      : "rgba(255,255,255,0.05)",
                    color: ownerRakeback.pending >= 100000 ? "#0A0E14" : "#6B7A90",
                    boxShadow: ownerRakeback.pending >= 100000 ? "0 4px 14px rgba(251,191,36,0.3)" : "none",
                  }}
                >
                  💰 지갑으로 청구 {ownerRakeback.pending < 100000 && `(최소 ₩1,000 필요)`}
                </button>
                <p className="text-[9px] text-[#5A6A7E] text-center leading-tight">
                  내가 만든 방에서 발생한 레이크의 {ownerRakeback.percent}% 가 자동 적립됩니다
                </p>
              </div>
            </div>
          )}

          {/* ═══ Avatar Selection — 20종 ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Avatar</h3>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_IMAGES.map((img, i) => (
                <motion.button key={i} whileTap={{ scale: 0.9 }}
                  onClick={() => setAvatar(i)}
                  className="relative rounded-xl overflow-hidden aspect-square"
                  style={{
                    border: avatar === i ? "2px solid #FF6B35" : "2px solid rgba(255,255,255,0.04)",
                    boxShadow: avatar === i ? "0 0 12px rgba(255,107,53,0.3)" : "none",
                  }}>
                  <img src={img} alt={AVATAR_NAMES[i]} className="w-full h-full object-cover" />
                  {avatar === i && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check className="h-5 w-5 text-[#FF6B35]" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
            <div className="text-[10px] text-[#4A5A70] mt-2 text-center">
              Selected: <span className="text-[#FF6B35] font-semibold">{AVATAR_NAMES[avatar]}</span>
            </div>
          </div>

          {/* ═══ Country / 국가 (CountryPicker 컴포넌트 — ProfilePanel 과 공유) ═══ */}
          <CountryPicker
            value={countryCode}
            onChange={setCountryCode}
            label={<>Country <span className="text-[#4A5A70] normal-case tracking-normal">· 국가 (선택, 내 아바타 옆 국기)</span></>}
          />

          {/* ═══ Table Felt — V22 Phase 2+ 3색 picker 복구 ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">
              Table Felt <span className="text-[#4A5A70] normal-case tracking-normal">· 테이블 색상</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TABLE_FELTS).map(([id, felt]) => {
                const idNum = Number(id);
                const selected = tableFelt === idNum;
                return (
                  <button key={id} onClick={() => setTableFelt(idNum)}
                    className="p-3 rounded-xl text-center transition-all no-touch-min"
                    style={{
                      background: selected ? "rgba(255,107,53,0.08)" : "rgba(255,255,255,0.02)",
                      border: selected ? "1px solid rgba(255,107,53,0.35)" : "1px solid rgba(255,255,255,0.04)",
                    }}>
                    {/* 펠트 미니 프리뷰 */}
                    <div className="h-10 rounded-lg mb-2" style={{ background: felt.gradient, border: "1px solid rgba(255,255,255,0.1)" }} />
                    <div className="text-[11px] font-bold" style={{ color: selected ? "#FF6B35" : "#6B7A90" }}>{felt.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ Card Skin ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Card Style</h3>
            <div className="grid grid-cols-3 gap-2">
              {cardSkinList.map(skin => (
                <button key={skin.id} onClick={() => setCardSkin(skin.id)}
                  className="p-3 rounded-xl text-center transition-all"
                  style={{
                    background: cardSkin === skin.id ? "rgba(255,107,53,0.08)" : "rgba(255,255,255,0.02)",
                    border: cardSkin === skin.id ? "1px solid rgba(255,107,53,0.2)" : "1px solid rgba(255,255,255,0.04)",
                  }}>
                  <div className="flex justify-center gap-1 mb-2">
                    {skin.colors.map((c, i) => (
                      <div key={i} style={{ width: 12, height: 16, borderRadius: 2, background: c, border: "1px solid rgba(255,255,255,0.2)" }} />
                    ))}
                  </div>
                  <div className="text-[11px] font-bold" style={{ color: cardSkin === skin.id ? "#FF6B35" : "#6B7A90" }}>{skin.name}</div>
                  <div className="text-[9px] text-[#3A4A5A]">{skin.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ═══ Sound & Effects ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Sound & Effects</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#4A5A70]" />
                  <span className="text-xs text-[#8899AB]">Sound Effects</span>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={(v) => { setSoundEnabled(v); setMuted(!v); }} />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-[#4A5A70]" />
                  <span className="text-xs text-[#8899AB]">Background Music</span>
                </div>
                <Switch checked={musicEnabled} onCheckedChange={setMusicEnabled} />
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#4A5A70]" />
                  <span className="text-xs text-[#8899AB]">Card Animations</span>
                </div>
                <Switch checked={cardAnimations} onCheckedChange={setCardAnimations} />
              </div>

              {/* V3 P2B2: Run It Twice/Thrice 모드 선택 — 올인 상황에서 보드를 여러 번 돌려 variance 감소 */}
              <div className="px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-[#FBBF24]" />
                  <span className="text-xs text-[#8899AB]">Run It Twice</span>
                  <span className="ml-auto text-[9px] text-[#4A5A70] uppercase tracking-wider">올인 시 보드 N회</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['off', 'twice', 'thrice'] as const).map(m => (
                    <button key={m}
                      onClick={() => setRunItMode(m)}
                      className="py-1.5 rounded-md text-[10px] font-black tracking-wider transition-all"
                      style={{
                        background: runItMode === m
                          ? "linear-gradient(135deg, rgba(251,191,36,0.3), rgba(245,158,11,0.3))"
                          : "rgba(255,255,255,0.03)",
                        border: runItMode === m
                          ? "1px solid rgba(251,191,36,0.55)"
                          : "1px solid rgba(255,255,255,0.06)",
                        color: runItMode === m ? "#FBBF24" : "#6B7A8F",
                      }}>
                      {m === 'off' ? 'OFF' : m === 'twice' ? 'x2' : 'x3'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🎯 Show/Muck 모드 (2026-04-28) — 쇼다운 카드 공개 정책 */}
              <div className="px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-[#A78BFA]" />
                  <span className="text-xs text-[#8899AB]">쇼다운 카드 공개</span>
                  <span className="ml-auto text-[9px] text-[#4A5A70] uppercase tracking-wider">caller 만 적용</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['auto-show', 'ask', 'auto-muck'] as const).map(m => (
                    <button key={m}
                      onClick={() => setShowMuckMode(m)}
                      className="py-1.5 rounded-md text-[10px] font-black tracking-wider transition-all"
                      style={{
                        background: showMuckMode === m
                          ? "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(139,92,246,0.3))"
                          : "rgba(255,255,255,0.03)",
                        border: showMuckMode === m
                          ? "1px solid rgba(167,139,250,0.55)"
                          : "1px solid rgba(255,255,255,0.06)",
                        color: showMuckMode === m ? "#A78BFA" : "#6B7A8F",
                      }}>
                      {m === 'auto-show' ? '항상 공개' : m === 'ask' ? '매번 묻기' : '항상 머크'}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-[#4A5A70] mt-1.5 leading-tight">
                  마지막 베팅 한 사람은 룰상 강제 공개 — caller(콜만 한 사람) 만 선택 가능
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 pt-2" style={{ background: "#0F1520" }}>
          <button onClick={() => onOpenChange(false)}
            className="w-full py-2.5 rounded-lg text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)", boxShadow: "0 4px 15px rgba(255,107,53,0.25)" }}>
            Save & Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
