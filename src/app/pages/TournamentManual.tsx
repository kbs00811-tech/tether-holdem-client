import { useState } from "react";
import { motion } from "motion/react";
import {
  Trophy, Clock, Users, DollarSign, Target, TrendingUp, Zap, Shield,
  Award, ChevronRight, ArrowLeft, Crown, Flame, Layers, Calculator,
  AlertTriangle, Coins, Timer, BarChart3
} from "lucide-react";
import { Link } from "react-router";
import { useT } from "../../i18n";

export default function TournamentManual() {
  const t = useT();
  const [activeSection, setActiveSection] = useState("types");

  const SECTIONS = [
    { id: "types", label: t("manual.tournament.sections.types"), icon: Trophy },
    { id: "structure", label: t("manual.tournament.sections.structure"), icon: Layers },
    { id: "stages", label: t("manual.tournament.sections.stages"), icon: TrendingUp },
    { id: "icm", label: t("manual.tournament.sections.icm"), icon: Calculator },
    { id: "prize", label: t("manual.tournament.sections.prize"), icon: Coins },
    { id: "rules", label: t("manual.tournament.sections.rules"), icon: Shield },
    { id: "stack", label: t("manual.tournament.sections.stack"), icon: BarChart3 },
    { id: "strategy", label: t("manual.tournament.sections.strategy"), icon: Target },
  ];

  const TOURNEY_TYPES = [
    { name: "MTT (Multi-Table Tournament)", icon: Trophy, color: "from-yellow-500 to-orange-500",
      desc: t("manual.tournament.types.items.mtt.desc"),
      features: [t("manual.tournament.types.items.mtt.f1"), t("manual.tournament.types.items.mtt.f2"), t("manual.tournament.types.items.mtt.f3"), t("manual.tournament.types.items.mtt.f4")],
      duration: t("manual.tournament.types.items.mtt.duration"), skill: "★★★★★" },
    { name: "SNG (Sit & Go)", icon: Users, color: "from-blue-500 to-cyan-500",
      desc: t("manual.tournament.types.items.sng.desc"),
      features: [t("manual.tournament.types.items.sng.f1"), t("manual.tournament.types.items.sng.f2"), t("manual.tournament.types.items.sng.f3"), t("manual.tournament.types.items.sng.f4")],
      duration: t("manual.tournament.types.items.sng.duration"), skill: "★★★★" },
    { name: "PKO (Progressive Knockout)", icon: Target, color: "from-red-500 to-pink-500",
      desc: t("manual.tournament.types.items.pko.desc"),
      features: [t("manual.tournament.types.items.pko.f1"), t("manual.tournament.types.items.pko.f2"), t("manual.tournament.types.items.pko.f3"), t("manual.tournament.types.items.pko.f4")],
      duration: t("manual.tournament.types.items.pko.duration"), skill: "★★★★★" },
    { name: "Bounty Hunter", icon: Crown, color: "from-purple-500 to-indigo-500",
      desc: t("manual.tournament.types.items.bountyHunter.desc"),
      features: [t("manual.tournament.types.items.bountyHunter.f1"), t("manual.tournament.types.items.bountyHunter.f2"), t("manual.tournament.types.items.bountyHunter.f3"), t("manual.tournament.types.items.bountyHunter.f4")],
      duration: t("manual.tournament.types.items.bountyHunter.duration"), skill: "★★★★" },
    { name: "Spin & Go", icon: Zap, color: "from-green-500 to-emerald-500",
      desc: t("manual.tournament.types.items.spinAndGo.desc"),
      features: [t("manual.tournament.types.items.spinAndGo.f1"), t("manual.tournament.types.items.spinAndGo.f2"), t("manual.tournament.types.items.spinAndGo.f3"), t("manual.tournament.types.items.spinAndGo.f4")],
      duration: t("manual.tournament.types.items.spinAndGo.duration"), skill: "★★★" },
    { name: "Freezeout", icon: Flame, color: "from-orange-500 to-red-500",
      desc: t("manual.tournament.types.items.freezeout.desc"),
      features: [t("manual.tournament.types.items.freezeout.f1"), t("manual.tournament.types.items.freezeout.f2"), t("manual.tournament.types.items.freezeout.f3"), t("manual.tournament.types.items.freezeout.f4")],
      duration: t("manual.tournament.types.items.freezeout.duration"), skill: "★★★" },
  ];

  const BLIND_STRUCTURES = [
    { name: t("manual.tournament.structure.items.standard.name"), interval: t("manual.tournament.structure.items.standard.interval"), levels: 30, multiplier: t("manual.tournament.structure.items.standard.multiplier"), desc: t("manual.tournament.structure.items.standard.desc"), color: "border-emerald-500" },
    { name: t("manual.tournament.structure.items.turbo.name"), interval: t("manual.tournament.structure.items.turbo.interval"), levels: 25, multiplier: t("manual.tournament.structure.items.turbo.multiplier"), desc: t("manual.tournament.structure.items.turbo.desc"), color: "border-yellow-500" },
    { name: t("manual.tournament.structure.items.hyperTurbo.name"), interval: t("manual.tournament.structure.items.hyperTurbo.interval"), levels: 20, multiplier: t("manual.tournament.structure.items.hyperTurbo.multiplier"), desc: t("manual.tournament.structure.items.hyperTurbo.desc"), color: "border-red-500" },
    { name: t("manual.tournament.structure.items.deepStack.name"), interval: t("manual.tournament.structure.items.deepStack.interval"), levels: 40, multiplier: t("manual.tournament.structure.items.deepStack.multiplier"), desc: t("manual.tournament.structure.items.deepStack.desc"), color: "border-blue-500" },
  ];

  const ICM_EXAMPLES = [
    { stack: t("manual.tournament.icm.examples.bubble.stack"), desc: t("manual.tournament.icm.examples.bubble.desc"), action: t("manual.tournament.icm.examples.bubble.action") },
    { stack: t("manual.tournament.icm.examples.ft.stack"), desc: t("manual.tournament.icm.examples.ft.desc"), action: t("manual.tournament.icm.examples.ft.action") },
    { stack: t("manual.tournament.icm.examples.hu.stack"), desc: t("manual.tournament.icm.examples.hu.desc"), action: t("manual.tournament.icm.examples.hu.action") },
    { stack: t("manual.tournament.icm.examples.shortStack.stack"), desc: t("manual.tournament.icm.examples.shortStack.desc"), action: t("manual.tournament.icm.examples.shortStack.action") },
  ];

  const STAGES = [
    { name: t("manual.tournament.stages.items.early.name"), chips: "100BB+", desc: t("manual.tournament.stages.items.early.desc"), icon: "🌱", strategy: t("manual.tournament.stages.items.early.strategy") },
    { name: t("manual.tournament.stages.items.middle.name"), chips: "30~80BB", desc: t("manual.tournament.stages.items.middle.desc"), icon: "⚡", strategy: t("manual.tournament.stages.items.middle.strategy") },
    { name: t("manual.tournament.stages.items.bubble.name"), chips: "15~30BB", desc: t("manual.tournament.stages.items.bubble.desc"), icon: "💥", strategy: t("manual.tournament.stages.items.bubble.strategy") },
    { name: t("manual.tournament.stages.items.itm.name"), chips: "10~25BB", desc: t("manual.tournament.stages.items.itm.desc"), icon: "💰", strategy: t("manual.tournament.stages.items.itm.strategy") },
    { name: t("manual.tournament.stages.items.ft.name"), chips: "5~50BB", desc: t("manual.tournament.stages.items.ft.desc"), icon: "👑", strategy: t("manual.tournament.stages.items.ft.strategy") },
    { name: t("manual.tournament.stages.items.hu.name"), chips: t("manual.tournament.stages.items.hu.desc").includes("varies") ? "varies" : "변동", desc: t("manual.tournament.stages.items.hu.desc"), icon: "🏆", strategy: t("manual.tournament.stages.items.hu.strategy") },
  ];

  const PRIZE_STRUCTURES = [
    { rank: t("manual.tournament.prize.ranks.r1"), percent: t("manual.tournament.prize.ranks.p1"), color: "text-yellow-400" },
    { rank: t("manual.tournament.prize.ranks.r2"), percent: t("manual.tournament.prize.ranks.p2"), color: "text-gray-300" },
    { rank: t("manual.tournament.prize.ranks.r3"), percent: t("manual.tournament.prize.ranks.p3"), color: "text-orange-400" },
    { rank: t("manual.tournament.prize.ranks.r4"), percent: t("manual.tournament.prize.ranks.p4"), color: "text-blue-400" },
    { rank: t("manual.tournament.prize.ranks.r5"), percent: t("manual.tournament.prize.ranks.p5"), color: "text-blue-400" },
    { rank: t("manual.tournament.prize.ranks.r6to9"), percent: t("manual.tournament.prize.ranks.p6to9"), color: "text-green-400" },
    { rank: t("manual.tournament.prize.ranks.r10to18"), percent: t("manual.tournament.prize.ranks.p10to18"), color: "text-gray-400" },
    { rank: t("manual.tournament.prize.ranks.r19plus"), percent: t("manual.tournament.prize.ranks.p19plus"), color: "text-gray-500" },
  ];

  const SPECIAL_RULES = [
    { name: t("manual.tournament.rules.items.lateReg.name"), icon: Clock, desc: t("manual.tournament.rules.items.lateReg.desc"), detail: t("manual.tournament.rules.items.lateReg.detail") },
    { name: t("manual.tournament.rules.items.reentry.name"), icon: TrendingUp, desc: t("manual.tournament.rules.items.reentry.desc"), detail: t("manual.tournament.rules.items.reentry.detail") },
    { name: t("manual.tournament.rules.items.rebuy.name"), icon: DollarSign, desc: t("manual.tournament.rules.items.rebuy.desc"), detail: t("manual.tournament.rules.items.rebuy.detail") },
    { name: t("manual.tournament.rules.items.addon.name"), icon: Coins, desc: t("manual.tournament.rules.items.addon.desc"), detail: t("manual.tournament.rules.items.addon.detail") },
    { name: t("manual.tournament.rules.items.handForHand.name"), icon: Users, desc: t("manual.tournament.rules.items.handForHand.desc"), detail: t("manual.tournament.rules.items.handForHand.detail") },
    { name: t("manual.tournament.rules.items.syncBreak.name"), icon: Timer, desc: t("manual.tournament.rules.items.syncBreak.desc"), detail: t("manual.tournament.rules.items.syncBreak.detail") },
  ];

  const STACK_MANAGEMENT = [
    { range: "100BB+", name: "Deep Stack", color: "from-emerald-500 to-green-500", play: t("manual.tournament.stack.items.deep.play"), avoid: t("manual.tournament.stack.items.deep.avoid") },
    { range: "50~100BB", name: "Standard Stack", color: "from-blue-500 to-cyan-500", play: t("manual.tournament.stack.items.standard.play"), avoid: t("manual.tournament.stack.items.standard.avoid") },
    { range: "25~50BB", name: "Medium Stack", color: "from-yellow-500 to-orange-500", play: t("manual.tournament.stack.items.medium.play"), avoid: t("manual.tournament.stack.items.medium.avoid") },
    { range: "15~25BB", name: "Short Stack", color: "from-orange-500 to-red-500", play: t("manual.tournament.stack.items.short.play"), avoid: t("manual.tournament.stack.items.short.avoid") },
    { range: "10~15BB", name: "Push/Fold Zone", color: "from-red-500 to-pink-500", play: t("manual.tournament.stack.items.pushFold.play"), avoid: t("manual.tournament.stack.items.pushFold.avoid") },
    { range: "<10BB", name: "Desperation", color: "from-pink-500 to-rose-500", play: t("manual.tournament.stack.items.desperation.play"), avoid: t("manual.tournament.stack.items.desperation.avoid") },
  ];

  const STAGE_STRATEGY = [
    { stage: t("manual.tournament.strategy.items.early.stage"), bb: t("manual.tournament.strategy.items.early.bb"), tip1: t("manual.tournament.strategy.items.early.tip1"), tip2: t("manual.tournament.strategy.items.early.tip2"), tip3: t("manual.tournament.strategy.items.early.tip3"), tip4: t("manual.tournament.strategy.items.early.tip4") },
    { stage: t("manual.tournament.strategy.items.middle.stage"), bb: t("manual.tournament.strategy.items.middle.bb"), tip1: t("manual.tournament.strategy.items.middle.tip1"), tip2: t("manual.tournament.strategy.items.middle.tip2"), tip3: t("manual.tournament.strategy.items.middle.tip3"), tip4: t("manual.tournament.strategy.items.middle.tip4") },
    { stage: t("manual.tournament.strategy.items.bubble.stage"), bb: t("manual.tournament.strategy.items.bubble.bb"), tip1: t("manual.tournament.strategy.items.bubble.tip1"), tip2: t("manual.tournament.strategy.items.bubble.tip2"), tip3: t("manual.tournament.strategy.items.bubble.tip3"), tip4: t("manual.tournament.strategy.items.bubble.tip4") },
    { stage: t("manual.tournament.strategy.items.itm.stage"), bb: t("manual.tournament.strategy.items.itm.bb"), tip1: t("manual.tournament.strategy.items.itm.tip1"), tip2: t("manual.tournament.strategy.items.itm.tip2"), tip3: t("manual.tournament.strategy.items.itm.tip3"), tip4: t("manual.tournament.strategy.items.itm.tip4") },
    { stage: t("manual.tournament.strategy.items.ft.stage"), bb: t("manual.tournament.strategy.items.ft.bb"), tip1: t("manual.tournament.strategy.items.ft.tip1"), tip2: t("manual.tournament.strategy.items.ft.tip2"), tip3: t("manual.tournament.strategy.items.ft.tip3"), tip4: t("manual.tournament.strategy.items.ft.tip4") },
    { stage: t("manual.tournament.strategy.items.hu.stage"), bb: t("manual.tournament.strategy.items.hu.bb"), tip1: t("manual.tournament.strategy.items.hu.tip1"), tip2: t("manual.tournament.strategy.items.hu.tip2"), tip3: t("manual.tournament.strategy.items.hu.tip3"), tip4: t("manual.tournament.strategy.items.hu.tip4") },
  ];

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
                <h1 className="text-xl font-bold">{t("manual.tournament.header.title")}</h1>
                <p className="text-xs text-gray-400">{t("manual.tournament.header.subtitle")}</p>
              </div>
            </div>
          </div>
          <Link to="/game-manual" className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition text-sm">
            {t("manual.tournament.header.gameLink")}
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
              <h2 className="text-3xl font-bold mb-2">{t("manual.tournament.types.title")}</h2>
              <p className="text-gray-400 mb-8">{t("manual.tournament.types.intro")}</p>
              <div className="grid grid-cols-2 gap-5">
                {TOURNEY_TYPES.map((ty) => (
                  <div key={ty.name} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/40 transition">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ty.color} flex items-center justify-center mb-4`}>
                      <ty.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{ty.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{ty.desc}</p>
                    <ul className="space-y-1 mb-4">
                      {ty.features.map((f, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-purple-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between text-xs pt-3 border-t border-white/10">
                      <span className="text-gray-500">{t("manual.tournament.labels.duration")}: <span className="text-white">{ty.duration}</span></span>
                      <span className="text-yellow-400">{ty.skill}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {activeSection === "structure" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">{t("manual.tournament.structure.title")}</h2>
              <p className="text-gray-400 mb-8">{t("manual.tournament.structure.intro")}</p>
              <div className="space-y-4">
                {BLIND_STRUCTURES.map((b) => (
                  <div key={b.name} className={`bg-white/5 border-l-4 ${b.color} border border-white/10 rounded-xl p-6`}>
                    <h3 className="text-xl font-bold mb-2">{b.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{b.desc}</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">{t("manual.tournament.labels.interval")}</div>
                        <div className="text-lg font-bold">{b.interval}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t("manual.tournament.labels.levels")}</div>
                        <div className="text-lg font-bold">{b.levels}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">{t("manual.tournament.labels.multiplier")}</div>
                        <div className="text-lg font-bold">{b.multiplier}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-purple-400" />{t("manual.tournament.structure.exampleTitle")}</h3>
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
              <h2 className="text-3xl font-bold mb-2">{t("manual.tournament.stages.title")}</h2>
              <p className="text-gray-400 mb-8">{t("manual.tournament.stages.intro")}</p>
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
                      <div className="text-xs text-gray-500">{t("manual.tournament.labels.strategy")}</div>
                      <div className="text-sm font-medium text-white">{s.strategy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {activeSection === "icm" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">{t("manual.tournament.icm.title")}</h2>
              <p className="text-gray-400 mb-8">{t("manual.tournament.icm.intro")}</p>

              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-red-400" /> {t("manual.tournament.icm.definitionTitle")}
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  {t("manual.tournament.icm.definition")}
                </p>
                <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
                  <div className="text-yellow-400">{t("manual.tournament.icm.formula")}</div>
                  <div className="text-gray-400 mt-2">{t("manual.tournament.icm.formulaNote")}</div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4">{t("manual.tournament.icm.examplesTitle")}</h3>
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
                  <AlertTriangle className="w-4 h-4 text-yellow-400" /> {t("manual.tournament.icm.principlesTitle")}
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• {t("manual.tournament.icm.principles.p1")}</li>
                  <li>• {t("manual.tournament.icm.principles.p2")}</li>
                  <li>• {t("manual.tournament.icm.principles.p3")}</li>
                  <li>• {t("manual.tournament.icm.principles.p4")}</li>
                </ul>
              </div>
            </motion.section>
          )}

          {activeSection === "prize" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">{t("manual.tournament.prize.title")}</h2>
              <p className="text-gray-400 mb-8">{t("manual.tournament.prize.intro")}</p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" /> {t("manual.tournament.prize.tableTitle")}
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
                  <h4 className="font-bold mb-2 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> {t("manual.tournament.prize.topHeavy.title")}</h4>
                  <p className="text-sm text-gray-300">{t("manual.tournament.prize.topHeavy.desc")}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-5">
                  <h4 className="font-bold mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> {t("manual.tournament.prize.flat.title")}</h4>
                  <p className="text-sm text-gray-300">{t("manual.tournament.prize.flat.desc")}</p>
                </div>
              </div>

              <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                <h4 className="font-bold mb-2">{t("manual.tournament.prize.formula")}</h4>
                <div className="text-sm text-gray-300 space-y-1 mt-3">
                  <div>• {t("manual.tournament.prize.noteTopPercent")}</div>
                  <div>• {t("manual.tournament.prize.noteFt")}</div>
                  <div>• {t("manual.tournament.prize.noteWinner")}</div>
                </div>
              </div>
            </motion.section>
          )}

          {activeSection === "rules" && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-bold mb-2">{t("manual.tournament.rules.title")}</h2>
              <p className="text-gray-400 mb-8">{t("manual.tournament.rules.intro")}</p>
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
              <h2 className="text-3xl font-bold mb-2">{t("manual.tournament.stack.title")}</h2>
              <p className="text-gray-400 mb-8">{t("manual.tournament.stack.intro")}</p>
              <div className="space-y-4">
                {STACK_MANAGEMENT.map((s) => (
                  <div key={s.range} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className={`bg-gradient-to-r ${s.color} px-5 py-3 flex items-center justify-between`}>
                      <h3 className="text-lg font-bold">{s.name}</h3>
                      <span className="text-2xl font-black">{s.range}</span>
                    </div>
                    <div className="p-5">
                      <div className="mb-3">
                        <div className="text-xs text-green-400 font-bold mb-1">{t("manual.tournament.labels.play")}</div>
                        <p className="text-sm text-gray-300">{s.play}</p>
                      </div>
                      <div>
                        <div className="text-xs text-red-400 font-bold mb-1">{t("manual.tournament.labels.avoid")}</div>
                        <p className="text-sm text-gray-300">{s.avoid}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Award className="w-5 h-5 text-purple-400" /> {t("manual.tournament.stack.mRatioTitle")}</h3>
                <div className="bg-black/30 rounded-lg p-4 font-mono text-sm mb-3">
                  <div className="text-yellow-400">{t("manual.tournament.stack.mRatioFormula")}</div>
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
              <h2 className="text-3xl font-bold mb-2">{t("manual.tournament.strategy.title")}</h2>
              <p className="text-gray-400 mb-8">{t("manual.tournament.strategy.intro")}</p>
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
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-400" /> {t("manual.tournament.strategy.victoryTitle")}</h3>
                <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                  <li>{t("manual.tournament.strategy.victory.p1")}</li>
                  <li>{t("manual.tournament.strategy.victory.p2")}</li>
                  <li>{t("manual.tournament.strategy.victory.p3")}</li>
                  <li>{t("manual.tournament.strategy.victory.p4")}</li>
                  <li>{t("manual.tournament.strategy.victory.p5")}</li>
                  <li>{t("manual.tournament.strategy.victory.p6")}</li>
                  <li>{t("manual.tournament.strategy.victory.p7")}</li>
                </ol>
              </div>
            </motion.section>
          )}
        </main>
      </div>
    </div>
  );
}
