import { useState } from "react";
import { motion } from "motion/react";
import {
  Trophy, Clock, Users, DollarSign, Target, TrendingUp, Zap, Shield,
  Award, ChevronRight, ArrowLeft, Crown, Flame, Layers, Calculator,
  AlertTriangle, Coins, Timer, BarChart3
} from "lucide-react";
import { Link } from "react-router";

const SECTIONS = [
  { id: "types", label: "토너먼트 종류", icon: Trophy },
  { id: "structure", label: "블라인드 구조", icon: Layers },
  { id: "stages", label: "토너먼트 단계", icon: TrendingUp },
  { id: "icm", label: "ICM 이론", icon: Calculator },
  { id: "prize", label: "상금 분배", icon: Coins },
  { id: "rules", label: "특수 규칙", icon: Shield },
  { id: "stack", label: "스택 관리", icon: BarChart3 },
  { id: "strategy", label: "단계별 전략", icon: Target },
];

const TOURNEY_TYPES = [
  {
    name: "MTT (Multi-Table Tournament)",
    icon: Trophy,
    color: "from-yellow-500 to-orange-500",
    desc: "수십~수천 명이 참가하는 대규모 토너먼트",
    features: ["참가비 + 수수료", "느린 블라인드 상승", "최종 테이블까지 진출", "큰 상금풀"],
    duration: "4~12시간",
    skill: "★★★★★",
  },
  {
    name: "SNG (Sit & Go)",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    desc: "정원이 차면 즉시 시작되는 단일/소규모 토너먼트",
    features: ["6~9인 단일 테이블", "빠른 블라인드", "상위 30% 인머니", "짧은 플레이 시간"],
    duration: "30분~2시간",
    skill: "★★★★",
  },
  {
    name: "PKO (Progressive Knockout)",
    icon: Target,
    color: "from-red-500 to-pink-500",
    desc: "탈락시킬 때마다 바운티가 누적되는 토너먼트",
    features: ["참가비 50% 바운티", "탈락시 절반 즉시 지급", "절반은 본인 머리에 추가", "공격적 플레이 유도"],
    duration: "3~8시간",
    skill: "★★★★★",
  },
  {
    name: "Bounty Hunter",
    icon: Crown,
    color: "from-purple-500 to-indigo-500",
    desc: "특정 플레이어를 잡으면 바운티 지급",
    features: ["고정 바운티", "타깃 시스템", "추가 상금 기회", "메인 상금풀 + 바운티"],
    duration: "3~6시간",
    skill: "★★★★",
  },
  {
    name: "Spin & Go",
    icon: Zap,
    color: "from-green-500 to-emerald-500",
    desc: "랜덤 상금배수가 적용되는 3인 SNG",
    features: ["3인 하이퍼 터보", "최대 1000배 상금", "즉시 시작", "복권형 토너먼트"],
    duration: "5~15분",
    skill: "★★★",
  },
  {
    name: "Freezeout",
    icon: Flame,
    color: "from-orange-500 to-red-500",
    desc: "리바이/애드온 없는 단판 승부 토너먼트",
    features: ["1회 한정 엔트리", "탈락시 바로 종료", "적은 리스크", "초보자 추천"],
    duration: "2~6시간",
    skill: "★★★",
  },
];

const BLIND_STRUCTURES = [
  {
    name: "Standard (스탠다드)",
    interval: "20~30분",
    levels: 30,
    multiplier: "1.3~1.5x",
    desc: "프로 토너먼트 표준. 기술이 가장 잘 발휘됨.",
    color: "border-emerald-500",
  },
  {
    name: "Turbo (터보)",
    interval: "8~10분",
    levels: 25,
    multiplier: "1.5x",
    desc: "빠른 진행, 운적 요소 증가.",
    color: "border-yellow-500",
  },
  {
    name: "Hyper Turbo (하이퍼 터보)",
    interval: "3~5분",
    levels: 20,
    multiplier: "1.5~2x",
    desc: "초고속 진행. 푸시/폴드 위주.",
    color: "border-red-500",
  },
  {
    name: "Deep Stack (딥 스택)",
    interval: "30~60분",
    levels: 40,
    multiplier: "1.25x",
    desc: "200BB+ 시작 스택. 포스트플랍 중요.",
    color: "border-blue-500",
  },
];

