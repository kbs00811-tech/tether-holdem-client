import { PokerCard, type Suit, type Rank } from "../components/PokerCard";
import { PokerChip } from "../components/PokerChip";
import { PokerAvatar } from "../components/PokerAvatar";
import { PokerTableSVG } from "../components/PokerTableSVG";
import { DealerButton, SmallBlindMarker, BigBlindMarker } from "../components/PositionMarkers";
import { FoldIcon, CheckIcon, CallIcon, RaiseIcon, AllInIcon } from "../components/ActionIcons";
import { handRankings } from "../components/HandRankIcons";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const ranks: Rank[] = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const chipValues: (1 | 5 | 25 | 100 | 500 | 1000)[] = [1, 5, 25, 100, 500, 1000];

export default function AssetShowcase() {
  return (
    <div className="min-h-screen pb-20">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <button className="p-2 rounded-lg text-[#6B7A90] hover:text-white" style={{ background: "rgba(255,255,255,0.03)" }}>
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">Game Assets</h1>
            <p className="text-xs text-[#6B7A90]">TETHER.BET — Complete Asset Library</p>
          </div>
        </div>

        {/* ===== 1. POKER TABLE ===== */}
        <Section title="1. Poker Table" desc="Top-view oval table — Desktop 1200×600, Mobile 600×400">
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden" style={{ background: "#080C12" }}>
              <PokerTableSVG variant="desktop" />
            </div>
            <div className="max-w-sm rounded-xl overflow-hidden" style={{ background: "#080C12" }}>
              <PokerTableSVG variant="mobile" />
            </div>
          </div>
        </Section>

        {/* ===== 2. CARD DECK (52 + Back) ===== */}
        <Section title="2. Card Deck" desc="52 cards + back — 120×168px base (2:2.8 ratio)">
          {/* Card Back */}
          <div className="mb-4">
            <Label>Card Back</Label>
            <div className="flex gap-2 items-end">
              <PokerCard suit="spades" rank="A" faceDown size="xs" />
              <PokerCard suit="spades" rank="A" faceDown size="sm" />
              <PokerCard suit="spades" rank="A" faceDown size="md" />
              <PokerCard suit="spades" rank="A" faceDown size="lg" />
              <PokerCard suit="spades" rank="A" faceDown size="xl" />
            </div>
          </div>

          {/* Highlighted hero cards */}
          <div className="mb-6">
            <Label>Highlighted (Hero Cards)</Label>
            <div className="flex gap-2">
              <PokerCard suit="spades" rank="A" highlight size="lg" />
              <PokerCard suit="spades" rank="K" highlight size="lg" />
              <PokerCard suit="hearts" rank="A" highlight size="lg" />
              <PokerCard suit="hearts" rank="K" highlight size="lg" />
            </div>
          </div>

          {/* Full deck by suit */}
          {suits.map((suit) => (
            <div key={suit} className="mb-4">
              <Label>{suit.charAt(0).toUpperCase() + suit.slice(1)}</Label>
              <div className="flex flex-wrap gap-1.5">
                {ranks.map((rank) => (
                  <PokerCard key={`${suit}-${rank}`} suit={suit} rank={rank} size="sm" />
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* ===== 3. CHIPS ===== */}
        <Section title="3. Chips" desc="6 denominations — denominations">
          <div className="flex flex-wrap gap-6">
            {chipValues.map((v) => (
              <div key={v} className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-1.5">
                  <PokerChip value={v} size="sm" />
                  <PokerChip value={v} size="md" />
                  <PokerChip value={v} size="lg" />
                  <PokerChip value={v} size="xl" />
                </div>
                <span className="text-[10px] font-mono text-[#6B7A90]">{getSymbol()}{v.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Chip stacks */}
          <div className="mt-6">
            <Label>Chip Stacks</Label>
            <div className="flex gap-8">
              {chipValues.map((v) => (
                <div key={`stack-${v}`} className="flex flex-col-reverse items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ marginTop: i > 0 ? -20 : 0 }}>
                      <PokerChip value={v} size="md" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ===== 4. POSITION MARKERS ===== */}
        <Section title="4. Position Markers" desc="Dealer (30×30), SB (24×24), BB (24×24)">
          <div className="flex items-center gap-6">
            <MarkerLabel label="Dealer">
              <DealerButton size={30} />
              <DealerButton size={40} />
            </MarkerLabel>
            <MarkerLabel label="Small Blind">
              <SmallBlindMarker size={24} />
              <SmallBlindMarker size={32} />
            </MarkerLabel>
            <MarkerLabel label="Big Blind">
              <BigBlindMarker size={24} />
              <BigBlindMarker size={32} />
            </MarkerLabel>
          </div>
        </Section>

        {/* ===== 5. AVATARS ===== */}
        <Section title="5. Avatars (12)" desc="Crypto-themed characters — 64×64px">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <PokerAvatar avatarId={i} size="lg" online={i % 3 !== 2} />
                <span className="text-[9px] text-[#6B7A90] text-center leading-tight">
                  {["Bitcoin Bulldog", "Ethereum Cat", "Tether Penguin", "Rocket Astronaut",
                    "Cyber Ninja", "Neon Hacker", "Diamond Fox", "Gold Lion",
                    "Silver Wolf", "Crystal Dragon", "Platinum Eagle", "Rainbow Unicorn"][i]}
                </span>
              </div>
            ))}
          </div>
          {/* All sizes */}
          <div className="mt-4">
            <Label>Size Variants</Label>
            <div className="flex items-end gap-3">
              <PokerAvatar avatarId={3} size="sm" />
              <PokerAvatar avatarId={3} size="md" />
              <PokerAvatar avatarId={3} size="lg" />
              <PokerAvatar avatarId={3} size="xl" />
            </div>
          </div>
        </Section>

        {/* ===== 6. ACTION ICONS ===== */}
        <Section title="6. Action Icons" desc="FOLD, CHECK, CALL, RAISE, ALL-IN — 24×24">
          <div className="flex gap-6">
            {[
              { name: "FOLD", Icon: FoldIcon, color: "#FF4757" },
              { name: "CHECK", Icon: CheckIcon, color: "#26A17B" },
              { name: "CALL", Icon: CallIcon, color: "#26A17B" },
              { name: "RAISE", Icon: RaiseIcon, color: "#FFD700" },
              { name: "ALL-IN", Icon: AllInIcon, color: "#FFD700" },
            ].map(({ name, Icon, color }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-2">
                  <Icon size={20} />
                  <Icon size={24} />
                  <Icon size={32} />
                </div>
                <span className="text-[9px] font-bold tracking-wider" style={{ color }}>{name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== 7. HAND RANKING ICONS ===== */}
        <Section title="7. Hand Ranking Icons (10)" desc="Royal Flush → High Card — 20×20">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {handRankings.map(({ name, icon: Icon, rarity }, i) => (
              <div key={name} className="flex items-center gap-2.5 p-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#4A5568] font-mono w-3">{i + 1}</span>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-[10px] text-white font-medium leading-tight">{name}</div>
                  <div className={`text-[8px] font-bold uppercase tracking-wider ${
                    rarity === "legendary" ? "text-[#FFD700]" :
                    rarity === "epic" ? "text-[#A78BFA]" :
                    rarity === "rare" ? "text-[#22D3EE]" :
                    rarity === "uncommon" ? "text-[#34D399]" :
                    "text-[#6B7A90]"
                  }`}>{rarity}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== COMPLETE SCENE ===== */}
        <Section title="8. Complete Scene Preview" desc="All assets combined">
          <div className="relative rounded-xl overflow-hidden" style={{ background: "#080C12", aspectRatio: "16/9" }}>
            <div className="absolute inset-0">
              <PokerTableSVG variant="desktop" />
            </div>
            {/* Community cards */}
            <div className="absolute top-[42%] left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              <PokerCard suit="hearts" rank="A" size="md" />
              <PokerCard suit="spades" rank="K" size="md" />
              <PokerCard suit="diamonds" rank="Q" size="md" />
              <PokerCard suit="clubs" rank="J" size="md" />
              <PokerCard suit="hearts" rank="10" size="md" />
            </div>
            {/* Pot chips */}
            <div className="absolute top-[56%] left-1/2 -translate-x-1/2 flex gap-1 z-10">
              <PokerChip value={100} size="sm" />
              <PokerChip value={500} size="sm" />
              <PokerChip value={25} size="sm" />
            </div>
            {/* Hero cards */}
            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              <PokerCard suit="spades" rank="A" highlight size="lg" />
              <PokerCard suit="spades" rank="K" highlight size="lg" />
            </div>
            {/* Opponent cards */}
            <div className="absolute top-[12%] left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
              <PokerCard suit="spades" rank="A" faceDown size="sm" />
              <PokerCard suit="spades" rank="A" faceDown size="sm" />
            </div>
            {/* Avatars */}
            <div className="absolute top-[6%] left-1/2 -translate-x-1/2 z-10">
              <PokerAvatar avatarId={0} size="md" online />
            </div>
            <div className="absolute top-[25%] left-[8%] z-10">
              <PokerAvatar avatarId={1} size="md" online />
            </div>
            <div className="absolute top-[25%] right-[8%] z-10">
              <PokerAvatar avatarId={2} size="md" online={false} />
            </div>
            {/* Markers */}
            <div className="absolute top-[18%] left-[52%] z-10">
              <DealerButton size={22} />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <p className="text-[11px] text-[#6B7A90] mt-0.5">{desc}</p>
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: string }) {
  return <div className="text-[10px] text-[#4A5568] uppercase tracking-wider font-bold mb-2">{children}</div>;
}

function MarkerLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-2">{children}</div>
      <span className="text-[9px] text-[#6B7A90]">{label}</span>
    </div>
  );
}