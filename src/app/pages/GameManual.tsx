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

const SECTIONS = [
  { id: 'basics', label: '게임 기초', icon: BookOpen },
  { id: 'positions', label: '포지션', icon: Users },
  { id: 'rounds', label: '베팅 라운드', icon: Clock },
  { id: 'actions', label: '액션 종류', icon: Hand },
  { id: 'hands', label: '핸드 랭킹', icon: Trophy },
  { id: 'strategies', label: '기본 전략', icon: Target },
  { id: 'features', label: '게임 기능', icon: Zap },
  { id: 'etiquette', label: '에티켓', icon: Shield },
];

const HAND_RANKINGS = [
  { rank: 1, name: 'Royal Flush', desc: '같은 무늬의 10-J-Q-K-A', odds: '649,740 : 1', cards: ['10♠', 'J♠', 'Q♠', 'K♠', 'A♠'], color: '#FFD700' },
  { rank: 2, name: 'Straight Flush', desc: '같은 무늬의 5장 연속', odds: '72,193 : 1', cards: ['5♥', '6♥', '7♥', '8♥', '9♥'], color: '#FF6B35' },
  { rank: 3, name: 'Four of a Kind (포카드)', desc: '같은 숫자 4장', odds: '4,164 : 1', cards: ['K♠', 'K♥', 'K♦', 'K♣', '7♠'], color: '#A78BFA' },
  { rank: 4, name: 'Full House', desc: '트리플 + 페어', odds: '693 : 1', cards: ['Q♠', 'Q♥', 'Q♦', '8♣', '8♠'], color: '#26A17B' },
  { rank: 5, name: 'Flush', desc: '같은 무늬 5장', odds: '508 : 1', cards: ['A♦', 'J♦', '9♦', '6♦', '3♦'], color: '#60A5FA' },
  { rank: 6, name: 'Straight', desc: '5장 연속 (무늬 무관)', odds: '254 : 1', cards: ['5♠', '6♥', '7♣', '8♦', '9♠'], color: '#FBBF24' },
  { rank: 7, name: 'Three of a Kind (트리플)', desc: '같은 숫자 3장', odds: '46 : 1', cards: ['7♠', '7♥', '7♣', 'K♦', '2♠'], color: '#22D3EE' },
  { rank: 8, name: 'Two Pair', desc: '페어 2개', odds: '20 : 1', cards: ['A♠', 'A♥', '8♦', '8♣', 'K♠'], color: '#EC4899' },
  { rank: 9, name: 'One Pair', desc: '같은 숫자 2장', odds: '1.37 : 1', cards: ['10♠', '10♥', 'K♦', '7♣', '4♠'], color: '#94A3B8' },
  { rank: 10, name: 'High Card', desc: '아무 조합도 안 됨', odds: '1 : 1', cards: ['A♠', 'K♥', '9♦', '5♣', '3♠'], color: '#64748B' },
];

const POSITIONS = [
  { name: 'BTN (Button)', short: '딜러', desc: '가장 유리한 포지션. 마지막에 액션. 모든 정보를 보고 결정 가능.', color: '#FFD700', advantage: '★★★★★' },
  { name: 'CO (Cut Off)', short: '컷오프', desc: '딜러 직전. BTN 다음으로 좋은 포지션. 와이드 오픈 가능.', color: '#FF6B35', advantage: '★★★★' },
  { name: 'HJ (Hijack)', short: '하이잭', desc: 'CO 직전. 미디엄 포지션. 좋은 핸드만 플레이.', color: '#A78BFA', advantage: '★★★' },
  { name: 'MP (Middle)', short: '미들', desc: '중간 포지션. 표준 레인지.', color: '#60A5FA', advantage: '★★★' },
  { name: 'UTG (Under The Gun)', short: '언더더건', desc: '가장 불리한 액션 포지션. 매우 타이트하게 플레이.', color: '#EF4444', advantage: '★' },
  { name: 'SB (Small Blind)', short: '스몰블라인드', desc: 'BTN 다음 좌석. 강제 베팅 ½. 포스트플롭은 항상 first-to-act.', color: '#22D3EE', advantage: '★★' },
  { name: 'BB (Big Blind)', short: '빅블라인드', desc: '강제 베팅 1×. 무료로 플랍을 볼 수 있는 옵션. 디펜드 wide.', color: '#26A17B', advantage: '★★' },
];

const BETTING_ROUNDS = [
  { name: 'Pre-Flop', desc: '카드 2장 받음. UTG부터 액션 시작.', cards: '2장 (홀카드)', icon: '🃏' },
  { name: 'Flop', desc: '커뮤니티 카드 3장 공개. SB부터 액션.', cards: '3장 공개', icon: '🎴' },
  { name: 'Turn', desc: '4번째 카드 공개. SB부터 액션.', cards: '4장째', icon: '🎴' },
  { name: 'River', desc: '5번째 카드 공개. 마지막 베팅 라운드.', cards: '5장째', icon: '🎴' },
  { name: 'Showdown', desc: '남은 플레이어들이 카드 공개. 가장 강한 핸드 승리.', cards: '카드 공개', icon: '🏆' },
];