const ICM_EXAMPLES = [
  { stack: "버블", desc: "ICM 압박 최대. 칩 가치 = 상금 가치 비대칭", action: "타이트 플레이, 빅스택 회피" },
  { stack: "최종 테이블", desc: "각 한단계마다 상금이 크게 차이남", action: "ICM 계산 후 콜/푸시 결정" },
  { stack: "헤즈업", desc: "ICM 영향 최소. 칩 EV = 현금 EV", action: "공격적 플레이 가능" },
  { stack: "쇼트 스택", desc: "푸시/폴드 차트 사용", action: "Nash Equilibrium 기반" },
];

const STAGES = [
  { name: "초반 (Early Stage)", chips: "100BB+", desc: "딥 스택 플레이, 천천히 칩 모으기", icon: "🌱", strategy: "타이트 어그레시브" },
  { name: "중반 (Middle Stage)", chips: "30~80BB", desc: "안티 도입, 스틸 시작", icon: "⚡", strategy: "포지션 활용" },
  { name: "버블 (Bubble)", chips: "15~30BB", desc: "인머니 직전, ICM 압박 최대", icon: "💥", strategy: "쇼트스택 압박" },
  { name: "인머니 (ITM)", chips: "10~25BB", desc: "상금 진입, 사다리 오르기", icon: "💰", strategy: "선택적 어그레시브" },
  { name: "최종 테이블", chips: "5~50BB", desc: "최후 9인, 상금 격차 큼", icon: "👑", strategy: "ICM 기반 결정" },
  { name: "헤즈업", chips: "변동", desc: "1:1 결승, 우승 결정", icon: "🏆", strategy: "공격적 어그레시브" },
];

const PRIZE_STRUCTURES = [
  { rank: "1위", percent: "25~30%", color: "text-yellow-400" },
  { rank: "2위", percent: "15~18%", color: "text-gray-300" },
  { rank: "3위", percent: "10~13%", color: "text-orange-400" },
  { rank: "4위", percent: "8~10%", color: "text-blue-400" },
  { rank: "5위", percent: "6~8%", color: "text-blue-400" },
  { rank: "6~9위", percent: "각 3~5%", color: "text-green-400" },
  { rank: "10~18위", percent: "각 1.5~2%", color: "text-gray-400" },
  { rank: "19% 이하", percent: "각 1%", color: "text-gray-500" },
];

const SPECIAL_RULES = [
  {
    name: "Late Registration (레이트 등록)",
    icon: Clock,
    desc: "토너먼트 시작 후에도 일정 시간 등록 가능",
    detail: "보통 5~8레벨까지. 늦게 등록할수록 시작 스택 BB 수가 작아짐.",
  },
  {
    name: "Re-entry (재참가)",
    icon: TrendingUp,
    desc: "탈락 후 다시 참가비를 내고 재진입",
    detail: "보통 1~3회 제한. 레이트 등록 기간 내에만 가능.",
  },
  {
    name: "Re-buy (리바이)",
    icon: DollarSign,
    desc: "스택이 일정 이하일 때 추가 칩 구매",
    detail: "리바이 기간 동안만. 시작 스택보다 적을 때만 가능.",
  },
  {
    name: "Add-on (애드온)",
    icon: Coins,
    desc: "리바이 기간 종료 시점에 1회 추가 구매",
    detail: "스택 상관없이 모든 플레이어에게 적용. 시작 스택의 1.5~2배.",
  },
  {
    name: "Hand-for-Hand (핸드 포 핸드)",
    icon: Users,
    desc: "버블 직전 모든 테이블이 동시에 한 핸드씩 진행",
    detail: "동시 탈락시 칩이 많은 사람이 상위 순위. 공정성 보장.",
  },
  {
    name: "Synchronized Break (동기화 휴식)",
    icon: Timer,
    desc: "전체 토너먼트가 동시에 휴식",
    detail: "보통 매시간 5~10분. 화장실, 식사, 전략 정리 시간.",
  },
];

