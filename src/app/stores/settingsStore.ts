/**
 * TETHER.BET Holdem - Settings Store (persisted to localStorage + server sync)
 *
 * 아바타 변경 시 자동으로 B2C 서버에 저장 (다른 기기 로그인 시 동기화).
 * 서버 호출 실패 시에도 로컬은 정상 동작.
 */

import { create } from 'zustand';
import { updateProfile, getProfile, canUseServerStats } from '../utils/profileApi';

interface SettingsState {
  avatar: number;           // 0-55
  cardSkin: number;         // 1=Classic, 2=4-Color, 3=Neon
  tableFelt: number;        // 1=Emerald, 2=Navy, 3=Crimson, 4=Purple
  soundEnabled: boolean;
  musicEnabled: boolean;
  cardAnimations: boolean;
  // V3 P2B2: Run It Twice/Thrice 선호 설정
  runItMode: 'off' | 'twice' | 'thrice';
  // V3 P2C1: 커스텀 닉네임 (한글/영어 2~16자) — 빈 문자열이면 서버 기본값 사용
  nickname: string;
  syncedFromServer: boolean;

  setAvatar: (id: number) => void;
  setCardSkin: (id: number) => void;
  setTableFelt: (id: number) => void;
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setCardAnimations: (v: boolean) => void;
  setRunItMode: (m: 'off' | 'twice' | 'thrice') => void;
  setNickname: (n: string) => void;
  loadFromServer: () => Promise<void>;
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
      runItMode: state.runItMode,
      nickname: state.nickname,
    }));
  } catch {}
}

// V3 P2C1: 닉네임을 홀덤 WS 에 즉시 전파
function syncNicknameToHoldemWs(nickname: string) {
  import('../hooks/useSocket').then(mod => {
    try { mod.wsSend({ type: 'UPDATE_NICKNAME', nickname } as any); } catch {}
  }).catch(() => {});
}

// V3 P2B2: Run It Twice/Thrice 모드를 홀덤 WS 서버에 즉시 전파
function syncRunItModeToHoldemWs(mode: 'off' | 'twice' | 'thrice') {
  import('../hooks/useSocket').then(mod => {
    try { mod.wsSend({ type: 'SET_RUN_IT_MODE', mode } as any); } catch {}
  }).catch(() => {});
}

const saved = loadSettings();

// B2C 프로필 동기화 (fire-and-forget)
function syncAvatarToServer(avatarId: number) {
  if (!canUseServerStats()) return;
  updateProfile({ avatar_id: avatarId }).catch(() => {});
}