const ACTIONS = [
  { name: 'FOLD', short: '폴드', desc: '핸드를 포기. 칩 잃지 않음. 이번 핸드에서 빠짐.', color: '#EF4444', icon: '🚫' },
  { name: 'CHECK', short: '체크', desc: '베팅 안 함. 다음 플레이어로 패스. (콜할 게 없을 때만)', color: '#94A3B8', icon: '✋' },
  { name: 'CALL', short: '콜', desc: '직전 베팅과 같은 금액 베팅.', color: '#26A17B', icon: '💰' },
  { name: 'RAISE', short: '레이즈', desc: '직전 베팅보다 더 많이 베팅. 최소 2배.', color: '#3B82F6', icon: '⬆️' },
  { name: 'ALL-IN', short: '올인', desc: '남은 칩 전부 베팅. 더 이상 액션 없음.', color: '#FFD700', icon: '🔥' },
];

const SUITS = [
  { icon: Spade, name: 'Spades', color: '#1F2937' },
  { icon: Heart, name: 'Hearts', color: '#DC2626' },
  { icon: Diamond, name: 'Diamonds', color: '#DC2626' },
  { icon: Club, name: 'Clubs', color: '#1F2937' },
];

export default function GameManual() {
  const [activeSection, setActiveSection] = useState('basics');

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
            <h1 className="text-base font-black text-white">Texas Hold'em Manual</h1>
            <div className="text-[10px] text-[#4A5A70]">Premium Poker Guide</div>
          </div>
        </div>
        <Link to="/tournament-manual" className="text-xs text-[#FF6B35] font-semibold flex items-center gap-1">
          토너먼트 가이드 <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="rounded-2xl p-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-[10px] text-[#4A5A70] uppercase tracking-wider px-2 pb-2 font-bold">목차</div>
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
                  <BookOpen className="h-6 w-6 text-[#FF6B35]" /> Texas Hold'em이란?
                </h2>
                <p className="text-sm text-[#8899AB] leading-relaxed">
                  세계에서 가장 인기있는 포커 게임. 각 플레이어는 <strong className="text-white">2장의 홀카드</strong>를 받고,
                  테이블 중앙에 <strong className="text-white">5장의 커뮤니티 카드</strong>가 펼쳐집니다.
                  총 7장 중 가장 강한 5장 조합을 만드는 플레이어가 승리합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: Users, label: '인원', value: '2~9명', color: '#FF6B35' },
                  { icon: DollarSign, label: '게임 종류', value: 'Cash Game', color: '#26A17B' },
                  { icon: Clock, label: '한 핸드', value: '약 1~3분', color: '#FFD700' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <s.icon className="h-5 w-5 mb-2" style={{ color: s.color }} />
                    <div className="text-[10px] text-[#4A5A70] uppercase">{s.label}</div>
                    <div className="text-base font-black text-white">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-base font-bold text-white mb-3">카드 무늬 (Suits)</h3>
                <div className="grid grid-cols-4 gap-3">
                  {SUITS.map(s => (
                    <div key={s.name} className="text-center p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <s.icon className="h-8 w-8 mx-auto mb-2" style={{ color: s.color, fill: s.color }} />
                      <div className="text-xs text-white font-semibold">{s.name}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#4A5A70] mt-3">* 텍사스 홀덤에서 무늬는 동등합니다 (모두 같은 가치)</p>
              </div>

              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(38,161,123,0.05))", border: "1px solid rgba(255,107,53,0.15)" }}>
                <h3 className="text-base font-bold text-white mb-3">🎯 게임 목표</h3>
                <p className="text-sm text-[#8899AB] leading-relaxed">
                  단순히 좋은 카드를 받는 것이 아니라, <strong className="text-[#FFD700]">상대를 폴드시키거나</strong> 또는
                  <strong className="text-[#FFD700]">가장 강한 핸드로 쇼다운에서 이겨</strong> 팟을 가져오는 것입니다.
                </p>
              </div>
            </motion.div>
          )}

          {/* 포지션 */}
          {activeSection === 'positions' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="rounded-2xl p-6 mb-3" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#FF6B35]" /> 포지션 가이드
                </h2>
                <p className="text-sm text-[#8899AB]">
                  포지션은 텍사스 홀덤에서 가장 중요한 개념. 늦게 액션할수록 정보가 많아 유리합니다.
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
                    <div className="text-[9px] text-[#4A5A70] uppercase mb-0.5">유리도</div>
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
                  <Clock className="h-6 w-6 text-[#FF6B35]" /> 베팅 라운드
                </h2>
                <p className="text-sm text-[#8899AB]">한 핸드는 5단계로 진행됩니다.</p>
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
                  <Hand className="h-6 w-6 text-[#FF6B35]" /> 액션 종류
                </h2>
                <p className="text-sm text-[#8899AB]">자기 차례에 선택할 수 있는 5가지 액션.</p>
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
                  <Trophy className="h-6 w-6 text-[#FFD700]" /> 핸드 랭킹 (강한 순)
                </h2>
                <p className="text-sm text-[#8899AB]">10가지 핸드 조합. 위에서 아래로 강함.</p>
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
                    <div className="text-[9px] text-[#4A5A70] uppercase">확률</div>
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
                  <Target className="h-6 w-6 text-[#FF6B35]" /> 초보자 전략
                </h2>
              </div>

              {[
                { num: 1, title: '타이트하게 시작', desc: '좋은 핸드만 플레이. 페어, AK, AQ, AJ 중심.', color: '#FF6B35' },
                { num: 2, title: '포지션 활용', desc: '늦은 포지션(BTN, CO)에서 더 많은 핸드 플레이.', color: '#26A17B' },
                { num: 3, title: '팟 오즈 계산', desc: '콜에 필요한 금액 / (팟 + 콜) = 필요 승률.', color: '#FFD700' },
                { num: 4, title: '블러프 자제', desc: '초보는 밸류 위주. 블러프는 상황 익힌 후.', color: '#A78BFA' },
                { num: 5, title: '뱅크롤 관리', desc: '스택의 5%만 한 번에 베팅. 절대 무리하지 말 것.', color: '#3B82F6' },
                { num: 6, title: '관찰', desc: '상대 패턴 파악. 누가 타이트한지, 누가 루즈한지.', color: '#22D3EE' },
                { num: 7, title: '감정 컨트롤', desc: '틸트(흥분)는 최악의 적. 큰 손실 후엔 잠시 쉬기.', color: '#EF4444' },
              ].map(t => (
                <div key={t.num} className="rounded-xl p-4 flex gap-4"
                  style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0"
                    style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}30` }}>
                    {t.num}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white mb-0.5">{t.title}</div>
                    <div className="text-xs text-[#8899AB]">{t.desc}</div>
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
                  <Zap className="h-6 w-6 text-[#FF6B35]" /> 특수 기능
                </h2>
              </div>

              {[
                { icon: '🔍', title: 'Card Squeeze', desc: '내 카드를 마우스로 드래그해서 천천히 공개. 진짜 카지노 느낌.' },
                { icon: '⏱', title: 'Time Bank', desc: '큰 결정에 추가 시간 사용. 30초 + 보너스 시간.' },
                { icon: '🐰', title: 'Rabbit Hunt', desc: '핸드 종료 후 안 까진 카드 확인. 어떤 카드였는지 확인.' },
                { icon: '🛡', title: 'Run It Twice', desc: '올인 후 2번 보드 실행. 분산 줄이기.' },
                { icon: '💎', title: 'Insurance', desc: '올인 시 보험 가입. 안전한 수익 보장.' },
                { icon: '💣', title: 'Bomb Pot', desc: '특정 핸드에서 모두 강제 콜 + 큰 팟.' },
                { icon: '🃏', title: 'Provably Fair', desc: 'SHA256 검증 가능한 셔플. 조작 불가능.' },
                { icon: '👁', title: '관전 모드', desc: '착석하지 않고 게임 관전 가능.' },
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
                  <Shield className="h-6 w-6 text-[#FF6B35]" /> 게임 에티켓
                </h2>
              </div>

              {[
                { type: 'do', text: '본인 차례에 신속하게 액션', color: '#26A17B' },
                { type: 'do', text: '쇼다운 시 카드 즉시 공개', color: '#26A17B' },
                { type: 'do', text: '승자에게 "GG", "NH" 같은 인사', color: '#26A17B' },
                { type: 'do', text: '관전 모드에서는 채팅 자제', color: '#26A17B' },
                { type: 'dont', text: '슬로우롤 (이긴 카드를 일부러 천천히 공개)', color: '#EF4444' },
                { type: 'dont', text: '욕설/비방 채팅', color: '#EF4444' },
                { type: 'dont', text: '핸드 진행 중 다른 사람 카드 논의', color: '#EF4444' },
                { type: 'dont', text: '콜루전 (다른 플레이어와 짜고 플레이)', color: '#EF4444' },
                { type: 'dont', text: '시간 끌기 (Tank). 큰 결정 외엔 빠르게', color: '#EF4444' },
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
