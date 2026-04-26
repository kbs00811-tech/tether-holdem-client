// Poker Hand Ranking Icons — 20×20 SVG mini icons

interface HandIconProps {
  size?: number;
  className?: string;
}

const miniCard = (x: number, y: number, color: string, filled = true) =>
  `<rect x="${x}" y="${y}" width="4" height="5.5" rx="0.6" fill="${filled ? color : 'none'}" stroke="${color}" stroke-width="0.5" opacity="${filled ? 1 : 0.4}"/>`;

const suits = { s: "#1A1A2E", h: "#FF4757", d: "#FF6B81", c: "#1A1A2E" };

function SVGIcon({ size = 20, className, svg }: HandIconProps & { svg: string }) {
  return (
    <div className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{
        __html: `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`
      }} />
  );
}

// 1. Royal Flush — 5 cards with crown
export function RoyalFlushIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(1, 6, suits.h)} ${miniCard(4.5, 5, suits.h)} ${miniCard(8, 4, suits.h)} ${miniCard(11.5, 5, suits.h)} ${miniCard(15, 6, suits.h)}
    <path d="M7 2L10 4L13 2L12 5H8L7 2Z" fill="#FFD700" opacity="0.8"/>
  `} />;
}

// 2. Straight Flush — 5 sequential cards same suit
export function StraightFlushIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(1, 9, suits.s)} ${miniCard(4.5, 7.5, suits.s)} ${miniCard(8, 6, suits.s)} ${miniCard(11.5, 4.5, suits.s)} ${miniCard(15, 3, suits.s)}
    <line x1="3" y1="13.5" x2="17" y2="6" stroke="#26A17B" stroke-width="0.8" stroke-dasharray="1.5 1" opacity="0.5"/>
  `} />;
}

// 3. Four of a Kind — 4 highlighted + 1 dim
export function FourOfAKindIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(1, 7, suits.s)} ${miniCard(4.5, 7, suits.h)} ${miniCard(8, 7, suits.d)} ${miniCard(11.5, 7, suits.c)}
    ${miniCard(15, 7, "#666", false)}
    <text x="10" y="5.5" text-anchor="middle" font-size="4" font-weight="800" fill="#FFD700" font-family="JetBrains Mono, monospace">×4</text>
  `} />;
}

// 4. Full House — 3+2
export function FullHouseIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(1, 7, suits.h)} ${miniCard(4.5, 7, suits.d)} ${miniCard(8, 7, suits.c)}
    ${miniCard(12, 7, suits.s)} ${miniCard(15.5, 7, suits.h)}
    <line x1="10.5" y1="6" x2="10.5" y2="14" stroke="#6B7A90" stroke-width="0.4" opacity="0.4"/>
    <text x="5" y="5" text-anchor="middle" font-size="3" fill="#FF6B35" font-weight="700">3</text>
    <text x="14" y="5" text-anchor="middle" font-size="3" fill="#8B5CF6" font-weight="700">2</text>
  `} />;
}

// 5. Flush — 5 same suit fanned
export function FlushIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(1, 7, suits.d)} ${miniCard(4.5, 7, suits.d)} ${miniCard(8, 7, suits.d)} ${miniCard(11.5, 7, suits.d)} ${miniCard(15, 7, suits.d)}
    <text x="10" y="5" text-anchor="middle" font-size="5" fill="#FF6B81" opacity="0.6">♦</text>
  `} />;
}

// 6. Straight — ascending
export function StraightIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(1, 10, suits.s)} ${miniCard(4.5, 8.5, suits.h)} ${miniCard(8, 7, suits.d)} ${miniCard(11.5, 5.5, suits.c)} ${miniCard(15, 4, suits.h)}
    <line x1="3" y1="14.5" x2="17" y2="6.5" stroke="#22D3EE" stroke-width="0.8" opacity="0.5"/>
  `} />;
}

// 7. Three of a Kind
export function ThreeOfAKindIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(3, 7, suits.s)} ${miniCard(8, 7, suits.h)} ${miniCard(13, 7, suits.d)}
    <text x="10" y="5" text-anchor="middle" font-size="4" font-weight="800" fill="#FF6B35" font-family="JetBrains Mono, monospace">×3</text>
  `} />;
}

// 8. Two Pair
export function TwoPairIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(1.5, 7, suits.h)} ${miniCard(5, 7, suits.d)}
    ${miniCard(10, 7, suits.s)} ${miniCard(13.5, 7, suits.c)}
    <text x="8" y="5" text-anchor="middle" font-size="3" fill="#A78BFA" font-weight="700">2+2</text>
  `} />;
}

// 9. One Pair
export function OnePairIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(6, 7, suits.h)} ${miniCard(10, 7, suits.d)}
    <text x="10" y="5" text-anchor="middle" font-size="3" fill="#6B7A90" font-weight="700">×2</text>
  `} />;
}

// 10. High Card
export function HighCardIcon(p: HandIconProps) {
  return <SVGIcon {...p} svg={`
    ${miniCard(8, 5, suits.s)}
    <text x="10" y="8" text-anchor="middle" font-size="3.5" font-weight="800" fill="#1A1A2E" font-family="JetBrains Mono, monospace">A</text>
    <text x="10" y="15" text-anchor="middle" font-size="2.5" fill="#6B7A90">HIGH</text>
  `} />;
}

// All hand rankings in order
export const handRankings = [
  { name: "Royal Flush", icon: RoyalFlushIcon, rarity: "legendary" },
  { name: "Straight Flush", icon: StraightFlushIcon, rarity: "epic" },
  { name: "Four of a Kind", icon: FourOfAKindIcon, rarity: "epic" },
  { name: "Full House", icon: FullHouseIcon, rarity: "rare" },
  { name: "Flush", icon: FlushIcon, rarity: "rare" },
  { name: "Straight", icon: StraightIcon, rarity: "uncommon" },
  { name: "Three of a Kind", icon: ThreeOfAKindIcon, rarity: "uncommon" },
  { name: "Two Pair", icon: TwoPairIcon, rarity: "common" },
  { name: "One Pair", icon: OnePairIcon, rarity: "common" },
  { name: "High Card", icon: HighCardIcon, rarity: "common" },
] as const;
