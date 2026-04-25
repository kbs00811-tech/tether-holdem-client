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
  // V22: 국가 (ISO 3166-1 alpha-2, null = 미선택)
  countryCode: string | null;
  syncedFromServer: boolean;

  setAvatar: (id: number) => void;
  setCardSkin: (id: number) => void;
  setTableFelt: (id: number) => void;
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setCardAnimations: (v: boolean) => void;
  setRunItMode: (m: 'off' | 'twice' | 'thrice') => void;
  setNickname: (n: string) => void;
  setCountryCode: (code: string | null) => void;
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
      countryCode: state.countryCode,
    }));
  } catch {}
}

// V22: 국가 코드를 홀덤 WS 서버에 즉시 전파
function syncCountryCodeToHoldemWs(countryCode: string | null) {
  import('../hooks/useSocket').then(mod => {
    try { mod.wsSend({ type: 'UPDATE_COUNTRY', countryCode } as any); } catch {}
  }).catch(() => {});
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
  countryCode: (saved as any).countryCode ?? null,
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
  setCountryCode: (code) => set(s => {
    // 유효성: ISO alpha-2 (영문 대문자 2자) 또는 null
    const normalized = code ? code.trim().toUpperCase() : null;
    if (normalized !== null && !/^[A-Z]{2}$/.test(normalized)) return s;
    const n = { ...s, countryCode: normalized };
    saveSettings(n);
    syncCountryCodeToHoldemWs(normalized);
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
  1: { name: "Classic", spades: "#0A0A12", hearts: "#CC0000", diamonds: "#CC0000", clubs: "#0A0A12" },
  2: { name: "4-Color", spades: "#0A0A12", hearts: "#CC0000", diamonds: "#1D4ED8", clubs: "#059669" },
  3: { name: "Neon", spades: "#A78BFA", hearts: "#FF6B35", diamonds: "#26A17B", clubs: "#FFD700" },
};

// Table felt — V22 Phase 2+ (2026-04-25): 사용자 요청으로 3색 picker 복구
// 1=Emerald (default, 클래식 카지노), 2=Navy (눈편함), 3=Crimson (대담)
// 카드/칩 가시성 유지 위해 모두 다크 톤 + 중앙 radial gradient 패턴 유지
export const TABLE_FELTS = {
  1: {
    name: "Emerald Pro",
    primary: "#1E8A5C",
    gradient: "radial-gradient(ellipse at 50% 40%, #1E8A5C 0%, #13613F 55%, #0A3A25 100%)",
  },
  2: {
    name: "Midnight Navy",
    primary: "#1E5A8A",
    gradient: "radial-gradient(ellipse at 50% 40%, #1E5A8A 0%, #143E61 55%, #0A2438 100%)",
  },
  3: {
    name: "Crimson Royale",
    primary: "#8A1E2F",
    gradient: "radial-gradient(ellipse at 50% 40%, #8A1E2F 0%, #611420 55%, #380A14 100%)",
  },
};

// V22: 지원 국가 목록 (ISO 3166-1 alpha-2) — 주요 포커 시장 30개
// 지역별 그룹 정렬 (Asia → Europe → Americas → Oceania → MENA → Africa)
export interface Country {
  code: string;      // ISO alpha-2 (예: 'KR')
  name: string;      // 영어 이름
  nameLocal?: string; // 현지 이름 (optional)
  flag: string;      // emoji 국기
  region: 'asia' | 'europe' | 'americas' | 'oceania' | 'mena' | 'africa';
}

export const COUNTRIES: Country[] = [
  // Asia (12)
  { code: 'KR', name: 'Korea',       nameLocal: '한국',       flag: '🇰🇷', region: 'asia' },
  { code: 'JP', name: 'Japan',       nameLocal: '日本',       flag: '🇯🇵', region: 'asia' },
  { code: 'CN', name: 'China',       nameLocal: '中国',       flag: '🇨🇳', region: 'asia' },
  { code: 'TW', name: 'Taiwan',      nameLocal: '台灣',       flag: '🇹🇼', region: 'asia' },
  { code: 'HK', name: 'Hong Kong',   nameLocal: '香港',       flag: '🇭🇰', region: 'asia' },
  { code: 'TH', name: 'Thailand',    nameLocal: 'ไทย',        flag: '🇹🇭', region: 'asia' },
  { code: 'VN', name: 'Vietnam',     nameLocal: 'Việt Nam',   flag: '🇻🇳', region: 'asia' },
  { code: 'PH', name: 'Philippines', nameLocal: 'Pilipinas',  flag: '🇵🇭', region: 'asia' },
  { code: 'ID', name: 'Indonesia',                            flag: '🇮🇩', region: 'asia' },
  { code: 'SG', name: 'Singapore',                            flag: '🇸🇬', region: 'asia' },
  { code: 'MY', name: 'Malaysia',                             flag: '🇲🇾', region: 'asia' },
  { code: 'IN', name: 'India',                                flag: '🇮🇳', region: 'asia' },
  // Europe (8)
  { code: 'GB', name: 'United Kingdom',                       flag: '🇬🇧', region: 'europe' },
  { code: 'DE', name: 'Germany',     nameLocal: 'Deutschland', flag: '🇩🇪', region: 'europe' },
  { code: 'FR', name: 'France',                               flag: '🇫🇷', region: 'europe' },
  { code: 'ES', name: 'Spain',       nameLocal: 'España',     flag: '🇪🇸', region: 'europe' },
  { code: 'IT', name: 'Italy',       nameLocal: 'Italia',     flag: '🇮🇹', region: 'europe' },
  { code: 'RU', name: 'Russia',      nameLocal: 'Россия',     flag: '🇷🇺', region: 'europe' },
  { code: 'UA', name: 'Ukraine',                              flag: '🇺🇦', region: 'europe' },
  { code: 'PL', name: 'Poland',                               flag: '🇵🇱', region: 'europe' },
  // Americas (5)
  { code: 'US', name: 'USA',                                  flag: '🇺🇸', region: 'americas' },
  { code: 'CA', name: 'Canada',                               flag: '🇨🇦', region: 'americas' },
  { code: 'BR', name: 'Brazil',      nameLocal: 'Brasil',     flag: '🇧🇷', region: 'americas' },
  { code: 'MX', name: 'Mexico',      nameLocal: 'México',     flag: '🇲🇽', region: 'americas' },
  { code: 'AR', name: 'Argentina',                            flag: '🇦🇷', region: 'americas' },
  // Oceania (2)
  { code: 'AU', name: 'Australia',                            flag: '🇦🇺', region: 'oceania' },
  { code: 'NZ', name: 'New Zealand',                          flag: '🇳🇿', region: 'oceania' },
  // MENA (2)
  { code: 'AE', name: 'UAE',                                  flag: '🇦🇪', region: 'mena' },
  { code: 'TR', name: 'Turkey',      nameLocal: 'Türkiye',    flag: '🇹🇷', region: 'mena' },
  // Africa (1)
  { code: 'ZA', name: 'South Africa',                         flag: '🇿🇦', region: 'africa' },
];

/** code 로 Country 찾기 (O(1) lookup 용 Map) */
const COUNTRY_MAP: Record<string, Country> = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));
export function getCountryByCode(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return COUNTRY_MAP[code.toUpperCase()];
}
