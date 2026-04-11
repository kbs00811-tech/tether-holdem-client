import { useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Switch } from "./ui/switch";
import { motion } from "motion/react";
import { Volume2, Music, Sparkles, Check } from "lucide-react";
import { setMuted, isMuted } from "../hooks/useSound";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: number;
  onChangeAvatar: (id: number) => void;
  currentCardSkin: number;
  onChangeCardSkin: (skin: number) => void;
}

const avatarImages = [
  "/src/assets/avatars/01_bull.png",
  "/src/assets/avatars/02_fox.png",
  "/src/assets/avatars/03_penguin.png",
  "/src/assets/avatars/04_ninja.png",
  "/src/assets/avatars/05_shark.png",
  "/src/assets/avatars/06_hacker.png",
  "/src/assets/avatars/07_phoenix.png",
  "/src/assets/avatars/08_wolf.png",
  "/src/assets/avatars/09_astronaut.png",
  "/src/assets/avatars/10_eagle.png",
];

const avatarNames = [
  "Bitcoin Bull", "Ethereum Fox", "Tether Penguin", "Cyber Ninja", "Diamond Shark",
  "Neon Hacker", "Phoenix Fire", "Crystal Wolf", "Astronaut", "Platinum Eagle",
];

const cardSkins = [
  { id: 1, name: "Classic", desc: "Traditional red & black", colors: ["#CC0000", "#111111"] },
  { id: 2, name: "4-Color", desc: "GGPoker style", colors: ["#CC0000", "#1D4ED8", "#059669", "#111111"] },
  { id: 3, name: "Neon", desc: "Cyberpunk glow", colors: ["#FF6B35", "#26A17B", "#A78BFA", "#FFD700"] },
];

const tableSkins = [
  { id: 1, name: "Emerald", color: "#1A7A50" },
  { id: 2, name: "Navy", color: "#1A2A50" },
  { id: 3, name: "Crimson", color: "#5A1A2A" },
  { id: 4, name: "Royal Purple", color: "#2A1A50" },
];

export function SettingsModal({
  open, onOpenChange, currentAvatar, onChangeAvatar, currentCardSkin, onChangeCardSkin,
}: SettingsModalProps) {
  const [soundEnabled, setSoundEnabled] = useState(!isMuted());
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [cardEffects, setCardEffects] = useState(true);
  const [selectedTable, setSelectedTable] = useState(1);

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

          {/* ═══ Avatar Selection ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Avatar</h3>
            <div className="grid grid-cols-5 gap-2">
              {avatarImages.map((img, i) => (
                <motion.button key={i} whileTap={{ scale: 0.9 }}
                  onClick={() => onChangeAvatar(i)}
                  className="relative rounded-xl overflow-hidden aspect-square"
                  style={{
                    border: currentAvatar === i ? "2px solid #FF6B35" : "2px solid rgba(255,255,255,0.04)",
                    boxShadow: currentAvatar === i ? "0 0 12px rgba(255,107,53,0.3)" : "none",
                  }}>
                  <img src={img} alt={avatarNames[i]} className="w-full h-full object-cover" />
                  {currentAvatar === i && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check className="h-5 w-5 text-[#FF6B35]" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
            <div className="text-[10px] text-[#4A5A70] mt-2 text-center">
              Selected: <span className="text-[#FF6B35] font-semibold">{avatarNames[currentAvatar]}</span>
            </div>
          </div>

          {/* ═══ Card Skin ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Card Style</h3>
            <div className="grid grid-cols-3 gap-2">
              {cardSkins.map(skin => (
                <button key={skin.id} onClick={() => onChangeCardSkin(skin.id)}
                  className="p-3 rounded-xl text-center transition-all"
                  style={{
                    background: currentCardSkin === skin.id ? "rgba(255,107,53,0.08)" : "rgba(255,255,255,0.02)",
                    border: currentCardSkin === skin.id ? "1px solid rgba(255,107,53,0.2)" : "1px solid rgba(255,255,255,0.04)",
                  }}>
                  <div className="flex justify-center gap-1 mb-2">
                    {skin.colors.map((c, i) => (
                      <div key={i} style={{ width: 12, height: 16, borderRadius: 2, background: c, border: "1px solid rgba(255,255,255,0.2)" }} />
                    ))}
                  </div>
                  <div className="text-[11px] font-bold" style={{ color: currentCardSkin === skin.id ? "#FF6B35" : "#6B7A90" }}>
                    {skin.name}
                  </div>
                  <div className="text-[9px] text-[#3A4A5A]">{skin.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ═══ Table Skin ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Table Felt</h3>
            <div className="flex gap-2">
              {tableSkins.map(skin => (
                <button key={skin.id} onClick={() => setSelectedTable(skin.id)}
                  className="flex-1 py-3 rounded-xl text-center transition-all"
                  style={{
                    background: skin.color,
                    border: selectedTable === skin.id ? "2px solid #FFD700" : "2px solid transparent",
                    boxShadow: selectedTable === skin.id ? "0 0 10px rgba(255,215,0,0.2)" : "none",
                    opacity: selectedTable === skin.id ? 1 : 0.5,
                  }}>
                  <div className="text-[10px] font-bold text-white/80">{skin.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ═══ Sound & Effects ═══ */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Sound & Effects</h3>
            <div className="space-y-3">
              {[
                { label: "Sound Effects", icon: Volume2, value: soundEnabled, onChange: (v: boolean) => { setSoundEnabled(v); setMuted(!v); } },
                { label: "Background Music", icon: Music, value: musicEnabled, onChange: setMusicEnabled },
                { label: "Card Animations", icon: Sparkles, value: cardEffects, onChange: setCardEffects },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-[#4A5A70]" />
                    <span className="text-xs text-[#8899AB]">{item.label}</span>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.onChange} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
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