const STACK_MANAGEMENT = [
  {
    range: "100BB+",
    name: "Deep Stack",
    color: "from-emerald-500 to-green-500",
    play: "포스트플랍 중심. 임플라이드 오즈 활용. 셋마이닝 가능.",
    avoid: "올인 회피, 미들 페어 유의",
  },
  {
    range: "50~100BB",
    name: "Standard Stack",
    color: "from-blue-500 to-cyan-500",
    play: "표준 GTO 플레이. 모든 플레이 라인 가능.",
    avoid: "막무가내 3-bet 방어",
  },
  {
    range: "25~50BB",
    name: "Medium Stack",
    color: "from-yellow-500 to-orange-500",
    play: "포지션 위주, 3-bet 줄이고 SPR 관리.",
    avoid: "딥스택용 핸드(스몰 페어, 수티드 커넥터 콜)",
  },
  {
    range: "15~25BB",
    name: "Short Stack",
    color: "from-orange-500 to-red-500",
    play: "오픈 푸시 가능. 리쇼브 차트 활용.",
    avoid: "림프, 미니 레이즈, 콜만 하는 플레이",
  },
  {
    range: "10~15BB",
    name: "Push/Fold Zone",
    color: "from-red-500 to-pink-500",
    play: "Nash 푸시/폴드 차트만 사용. 콜 없음.",
    avoid: "포스트플랍 진입",
  },
  {
    range: "<10BB",
    name: "Desperation",
    color: "from-pink-500 to-rose-500",
    play: "어떤 두 카드든 푸시 고려. 첫 빈 자리에 올인.",
    avoid: "마지막 BB까지 기다리기",
  },
];

const STAGE_STRATEGY = [
  {
    stage: "초반 (Early)",
    bb: "100~200BB",
    tip1: "프리미엄 핸드만 플레이 (상위 10%)",
    tip2: "리바이 토너먼트는 더 루즈하게",
    tip3: "관찰: 상대 타입 파악 (피쉬/레그)",
    tip4: "임플라이드 오즈로 셋마이닝 가능",
  },
  {
    stage: "중반 (Middle)",
    bb: "30~80BB",
    tip1: "안티 도입 → 더 많은 핸드 플레이",
    tip2: "스틸과 리스틸 적극 활용",
    tip3: "쇼트 스택 압박, 빅 스택 회피",
    tip4: "포지션을 최우선으로 활용",
  },
  {
    stage: "버블 (Bubble)",
    bb: "15~30BB",
    tip1: "ICM 압박 최대 - 콜링 레인지 좁게",
    tip2: "쇼트 스택일 땐 푸시 자주",
    tip3: "빅 스택일 땐 모두 압박",
    tip4: "미들 스택일 땐 절대 탈락 회피",
  },
  {
    stage: "인머니 (ITM)",
    bb: "10~25BB",
    tip1: "사다리 오르기 - 한 단계 = 큰 돈",
    tip2: "쇼트 스택 탈락 기다리기",
    tip3: "선택적 어그레시브 (선별된 플레이만)",
    tip4: "ICM 계산기 머릿속에서 돌리기",
  },
  {
    stage: "최종 테이블",
    bb: "변동",
    tip1: "각 단계 상금 격차 인지",
    tip2: "딜 제안 가능 (ICM/Chip-chop)",
    tip3: "헤즈업 직전이 최대 ICM 압박",
    tip4: "우승 = 명예 + 큰 상금",
  },
  {
    stage: "헤즈업 (HU)",
    bb: "변동",
    tip1: "ICM 영향 사라짐 - 공격적으로",
    tip2: "버튼(SB) 어그레션 = 80%+",
    tip3: "어떤 두 카드든 가치 있음",
    tip4: "상대 약점 빠르게 파악",
  },
];

