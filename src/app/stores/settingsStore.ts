/**
 * TETHER.BET Holdem - Settings Store (persisted to localStorage)
 */

import { create } from 'zustand';

interface SettingsState {
  avatar: number;           // 0-19
  cardSkin: number;         // 1=Classic, 2=4-Color, 3=Neon
  tableFelt: number;        // 1=Emerald, 2=Navy, 3=Crimson, 4=Purple
  soundEnabled: boolean;
  musicEnabled: boolean;
  cardAnimations: boolean;

  setAvatar: (id: number) => void;
  setCardSkin: (id: number) => void;
  setTableFelt: (id: number) => void;
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setCardAnimations: (v: boolean) => void;
}

// Load from localStorage
function loadSettings(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem('holdem-settings');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSettings(state: Partial<SettingsState>) {
  try {
    localStorage.setItem('holdem-settings', JSON.stringify({
      avatar: state.avatar, cardSkin: state.cardSkin, tableFelt: state.tableFelt,
      soundEnabled: state.soundEnabled, musicEnabled: state.musicEnabled, cardAnimations: state.cardAnimations,
    }));
  } catch {}
}

const saved = loadSettings();

export const useSettingsStore = create<SettingsState>((set) => ({
  avatar: saved.avatar ?? 3,
  cardSkin: saved.cardSkin ?? 1,
  tableFelt: saved.tableFelt ?? 1,
  soundEnabled: saved.soundEnabled ?? true,
  musicEnabled: saved.musicEnabled ?? true,
  cardAnimations: saved.cardAnimations ?? true,

  setAvatar: (id) => set(s => { const n = { ...s, avatar: id }; saveSettings(n); return n; }),
  setCardSkin: (id) => set(s => { const n = { ...s, cardSkin: id }; saveSettings(n); return n; }),
  setTableFelt: (id) => set(s => { const n = { ...s, tableFelt: id }; saveSettings(n); return n; }),
  setSoundEnabled: (v) => set(s => { const n = { ...s, soundEnabled: v }; saveSettings(n); return n; }),
  setMusicEnabled: (v) => set(s => { const n = { ...s, musicEnabled: v }; saveSettings(n); return n; }),
  setCardAnimations: (v) => set(s => { const n = { ...s, cardAnimations: v }; saveSettings(n); return n; }),
}));

// Avatar image paths
export const AVATAR_IMAGES = [
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
  "/src/assets/avatars/11_latina.png",
  "/src/assets/avatars/12_asian_man.png",
  "/src/assets/avatars/13_euro_woman.png",
  "/src/assets/avatars/14_euro_man.png",
  "/src/assets/avatars/15_brazilian.png",
  "/src/assets/avatars/16_middle_east.png",
  "/src/assets/avatars/17_russian.png",
  "/src/assets/avatars/18_korean.png",
  "/src/assets/avatars/19_nordic.png",
  "/src/assets/avatars/20_asian_woman.png",
];

export const AVATAR_NAMES = [
  "Bitcoin Bull", "Ethereum Fox", "Tether Penguin", "Cyber Ninja", "Diamond Shark",
  "Neon Hacker", "Phoenix Fire", "Crystal Wolf", "Astronaut", "Platinum Eagle",
  "Latina Queen", "Asian Gentleman", "Euro Femme", "Euro Gentleman", "Brazilian Goddess",
  "Middle East Prince", "Russian Ice Queen", "Korean Idol", "Nordic Viking", "Asian Beauty",
];

// Card skin color configs
export const CARD_SKINS = {
  1: { name: "Classic", spades: "#111111", hearts: "#CC0000", diamonds: "#CC0000", clubs: "#111111" },
  2: { name: "4-Color", spades: "#111111", hearts: "#CC0000", diamonds: "#1D4ED8", clubs: "#059669" },
  3: { name: "Neon", spades: "#A78BFA", hearts: "#FF6B35", diamonds: "#26A17B", clubs: "#FFD700" },
};

// Table felt colors
export const TABLE_FELTS = {
  1: { name: "Emerald", primary: "#1A7A50", gradient: "radial-gradient(ellipse at 50% 40%, #1A7A50 0%, #167045 15%, #126540 30%, #0E5838 45%, #0B4C30 60%, #084028 75%, #063622 90%, #052E1C 100%)" },
  2: { name: "Navy", gradient: "radial-gradient(ellipse at 50% 40%, #1A3A6A 0%, #152F5A 15%, #102550 30%, #0C1E48 45%, #081840 60%, #061238 75%, #040E30 90%, #030A28 100%)" },
  3: { name: "Crimson", gradient: "radial-gradient(ellipse at 50% 40%, #6A1A2A 0%, #5A1525 15%, #501020 30%, #480C1A 45%, #400818 60%, #380615 75%, #300410 90%, #28030C 100%)" },
  4: { name: "Royal Purple", gradient: "radial-gradient(ellipse at 50% 40%, #3A1A6A 0%, #30155A 15%, #281050 30%, #200C48 45%, #1A0840 60%, #140638 75%, #100430 90%, #0C0328 100%)" },
};