// 홀덤 WS 서버에 즉시 전파 — 착석 중이면 player.avatarId 갱신 + 같은 방 broadcast
// 동적 import로 순환 의존성 회피
function syncAvatarToHoldemWs(avatarId: number) {
  import('../hooks/useSocket').then(mod => {
    try { mod.wsSend({ type: 'UPDATE_AVATAR', avatarId } as any); } catch {}
  }).catch(() => {});
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  avatar: saved.avatar ?? 3,
  cardSkin: saved.cardSkin ?? 1,
  tableFelt: saved.tableFelt ?? 1,
  soundEnabled: saved.soundEnabled ?? true,
  musicEnabled: saved.musicEnabled ?? true,
  cardAnimations: saved.cardAnimations ?? true,
  runItMode: (saved as any).runItMode ?? 'off',
  nickname: (saved as any).nickname ?? '',
  syncedFromServer: false,

  setAvatar: (id) => set(s => {
    const n = { ...s, avatar: id };
    saveSettings(n);
    syncAvatarToServer(id);
    syncAvatarToHoldemWs(id);  // 홀덤 게임룸 즉시 반영
    return n;
  }),
  setCardSkin: (id) => set(s => { const n = { ...s, cardSkin: id }; saveSettings(n); return n; }),
  setTableFelt: (id) => set(s => { const n = { ...s, tableFelt: id }; saveSettings(n); return n; }),
  setSoundEnabled: (v) => set(s => { const n = { ...s, soundEnabled: v }; saveSettings(n); return n; }),
  setMusicEnabled: (v) => set(s => { const n = { ...s, musicEnabled: v }; saveSettings(n); return n; }),
  setCardAnimations: (v) => set(s => { const n = { ...s, cardAnimations: v }; saveSettings(n); return n; }),
  setRunItMode: (m) => set(s => {
    const n = { ...s, runItMode: m };
    saveSettings(n);
    syncRunItModeToHoldemWs(m);
    return n;
  }),
  setNickname: (nn) => set(s => {
    // V3 P2C1: 클라 유효성 검증 (한글/영어/숫자 2~16자) — 서버에서 재검증
    const trimmed = (nn || '').trim();
    if (trimmed.length < 2 || trimmed.length > 16) return s;
    if (!/^[가-힣a-zA-Z0-9 ._-]+$/.test(trimmed)) return s;
    const next = { ...s, nickname: trimmed };
    saveSettings(next);
    syncNicknameToHoldemWs(trimmed);
    return next;
  }),

  loadFromServer: async () => {
    if (!canUseServerStats() || get().syncedFromServer) return;
    try {
      const profile = await getProfile();
      set(s => {
        // V3 P2E BUGFIX: localStorage 에 사용자가 저장한 아바타가 있으면 서버 값으로 덮어쓰지 않음
        //   이전 버그: 사용자가 아바타 변경 후 새로고침하면 서버의 옛 값이 localStorage 를 덮어써 리셋됨
        //   수정: 로컬 우선(last-write-wins 사용자 기준) + 서버와 불일치 시 로컬을 서버로 푸시 (pull-then-push 대신 push-only sync)
        const rawLocal = loadSettings() as any;
        const localHasAvatar = typeof rawLocal.avatar === 'number';
        const serverAvatar = typeof profile.avatar_id === 'number' ? profile.avatar_id : null;

        let finalAvatar = s.avatar;
        if (localHasAvatar) {
          // 로컬이 진실의 원천 — 서버 값 무시
          finalAvatar = s.avatar;
          // 서버와 다르면 로컬 → 서버 재푸시 (동기화 복구)
          if (serverAvatar !== null && serverAvatar !== s.avatar) {
            console.log(`[settings] Avatar drift detected: local=${s.avatar} vs server=${serverAvatar}. Pushing local to server.`);
            syncAvatarToServer(s.avatar);
          }
        } else if (serverAvatar !== null) {
          // 로컬 값 없음 (첫 로그인) → 서버 값 채택
          finalAvatar = serverAvatar;
        }

        const next = {
          ...s,
          avatar: finalAvatar,
          syncedFromServer: true,
        };
        saveSettings(next);
        return next;
      });
    } catch (e) {
      console.warn('[settings] Failed to load from server:', e);
    }
  },
}));

// 부팅 시 서버에서 로드 (iframe에 token이 있을 때만)
if (typeof window !== 'undefined') {
  // 약간 지연시켜 초기 렌더 후 로드
  setTimeout(() => {
    useSettingsStore.getState().loadFromServer();
  }, 1000);
}

