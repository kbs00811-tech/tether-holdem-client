/**
 * TETHER.BET Holdem — Game Manual
 * 텍사스 홀덤 룰 + 게임 사용법 상세 가이드
 */

import { useState } from "react";
import { motion } from "motion/react";
import {
  BookOpen, Spade, Heart, Diamond, Club, Trophy, Users, Clock, DollarSign,
  Hand, Eye, Target, Zap, Shield, Award, TrendingUp, ChevronRight, ArrowLeft,
} from "lucide-react";
import { Link } from "react-router";
import { getSymbol } from "../utils/currency";
import { useT } from "../../i18n";

const SUITS = [
  { icon: Spade, name: 'Spades', color: '#1F2937' },
  { icon: Heart, name: 'Hearts', color: '#DC2626' },
  { icon: Diamond, name: 'Diamonds', color: '#DC2626' },
  { icon: Club, name: 'Clubs', color: '#1F2937' },
];

export default function GameManual() {
  const t = useT();
  const [activeSection, setActiveSection] = useState('basics');

  const SECTIONS = [
    { id: 'basics', label: t('manual.game.sections.basics'), icon: BookOpen },
    { id: 'positions', label: t('manual.game.sections.positions'), icon: Users },
    { id: 'rounds', label: t('manual.game.sections.rounds'), icon: Clock },
    { id: 'actions', label: t('manual.game.sections.actions'), icon: Hand },
    { id: 'hands', label: t('manual.game.sections.hands'), icon: Trophy },
    { id: 'strategies', label: t('manual.game.sections.strategies'), icon: Target },
    { id: 'features', label: t('manual.game.sections.features'), icon: Zap },
    { id: 'etiquette', label: t('manual.game.sections.etiquette'), icon: Shield },
  ];

  const HAND_RANKINGS = [
    { rank: 1, name: 'Royal Flush', desc: t('manual.game.hands.items.royalFlush'), odds: '649,740 : 1', cards: ['10♠', 'J♠', 'Q♠', 'K♠', 'A♠'], color: '#FFD700' },
    { rank: 2, name: 'Straight Flush', desc: t('manual.game.hands.items.straightFlush'), odds: '72,193 : 1', cards: ['5♥', '6♥', '7♥', '8♥', '9♥'], color: '#FF6B35' },
    { rank: 3, name: t('manual.game.hands.items.fourOfAKindName'), desc: t('manual.game.hands.items.fourOfAKind'), odds: '4,164 : 1', cards: ['K♠', 'K♥', 'K♦', 'K♣', '7♠'], color: '#A78BFA' },
    { rank: 4, name: 'Full House', desc: t('manual.game.hands.items.fullHouse'), odds: '693 : 1', cards: ['Q♠', 'Q♥', 'Q♦', '8♣', '8♠'], color: '#26A17B' },
    { rank: 5, name: 'Flush', desc: t('manual.game.hands.items.flush'), odds: '508 : 1', cards: ['A♦', 'J♦', '9♦', '6♦', '3♦'], color: '#60A5FA' },
    { rank: 6, name: 'Straight', desc: t('manual.game.hands.items.straight'), odds: '254 : 1', cards: ['5♠', '6♥', '7♣', '8♦', '9♠'], color: '#FBBF24' },
    { rank: 7, name: t('manual.game.hands.items.threeOfAKindName'), desc: t('manual.game.hands.items.threeOfAKind'), odds: '46 : 1', cards: ['7♠', '7♥', '7♣', 'K♦', '2♠'], color: '#22D3EE' },
    { rank: 8, name: 'Two Pair', desc: t('manual.game.hands.items.twoPair'), odds: '20 : 1', cards: ['A♠', 'A♥', '8♦', '8♣', 'K♠'], color: '#EC4899' },
    { rank: 9, name: 'One Pair', desc: t('manual.game.hands.items.onePair'), odds: '1.37 : 1', cards: ['10♠', '10♥', 'K♦', '7♣', '4♠'], color: '#94A3B8' },
    { rank: 10, name: 'High Card', desc: t('manual.game.hands.items.highCard'), odds: '1 : 1', cards: ['A♠', 'K♥', '9♦', '5♣', '3♠'], color: '#64748B' },
  ];

  const POSITIONS = [
    { name: 'BTN (Button)', short: t('manual.game.positions.items.btn.short'), desc: t('manual.game.positions.items.btn.desc'), color: '#FFD700', advantage: '★★★★★' },
    { name: 'CO (Cut Off)', short: t('manual.game.positions.items.co.short'), desc: t('manual.game.positions.items.co.desc'), color: '#FF6B35', advantage: '★★★★' },
    { name: 'HJ (Hijack)', short: t('manual.game.positions.items.hj.short'), desc: t('manual.game.positions.items.hj.desc'), color: '#A78BFA', advantage: '★★★' },
    { name: 'MP (Middle)', short: t('manual.game.positions.items.mp.short'), desc: t('manual.game.positions.items.mp.desc'), color: '#60A5FA', advantage: '★★★' },
    { name: 'UTG (Under The Gun)', short: t('manual.game.positions.items.utg.short'), desc: t('manual.game.positions.items.utg.desc'), color: '#EF4444', advantage: '★' },
    { name: 'SB (Small Blind)', short: t('manual.game.positions.items.sb.short'), desc: t('manual.game.positions.items.sb.desc'), color: '#22D3EE', advantage: '★★' },
    { name: 'BB (Big Blind)', short: t('manual.game.positions.items.bb.short'), desc: t('manual.game.positions.items.bb.desc'), color: '#26A17B', advantage: '★★' },
  ];

  const BETTING_ROUNDS = [
    { name: 'Pre-Flop', desc: t('manual.game.rounds.items.preflop.desc'), cards: t('manual.game.rounds.items.preflop.cards'), icon: '🃏' },
    { name: 'Flop', desc: t('manual.game.rounds.items.flop.desc'), cards: t('manual.game.rounds.items.flop.cards'), icon: '🎴' },
    { name: 'Turn', desc: t('manual.game.rounds.items.turn.desc'), cards: t('manual.game.rounds.items.turn.cards'), icon: '🎴' },
    { name: 'River', desc: t('manual.game.rounds.items.river.desc'), cards: t('manual.game.rounds.items.river.cards'), icon: '🎴' },
    { name: 'Showdown', desc: t('manual.game.rounds.items.showdown.desc'), cards: t('manual.game.rounds.items.showdown.cards'), icon: '🏆' },
  ];

  const ACTIONS = [
    { name: 'FOLD', short: t('manual.game.actions.items.fold.short'), desc: t('manual.game.actions.items.fold.desc'), color: '#EF4444', icon: '🚫' },
    { name: 'CHECK', short: t('manual.game.actions.items.check.short'), desc: t('manual.game.actions.items.check.desc'), color: '#94A3B8', icon: '✋' },
    { name: 'CALL', short: t('manual.game.actions.items.call.short'), desc: t('manual.game.actions.items.call.desc'), color: '#26A17B', icon: '💰' },
    { name: 'RAISE', short: t('manual.game.actions.items.raise.short'), desc: t('manual.game.actions.items.raise.desc'), color: '#3B82F6', icon: '⬆️' },
    { name: 'ALL-IN', short: t('manual.game.actions.items.allIn.short'), desc: t('manual.game.actions.items.allIn.desc'), color: '#FFD700', icon: '🔥' },
  ];

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 50% 30%, #0F1923, #080E16)" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between sticky top-0 z-30"
        style={{ background: "rgba(8,12,18,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <ArrowLeft className="h-4 w-4 text-[#8899AB]" />
          </Link>
          <div>
            <h1 className="text-base font-black text-white">{t('manual.game.header.title')}</h1>
            <div className="text-[10px] text-[#4A5A70]">{t('manual.game.header.subtitle')}</div>
          </div>
        </div>
        <Link to="/tournament-manual" className="text-xs text-[#FF6B35] font-semibold flex items-center gap-1">
          {t('manual.game.header.tournamentLink')} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="rounded-2xl p-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-[10px] text-[#4A5A70] uppercase tracking-wider px-2 pb-2 font-bold">{t('manual.game.header.toc')}</div>
            <div className="space-y-1">
              {SECTIONS.map(s => (
                <button key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: activeSection === s.id ? "rgba(255,107,53,0.1)" : "transparent",
                    color: activeSection === s.id ? "#FF6B35" : "#6B7A90",
                  }}>
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* 게임 기초 */}
          {activeSection === 'basics' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="rounded-2xl p-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-3 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-[#FF6B35]" /> {t('manual.game.basics.title')}
                </h2>
                <p className="text-sm text-[#8899AB] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t('manual.game.basics.intro').replace(/<strong>/g, '<strong class="text-white">') }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: Users, label: t('manual.game.basics.stats.playersLabel'), value: t('manual.game.basics.stats.playersValue'), color: '#FF6B35' },
                  { icon: DollarSign, label: t('manual.game.basics.stats.typeLabel'), value: t('manual.game.basics.stats.typeValue'), color: '#26A17B' },
                  { icon: Clock, label: t('manual.game.basics.stats.handLabel'), value: t('manual.game.basics.stats.handValue'), color: '#FFD700' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <s.icon className="h-5 w-5 mb-2" style={{ color: s.color }} />
                    <div className="text-[10px] text-[#4A5A70] uppercase">{s.label}</div>
                    <div className="text-base font-black text-white">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-base font-bold text-white mb-3">{t('manual.game.basics.suits')}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {SUITS.map(s => (
                    <div key={s.name} className="text-center p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <s.icon className="h-8 w-8 mx-auto mb-2" style={{ color: s.color, fill: s.color }} />
                      <div className="text-xs text-white font-semibold">{s.name}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#4A5A70] mt-3">{t('manual.game.basics.suitsNote')}</p>
              </div>

              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(38,161,123,0.05))", border: "1px solid rgba(255,107,53,0.15)" }}>
                <h3 className="text-base font-bold text-white mb-3">{t('manual.game.basics.goalTitle')}</h3>
                <p className="text-sm text-[#8899AB] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t('manual.game.basics.goalText').replace(/<strong>/g, '<strong class="text-[#FFD700]">') }}
                />
              </div>
            </motion.div>
          )}

          {/* 포지션 */}
          {activeSection === 'positions' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-6 mb-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#FF6B35]" /> {t('manual.game.positions.title')}
                </h2>
                <p className="text-sm text-[#8899AB]">
                  {t('manual.game.positions.intro')}
                </p>
              </div>

              {POSITIONS.map(p => (
                <div key={p.name} className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)", borderLeft: `4px solid ${p.color}` }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-white text-base shrink-0"
                    style={{ background: `${p.color}22`, border: `2px solid ${p.color}` }}>
                    {p.name.split(' ')[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-[#6B7A90]">({p.short})</div>
                    </div>
                    <div className="text-xs text-[#8899AB]">{p.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] text-[#4A5A70] uppercase mb-0.5">{t('manual.game.labels.advantage')}</div>
                    <div style={{ color: p.color, fontSize: 12 }}>{p.advantage}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 베팅 라운드 */}
          {activeSection === 'rounds' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-6 mb-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-[#FF6B35]" /> {t('manual.game.rounds.title')}
                </h2>
                <p className="text-sm text-[#8899AB]">{t('manual.game.rounds.intro')}</p>
              </div>

              {BETTING_ROUNDS.map((r, i) => (
                <div key={r.name} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                      style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
                      {r.icon}
                    </div>
                    {i < BETTING_ROUNDS.length - 1 && <div className="w-px flex-1 bg-white/[0.06] my-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="rounded-xl p-4" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-base font-bold text-white">{i + 1}. {r.name}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded text-[#FFD700] bg-[#FFD700]/[0.08]">{r.cards}</span>
                      </div>
                      <div className="text-xs text-[#8899AB]">{r.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 액션 */}
          {activeSection === 'actions' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-6 mb-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Hand className="h-6 w-6 text-[#FF6B35]" /> {t('manual.game.actions.title')}
                </h2>
                <p className="text-sm text-[#8899AB]">{t('manual.game.actions.intro')}</p>
              </div>

              {ACTIONS.map(a => (
                <div key={a.name} className="rounded-xl p-5 flex items-center gap-4"
                  style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)", borderLeft: `4px solid ${a.color}` }}>
                  <div className="text-3xl shrink-0">{a.icon}</div>
                  <div className="flex-1">
                    <div className="text-base font-black mb-1" style={{ color: a.color }}>{a.name} ({a.short})</div>
                    <div className="text-xs text-[#8899AB]">{a.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 핸드 랭킹 */}
          {activeSection === 'hands' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-6 mb-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-[#FFD700]" /> {t('manual.game.hands.title')}
                </h2>
                <p className="text-sm text-[#8899AB]">{t('manual.game.hands.intro')}</p>
              </div>

              {HAND_RANKINGS.map(h => (
                <div key={h.rank} className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)", borderLeft: `4px solid ${h.color}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white shrink-0"
                    style={{ background: `${h.color}22`, border: `2px solid ${h.color}` }}>
                    {h.rank}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold mb-0.5" style={{ color: h.color }}>{h.name}</div>
                    <div className="text-xs text-[#8899AB] mb-2">{h.desc}</div>
                    <div className="flex gap-1">
                      {h.cards.map((c, i) => (
                        <div key={i} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                          style={{
                            background: c.includes('♥') || c.includes('♦') ? "#DC262615" : "#FFFFFF15",
                            color: c.includes('♥') || c.includes('♦') ? "#DC2626" : "#FFFFFF",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}>
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] text-[#4A5A70] uppercase">{t('manual.game.labels.odds')}</div>
                    <div className="text-xs font-mono text-[#FFD700]">{h.odds}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 기본 전략 */}
          {activeSection === 'strategies' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-6 mb-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Target className="h-6 w-6 text-[#FF6B35]" /> {t('manual.game.strategies.title')}
                </h2>
              </div>

              {[
                { num: 1, title: t('manual.game.strategies.items.tight.title'), desc: t('manual.game.strategies.items.tight.desc'), color: '#FF6B35' },
                { num: 2, title: t('manual.game.strategies.items.position.title'), desc: t('manual.game.strategies.items.position.desc'), color: '#26A17B' },
                { num: 3, title: t('manual.game.strategies.items.potOdds.title'), desc: t('manual.game.strategies.items.potOdds.desc'), color: '#FFD700' },
                { num: 4, title: t('manual.game.strategies.items.noBluff.title'), desc: t('manual.game.strategies.items.noBluff.desc'), color: '#A78BFA' },
                { num: 5, title: t('manual.game.strategies.items.bankroll.title'), desc: t('manual.game.strategies.items.bankroll.desc'), color: '#3B82F6' },
                { num: 6, title: t('manual.game.strategies.items.observe.title'), desc: t('manual.game.strategies.items.observe.desc'), color: '#22D3EE' },
                { num: 7, title: t('manual.game.strategies.items.emotion.title'), desc: t('manual.game.strategies.items.emotion.desc'), color: '#EF4444' },
              ].map(item => (
                <div key={item.num} className="rounded-xl p-4 flex gap-4"
                  style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0"
                    style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>
                    {item.num}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white mb-0.5">{item.title}</div>
                    <div className="text-xs text-[#8899AB]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 게임 기능 */}
          {activeSection === 'features' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-6 mb-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-[#FF6B35]" /> {t('manual.game.features.title')}
                </h2>
              </div>

              {[
                { icon: '🔍', title: t('manual.game.features.items.cardSqueeze.title'), desc: t('manual.game.features.items.cardSqueeze.desc') },
                { icon: '⏱', title: t('manual.game.features.items.timeBank.title'), desc: t('manual.game.features.items.timeBank.desc') },
                { icon: '🐰', title: t('manual.game.features.items.rabbitHunt.title'), desc: t('manual.game.features.items.rabbitHunt.desc') },
                { icon: '🛡', title: t('manual.game.features.items.runItTwice.title'), desc: t('manual.game.features.items.runItTwice.desc') },
                { icon: '💎', title: t('manual.game.features.items.insurance.title'), desc: t('manual.game.features.items.insurance.desc') },
                { icon: '💣', title: t('manual.game.features.items.bombPot.title'), desc: t('manual.game.features.items.bombPot.desc') },
                { icon: '🃏', title: t('manual.game.features.items.provablyFair.title'), desc: t('manual.game.features.items.provablyFair.desc') },
                { icon: '👁', title: t('manual.game.features.items.spectate.title'), desc: t('manual.game.features.items.spectate.desc') },
              ].map(f => (
                <div key={f.title} className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="text-3xl shrink-0">{f.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white mb-0.5">{f.title}</div>
                    <div className="text-xs text-[#8899AB]">{f.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* 에티켓 */}
          {activeSection === 'etiquette' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-6 mb-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-[#FF6B35]" /> {t('manual.game.etiquette.title')}
                </h2>
              </div>

              {[
                { type: 'do', text: t('manual.game.etiquette.do.fastAction'), color: '#26A17B' },
                { type: 'do', text: t('manual.game.etiquette.do.showCards'), color: '#26A17B' },
                { type: 'do', text: t('manual.game.etiquette.do.greet'), color: '#26A17B' },
                { type: 'do', text: t('manual.game.etiquette.do.watchChat'), color: '#26A17B' },
                { type: 'dont', text: t('manual.game.etiquette.dont.slowRoll'), color: '#EF4444' },
                { type: 'dont', text: t('manual.game.etiquette.dont.abuse'), color: '#EF4444' },
                { type: 'dont', text: t('manual.game.etiquette.dont.discuss'), color: '#EF4444' },
                { type: 'dont', text: t('manual.game.etiquette.dont.collusion'), color: '#EF4444' },
                { type: 'dont', text: t('manual.game.etiquette.dont.tank'), color: '#EF4444' },
              ].map((e, i) => (
                <div key={i} className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: "#141820", border: `1px solid ${e.color}15`, borderLeft: `4px solid ${e.color}` }}>
                  <span className="text-lg">{e.type === 'do' ? '✅' : '❌'}</span>
                  <div className="text-sm text-white">{e.text}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
