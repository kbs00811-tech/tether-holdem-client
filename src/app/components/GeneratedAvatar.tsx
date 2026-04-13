/**
 * TETHER.BET — Generated SVG Avatars (GGPoker Style)
 * 40개 캐릭터 — 프로그래밍으로 생성된 컬러풀 SVG
 */

interface AvatarProps {
  id: number;
  size?: number;
}

// 40개 캐릭터 정의
export const AVATAR_THEMES = [
  // 동물 (1-15)
  { name: "Lion King",      bg: ["#FFD700", "#B8860B"], face: "🦁", accent: "#FF4500" },
  { name: "Tiger Pro",      bg: ["#FF8C00", "#8B4513"], face: "🐯", accent: "#000" },
  { name: "Wolf Alpha",     bg: ["#708090", "#2F4F4F"], face: "🐺", accent: "#C0C0C0" },
  { name: "Eagle Eye",      bg: ["#8B4513", "#3E2723"], face: "🦅", accent: "#FFD700" },
  { name: "Shark Bite",     bg: ["#00CED1", "#006B6B"], face: "🦈", accent: "#FFF" },
  { name: "Fox Tricky",     bg: ["#FF6347", "#8B0000"], face: "🦊", accent: "#FFF" },
  { name: "Bear Power",     bg: ["#8B4513", "#3E2723"], face: "🐻", accent: "#D2691E" },
  { name: "Penguin",        bg: ["#1E90FF", "#000"], face: "🐧", accent: "#FFA500" },
  { name: "Owl Wise",       bg: ["#9370DB", "#4B0082"], face: "🦉", accent: "#FFD700" },
  { name: "Dragon",         bg: ["#DC143C", "#8B0000"], face: "🐉", accent: "#FFD700" },
  { name: "Phoenix",        bg: ["#FF4500", "#8B0000"], face: "🔥", accent: "#FFD700" },
  { name: "Cobra",          bg: ["#228B22", "#006400"], face: "🐍", accent: "#FFFF00" },
  { name: "Bull",           bg: ["#8B0000", "#3E2723"], face: "🐂", accent: "#FFD700" },
  { name: "Panda",          bg: ["#FFF", "#000"], face: "🐼", accent: "#90EE90" },
  { name: "Monkey",         bg: ["#A0522D", "#3E2723"], face: "🐵", accent: "#FFD700" },

  // 캐릭터 (16-30)
  { name: "King",           bg: ["#FFD700", "#B8860B"], face: "👑", accent: "#FF0000" },
  { name: "Queen",          bg: ["#FFB6C1", "#C71585"], face: "👸", accent: "#FFD700" },
  { name: "Ninja",          bg: ["#000", "#1F2937"], face: "🥷", accent: "#FF0000" },
  { name: "Samurai",        bg: ["#8B0000", "#1F2937"], face: "⚔️", accent: "#FFD700" },
  { name: "Wizard",         bg: ["#4B0082", "#000"], face: "🧙", accent: "#9370DB" },
  { name: "Pirate",         bg: ["#8B4513", "#000"], face: "🏴‍☠️", accent: "#FFD700" },
  { name: "Cowboy",         bg: ["#D2691E", "#8B4513"], face: "🤠", accent: "#FFD700" },
  { name: "Astronaut",      bg: ["#1E3A8A", "#000"], face: "👨‍🚀", accent: "#C0C0C0" },
  { name: "Robot",          bg: ["#708090", "#1F2937"], face: "🤖", accent: "#00FFFF" },
  { name: "Vampire",        bg: ["#8B0000", "#000"], face: "🧛", accent: "#FF0000" },
  { name: "Devil",          bg: ["#DC143C", "#000"], face: "😈", accent: "#FFD700" },
  { name: "Angel",          bg: ["#F0F8FF", "#FFD700"], face: "👼", accent: "#FFFFFF" },
  { name: "Joker",          bg: ["#9370DB", "#FFD700"], face: "🃏", accent: "#FF0000" },
  { name: "Magician",       bg: ["#000", "#FFD700"], face: "🎩", accent: "#FFFFFF" },
  { name: "Knight",         bg: ["#C0C0C0", "#1F2937"], face: "🛡️", accent: "#FFD700" },

  // 크립토/포커 테마 (31-40)
  { name: "Bitcoin Bro",    bg: ["#F7931A", "#8B4513"], face: "₿", accent: "#FFF" },
  { name: "ETH Whale",      bg: ["#627EEA", "#1E3A8A"], face: "Ξ", accent: "#FFF" },
  { name: "USDT Holder",    bg: ["#26A17B", "#0E5938"], face: "₮", accent: "#FFD700" },
  { name: "Diamond Hands",  bg: ["#00CED1", "#FFFFFF"], face: "💎", accent: "#1E3A8A" },
  { name: "Money Bag",      bg: ["#228B22", "#FFD700"], face: "💰", accent: "#FFF" },
  { name: "Fire Stack",     bg: ["#FF4500", "#FFD700"], face: "🔥", accent: "#FFF" },
  { name: "Star Player",    bg: ["#FFD700", "#FF6347"], face: "⭐", accent: "#FFF" },
  { name: "Trophy Hunter",  bg: ["#FFD700", "#8B6914"], face: "🏆", accent: "#FFF" },
  { name: "Crown Royal",    bg: ["#9370DB", "#FFD700"], face: "👑", accent: "#FFF" },
  { name: "Ace High",       bg: ["#FF0000", "#000"], face: "🃏", accent: "#FFD700" },
];

export function GeneratedAvatar({ id, size = 64 }: AvatarProps) {
  const theme = AVATAR_THEMES[id % AVATAR_THEMES.length]!;
  const [bgStart, bgEnd] = theme.bg;
  const gradId = `g-${id}`;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ borderRadius: "50%", display: "block" }}>
      <defs>
        <radialGradient id={gradId} cx="40%" cy="35%">
          <stop offset="0%" stopColor={bgStart} />
          <stop offset="100%" stopColor={bgEnd} />
        </radialGradient>
      </defs>
      {/* 배경 원 */}
      <circle cx="50" cy="50" r="50" fill={`url(#${gradId})`} />
      {/* 외곽 링 */}
      <circle cx="50" cy="50" r="48" fill="none" stroke={theme.accent} strokeWidth="1.5" opacity="0.6" />
      {/* 중앙 이모지/심볼 */}
      <text x="50" y="65" textAnchor="middle" fontSize="50" style={{ fontFamily: "Apple Color Emoji, Segoe UI Emoji, sans-serif" }}>
        {theme.face}
      </text>
      {/* 상단 광택 */}
      <ellipse cx="35" cy="25" rx="20" ry="10" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

/** 아바타 ID → 이름 */
export function getAvatarName(id: number): string {
  return AVATAR_THEMES[id % AVATAR_THEMES.length]!.name;
}

/** 총 아바타 개수 */
export const TOTAL_GENERATED_AVATARS = AVATAR_THEMES.length;