// Avatar image paths — 56개 (카테고리별 정렬: 인물 → 동물 → 크립토/판타지)
export const AVATAR_IMAGES = [
  // 인물 (28)
  "/avatars/01_hacker_led.png",
  "/avatars/05_latina_gold.png",
  "/avatars/09_brazilian.png",
  "/avatars/10_asian_man.png",
  "/avatars/11_euro_man.png",
  "/avatars/12_middle_east.png",
  "/avatars/15_cyber_ninja.png",
  "/avatars/18_nordic.png",
  "/avatars/20_russian.png",
  "/avatars/21_euro_woman.png",
  "/avatars/22_korean.png",
  "/avatars/26_queen.png",
  "/avatars/27_star_player.png",
  "/avatars/29_joker.png",
  "/avatars/36_asian_woman.png",
  "/avatars/38_magician.png",
  "/avatars/39_ninja_shadow.png",
  "/avatars/41_king.png",
  "/avatars/43_ace_high.png",
  "/avatars/44_pirate.png",
  "/avatars/48_cowboy.png",
  "/avatars/49_samurai.png",
  "/avatars/51_italian_mafia.png",
  "/avatars/52_latina_fierce.png",
  "/avatars/53_latina_hoops.png",
  "/avatars/54_african_queen.png",
  "/avatars/55_korean_pro.png",
  "/avatars/56_asian_confident.png",
  // 동물 (14)
  "/avatars/02_arctic_wolf.png",
  "/avatars/03_eagle_platinum.png",
  "/avatars/04_eagle_golden.png",
  "/avatars/06_penguin_king.png",
  "/avatars/13_diamond_shark.png",
  "/avatars/14_shark_anthro.png",
  "/avatars/19_eth_fox.png",
  "/avatars/30_fox_tricky.png",
  "/avatars/32_tiger.png",
  "/avatars/34_panda.png",
  "/avatars/35_owl.png",
  "/avatars/37_cobra.png",
  "/avatars/40_bear.png",
  "/avatars/50_wolf_alpha.png",
  // 크립토/판타지 (14)
  "/avatars/07_astronaut_galaxy.png",
  "/avatars/08_bitcoin_bull.png",
  "/avatars/16_phoenix_mythical.png",
  "/avatars/17_phoenix_flame.png",
  "/avatars/23_angel.png",
  "/avatars/24_usdt_holder.png",
  "/avatars/25_astronaut_cosmic.png",
  "/avatars/28_diamond_hands.png",
  "/avatars/31_vampire.png",
  "/avatars/33_robot.png",
  "/avatars/42_bitcoin_bro.png",
  "/avatars/45_fire_stack.png",
  "/avatars/46_devil.png",
  "/avatars/47_dragon.png",
];

export const AVATAR_NAMES = [
  "Bitcoin Bull", "Ethereum Fox", "Tether Penguin", "Cyber Ninja", "Diamond Shark",
  "Neon Hacker", "Phoenix Fire", "Crystal Wolf", "Astronaut", "Platinum Eagle",
  "Latina Queen", "Asian Gentleman", "Euro Femme", "Euro Gentleman", "Brazilian Goddess",
  "Middle East Prince", "Russian Ice Queen", "Korean Idol", "Nordic Viking", "Asian Beauty",
];

// Card skin color configs
export const CARD_SKINS = {
  1: { name: "Classic", spades: "#1B1B3A", hearts: "#CC0000", diamonds: "#CC0000", clubs: "#1B1B3A" },
  2: { name: "4-Color", spades: "#1B1B3A", hearts: "#CC0000", diamonds: "#1D4ED8", clubs: "#059669" },
  3: { name: "Neon", spades: "#A78BFA", hearts: "#FF6B35", diamonds: "#26A17B", clubs: "#FFD700" },
};

// Table felt colors
export const TABLE_FELTS = {
  1: { name: "Emerald", primary: "#1A7A50", gradient: "radial-gradient(ellipse at 50% 40%, #1A7A50 0%, #167045 15%, #126540 30%, #0E5838 45%, #0B4C30 60%, #084028 75%, #063622 90%, #052E1C 100%)" },
  2: { name: "Navy", gradient: "radial-gradient(ellipse at 50% 40%, #1A3A6A 0%, #152F5A 15%, #102550 30%, #0C1E48 45%, #081840 60%, #061238 75%, #040E30 90%, #030A28 100%)" },
  3: { name: "Crimson", gradient: "radial-gradient(ellipse at 50% 40%, #6A1A2A 0%, #5A1525 15%, #501020 30%, #480C1A 45%, #400818 60%, #380615 75%, #300410 90%, #28030C 100%)" },
  4: { name: "Royal Purple", gradient: "radial-gradient(ellipse at 50% 40%, #3A1A6A 0%, #30155A 15%, #281050 30%, #200C48 45%, #1A0840 60%, #140638 75%, #100430 90%, #0C0328 100%)" },
};