export default function TournamentManual() {
  const [activeSection, setActiveSection] = useState("types");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">토너먼트 메뉴얼</h1>
                <p className="text-xs text-gray-400">TETHER.BET HOLDEM 토너먼트 완벽 가이드</p>
              </div>
            </div>
          </div>
          <Link to="/game-manual" className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition text-sm">
            게임 메뉴얼 →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="col-span-3 sticky top-24 self-start">
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                  activeSection === s.id
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{s.label}</span>
                {activeSection === s.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="col-span-9">
          {activeSection === "types" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">토너먼트 종류</h2>
              <p className="text-gray-400 mb-8">6가지 주요 토너먼트 포맷을 익혀보세요.</p>
              <div className="grid grid-cols-2 gap-5">
                {TOURNEY_TYPES.map((t) => (
                  <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/40 transition">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-4`}>
                      <t.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{t.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{t.desc}</p>
                    <ul className="space-y-1 mb-4">
                      {t.features.map((f, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-purple-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between text-xs pt-3 border-t border-white/10">
                      <span className="text-gray-500">소요시간: <span className="text-white">{t.duration}</span></span>
                      <span className="text-yellow-400">{t.skill}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {activeSection === "structure" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">블라인드 구조</h2>
              <p className="text-gray-400 mb-8">4가지 표준 블라인드 속도를 알아보세요.</p>
              <div className="space-y-4">
                {BLIND_STRUCTURES.map((b) => (
                  <div key={b.name} className={`bg-white/5 border-l-4 ${b.color} border border-white/10 rounded-xl p-6`}>
                    <h3 className="text-xl font-bold mb-2">{b.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{b.desc}</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">레벨 간격</div>
                        <div className="text-lg font-bold">{b.interval}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">총 레벨 수</div>
                        <div className="text-lg font-bold">{b.levels}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">상승률</div>
                        <div className="text-lg font-bold">{b.multiplier}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-purple-400" />표준 블라인드 진행 예시</h3>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {[
                    { lv: "L1", sb: "25", bb: "50" },
                    { lv: "L2", sb: "50", bb: "100" },
                    { lv: "L3", sb: "75", bb: "150" },
                    { lv: "L4", sb: "100", bb: "200" },
                    { lv: "L5", sb: "150", bb: "300" },
                    { lv: "L6", sb: "200", bb: "400" },
                    { lv: "L7", sb: "300", bb: "600" },
                    { lv: "L8", sb: "400", bb: "800" },
                    { lv: "L9", sb: "500", bb: "1000" },
                    { lv: "L10", sb: "700", bb: "1400" },
                  ].map((l) => (
                    <div key={l.lv} className="bg-black/30 rounded p-2 text-center">
                      <div className="text-purple-400 font-bold">{l.lv}</div>
                      <div className="text-white">{l.sb}/{l.bb}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === "stages" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">토너먼트 단계</h2>
              <p className="text-gray-400 mb-8">시작부터 우승까지 6단계 흐름.</p>
              <div className="space-y-3">
                {STAGES.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="text-4xl">{s.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold">{s.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">{s.chips}</span>
                      </div>
                      <p className="text-sm text-gray-400">{s.desc}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">전략</div>
                      <div className="text-sm font-medium text-white">{s.strategy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {activeSection === "icm" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">ICM (Independent Chip Model)</h2>
              <p className="text-gray-400 mb-8">토너먼트에서 가장 중요한 수학적 개념.</p>

              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-red-400" /> ICM란?
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  ICM은 토너먼트의 칩 스택을 실제 현금 가치로 변환하는 수학 모델입니다. 캐쉬게임과 달리, 토너먼트에서는 칩 1개의 가치가 동일하지 않습니다. 쇼트 스택의 칩이 빅 스택의 칩보다 가치가 큽니다.
                </p>
                <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                  <div className="text-yellow-400">$EV = Σ (P[i등 도달] × 상금[i])</div>
                  <div className="text-gray-400 mt-2">// 각 등수에 도달할 확률 × 해당 상금의 합</div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4">ICM이 적용되는 상황</h3>
              <div className="space-y-3 mb-6">
                {ICM_EXAMPLES.map((e) => (
                  <div key={e.stack} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-purple-300">{e.stack}</h4>
                      <span className="text-xs text-yellow-400">{e.action}</span>
                    </div>
                    <p className="text-sm text-gray-400">{e.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" /> 핵심 원칙
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• 마지막 BB의 가치 &gt; 첫 번째 BB의 가치 (탈락 = 게임 끝)</li>
                  <li>• 탈락 시 잃는 EV가 칩 EV보다 항상 크다</li>
                  <li>• ICM 때문에 +cEV 콜이 -$EV가 될 수 있다</li>
                  <li>• 미들 스택은 가장 보수적으로, 빅/쇼트는 공격적으로</li>
                </ul>
              </div>
            </motion.section>
          )}

          {activeSection === "prize" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">상금 분배 구조</h2>
              <p className="text-gray-400 mb-8">100인 MTT 기준 표준 상금 분배.</p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" /> 표준 상금 분배표
                </h3>
                <div className="space-y-2">
                  {PRIZE_STRUCTURES.map((p) => (
                    <div key={p.rank} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                      <span className={`font-bold ${p.color}`}>{p.rank}</span>
                      <span className="text-white">{p.percent}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5">
                  <h4 className="font-bold mb-2 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Top-Heavy 구조</h4>
                  <p className="text-sm text-gray-300">상위 입상자에게 상금이 집중되는 방식. WSOP, EPT 등 메이저 토너먼트.</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-5">
                  <h4 className="font-bold mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Flat 구조</h4>
                  <p className="text-sm text-gray-300">상금이 비교적 균등하게 분배. 더 많은 사람이 인머니. 새틀라이트에 자주 사용.</p>
                </div>
              </div>

              <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                <h4 className="font-bold mb-2">상금풀 = 참가비 × 인원수 - 수수료 (보통 8~12%)</h4>
                <div className="text-sm text-gray-300 space-y-1 mt-3">
                  <div>• 일반적으로 <span className="text-yellow-400">상위 10~15%</span>가 인머니</div>
                  <div>• <span className="text-yellow-400">최종 테이블 9명</span>이 전체 상금풀의 70~80% 차지</div>
                  <div>• 우승자 단독으로 약 <span className="text-yellow-400">25~30%</span> 획득</div>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === "rules" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">특수 규칙</h2>
              <p className="text-gray-400 mb-8">토너먼트만의 6가지 특수 규칙.</p>
              <div className="grid grid-cols-2 gap-4">
                {SPECIAL_RULES.map((r) => (
                  <div key={r.name} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/40 transition">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <r.icon className="w-5 h-5 text-purple-300" />
                      </div>
                      <h3 className="font-bold">{r.name}</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{r.desc}</p>
                    <p className="text-xs text-gray-500">{r.detail}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {activeSection === "stack" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">스택별 플레이 가이드</h2>
              <p className="text-gray-400 mb-8">스택 크기에 따른 6가지 전략.</p>
              <div className="space-y-4">
                {STACK_MANAGEMENT.map((s) => (
                  <div key={s.range} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className={`bg-gradient-to-r ${s.color} px-5 py-3 flex items-center justify-between`}>
                      <h3 className="text-lg font-bold">{s.name}</h3>
                      <span className="text-2xl font-black">{s.range}</span>
                    </div>
                    <div className="p-5">
                      <div className="mb-3">
                        <div className="text-xs text-green-400 font-bold mb-1">✓ 플레이 방식</div>
                        <p className="text-sm text-gray-300">{s.play}</p>
                      </div>
                      <div>
                        <div className="text-xs text-red-400 font-bold mb-1">✗ 피해야 할 것</div>
                        <p className="text-sm text-gray-300">{s.avoid}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Award className="w-5 h-5 text-purple-400" /> M-Ratio 공식</h3>
                <div className="bg-black/30 rounded-lg p-4 font-mono text-sm mb-3">
                  <div className="text-yellow-400">M = 내 스택 / (SB + BB + 모든 안티 합)</div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div className="bg-emerald-500/20 rounded p-2 text-center"><div className="font-bold">M&gt;20</div><div>Green</div></div>
                  <div className="bg-yellow-500/20 rounded p-2 text-center"><div className="font-bold">10~20</div><div>Yellow</div></div>
                  <div className="bg-orange-500/20 rounded p-2 text-center"><div className="font-bold">6~10</div><div>Orange</div></div>
                  <div className="bg-red-500/20 rounded p-2 text-center"><div className="font-bold">1~6</div><div>Red</div></div>
                  <div className="bg-pink-500/20 rounded p-2 text-center"><div className="font-bold">&lt;1</div><div>Dead</div></div>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === "strategy" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">단계별 전략 가이드</h2>
              <p className="text-gray-400 mb-8">초반부터 헤즈업까지 단계별 핵심 전략.</p>
              <div className="space-y-5">
                {STAGE_STRATEGY.map((s, i) => (
                  <div key={s.stage} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{s.stage}</h3>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">{s.bb}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[s.tip1, s.tip2, s.tip3, s.tip4].map((tip, ti) => (
                        <div key={ti} className="flex items-start gap-2 bg-black/20 rounded-lg p-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold mt-0.5">{ti + 1}</div>
                          <span className="text-sm text-gray-300">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" /> 우승의 7원칙</h3>
                <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                  <li>생존이 최우선 - 의미 없는 칩은 의미 없다</li>
                  <li>포지션은 황금 - 항상 포지션을 인지하라</li>
                  <li>ICM 압박을 활용하라 - 상대를 압박하라</li>
                  <li>공격이 최선의 방어 - 패시브는 죽음이다</li>
                  <li>스택을 항상 의식하라 - BB 단위로 사고하라</li>
                  <li>틸트를 피하라 - 한 핸드가 토너먼트를 망친다</li>
                  <li>인내와 결단력의 균형 - 기다림과 폭발</li>
                </ol>
              </div>
            </motion.section>
          )}
        </main>
      </div>
    </div>
  );
}
