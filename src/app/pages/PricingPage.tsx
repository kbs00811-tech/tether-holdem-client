/**
 * TETHER.BET Holdem — Public Pricing Page (Marketing)
 * 영업/마케팅용 공개 가격 페이지
 */

import { motion } from "motion/react";
import { Check, Zap, Building2, Crown, Sparkles, ArrowRight, Star, Globe, Shield, Trophy } from "lucide-react";
import { Link } from "react-router";

// ═══════════════════════════════════════════════════════
// 글로벌 B2B iGaming/포커 플랫폼 표준 가격 (USD)
// 벤치마크: BetConstruct, Connective Games, SoftSwiss,
//          EveryMatrix, iPoker, GGPoker Network
// ═══════════════════════════════════════════════════════

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    setupFee: 0,
    color: '#34D399',
    icon: Zap,
    tagline: 'Perfect for new operators',
    features: [
      'Up to 1,000 registered users',
      '100 concurrent players',
      '12 cash game tables',
      '3 stake levels (Micro/Low/Mid)',
      'Basic admin dashboard',
      '50/50 rake share',
      'Email support (48h response)',
      'Free setup',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 1999,
    setupFee: 2500,
    color: '#60A5FA',
    icon: Building2,
    popular: true,
    tagline: 'For growing operators',
    features: [
      'Up to 10,000 registered users',
      '500 concurrent players',
      'Unlimited cash game tables',
      '4-tier agent system (본사/부본사/총판/매장)',
      '60/40 rake share',
      'Tournament mode (MTT/SnG)',
      'Custom branding & domain',
      'Priority support (12h response)',
      '$2,500 one-time setup',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 7999,
    setupFee: 10000,
    color: '#FFD700',
    icon: Crown,
    tagline: 'For large-scale operations',
    features: [
      'Unlimited users & concurrent',
      'Dedicated cloud server',
      '70/30 rake share',
      'Full white-label deployment',
      'PKO + Spin & Go + Bomb Pot',
      'Run It Twice & Insurance',
      'Full REST + WebSocket API',
      '24/7 dedicated account manager',
      'SLA 99.9% uptime guarantee',
      '$10,000 one-time setup',
    ],
  },
  {
    id: 'whitelabel',
    name: 'White Label',
    price: 0,
    setupFee: 25000,
    color: '#A78BFA',
    icon: Sparkles,
    tagline: 'Premium source licensing',
    features: [
      'Full source code access',
      'On-premise deployment',
      'Unlimited custom features',
      'Negotiable rev share (80%+)',
      'Dedicated engineering team',
      'Quarterly major releases',
      'Training & knowledge transfer',
      'From $25,000 setup',
    ],
  },
];

const formatUSD = (n: number) => `$${n.toLocaleString('en-US')}`;

const FEATURES = [
  { icon: Trophy, title: 'Tournament System', desc: 'MTT, SnG, Bounty, PKO' },
  { icon: Shield, title: 'Provably Fair', desc: 'SHA256 verifiable shuffles' },
  { icon: Globe, title: 'Multi-Language', desc: 'KR, EN, JP, VN, TH' },
  { icon: Sparkles, title: 'White-Label Ready', desc: 'Custom branding & domain' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 50% 30%, #0F1923, #080E16)" }}>
      {/* Hero */}
      <div className="px-6 py-16 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)" }}>
            <Star className="h-3 w-3 text-[#FF6B35]" />
            <span className="text-[11px] text-[#FF6B35] font-bold uppercase tracking-wider">B2B Partner Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Launch Your Poker Site
            <br />
            <span style={{ background: "linear-gradient(135deg, #FF6B35, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              In Days, Not Months
            </span>
          </h1>
          <p className="text-base text-[#8899AB] max-w-2xl mx-auto">
            Premium Texas Hold'em platform for B2B operators.
            <br />
            White-label ready, fully customizable, instant deployment.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-10">
            <div>
              <div className="text-2xl font-black text-[#FF6B35]">99.9%</div>
              <div className="text-[10px] text-[#6B7A90] uppercase">Uptime SLA</div>
            </div>
            <div className="w-px bg-white/[0.06]" />
            <div>
              <div className="text-2xl font-black text-[#26A17B]">14 Days</div>
              <div className="text-[10px] text-[#6B7A90] uppercase">Free Trial</div>
            </div>
            <div className="w-px bg-white/[0.06]" />
            <div>
              <div className="text-2xl font-black text-[#FFD700]">70%</div>
              <div className="text-[10px] text-[#6B7A90] uppercase">Max Rake Share</div>
            </div>
          </div>
        </motion.div>

        {/* 가격 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl p-6"
              style={{
                background: "#141820",
                border: `1px solid ${plan.popular ? plan.color : 'rgba(255,255,255,0.06)'}`,
                boxShadow: plan.popular ? `0 0 40px ${plan.color}25` : '0 8px 30px rgba(0,0,0,0.3)',
              }}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white"
                  style={{ background: plan.color }}>
                  MOST POPULAR
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}>
                  <plan.icon className="h-5 w-5" style={{ color: plan.color }} />
                </div>
                <div>
                  <div className="text-base font-black text-white">{plan.name}</div>
                  <div className="text-[9px] text-[#4A5A70]">{plan.tagline}</div>
                </div>
              </div>

              <div className="mb-5">
                {plan.price > 0 ? (
                  <>
                    <div className="font-mono text-3xl font-black" style={{ color: plan.color }}>
                      {formatUSD(plan.price)}
                    </div>
                    <div className="text-xs text-[#6B7A90]">per month · USD</div>
                    {plan.setupFee > 0 ? (
                      <div className="text-[10px] text-[#4A5A70] mt-0.5">+ {formatUSD(plan.setupFee)} one-time setup</div>
                    ) : (
                      <div className="text-[10px] text-emerald-400 mt-0.5">Free setup included</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="font-mono text-3xl font-black" style={{ color: plan.color }}>
                      Custom
                    </div>
                    <div className="text-xs text-[#6B7A90]">From {formatUSD(plan.setupFee)} setup</div>
                  </>
                )}
              </div>

              <div className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-xs text-[#8899AB]">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: plan.color }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Link to={plan.id === 'whitelabel' ? '/signup?plan=whitelabel' : '/signup'}>
                <button className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}CC)` : `${plan.color}15`,
                    color: plan.popular ? '#fff' : plan.color,
                    border: `1px solid ${plan.color}40`,
                  }}>
                  {plan.id === 'whitelabel' ? 'Request Quote' : 'Start Free Trial'}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 기능 하이라이트 */}
        <div className="rounded-2xl p-8 mb-16" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-2xl font-black text-white text-center mb-2">
            Built for Professional Operators
          </h2>
          <p className="text-sm text-[#6B7A90] text-center mb-8">Everything you need to run a world-class poker site</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)" }}>
                  <f.icon className="h-5 w-5 text-[#FF6B35]" />
                </div>
                <div className="text-sm font-bold text-white mb-1">{f.title}</div>
                <div className="text-[10px] text-[#6B7A90]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {[
              { q: "How long does setup take?", a: "Starter: 2-3 business days. Growth: 5-7 days with custom branding. Enterprise: 10-14 days with dedicated server provisioning. White Label: 4-6 weeks for full source deployment." },
              { q: "Which currencies and payment processors are supported?", a: "All plans support USD, USDT, BTC, ETH, KRW, JPY, EUR, VND, THB, PHP. Growth and above support PeerX, Stripe, Coinbase Commerce, NOWPayments, and custom wallet integrations." },
              { q: "What about KYC/AML and gambling licenses?", a: "We provide the technical platform only. KYC/AML, gambling licenses (Curaçao, Malta, Isle of Man, etc.), and local regulations are the operator's responsibility. We can recommend compliance partners." },
              { q: "Can I switch plans later?", a: "Yes. Upgrades take effect immediately with prorated billing. Downgrades apply at the next billing cycle. No cancellation fees." },
              { q: "What is the rake share model?", a: "Starter: 50/50, Growth: 60/40, Enterprise: 70/30 (operator/platform). Plus minimum guarantee commitments available for high-volume operators." },
              { q: "Do you support white-label source licensing?", a: "Yes. White Label plan includes full source code, on-premise deployment rights, and perpetual license starting at $25,000 setup + negotiable monthly support fee." },
              { q: "Is there a minimum contract term?", a: "Starter: Month-to-month. Growth: 6-month minimum. Enterprise: 12-month minimum with 10% discount. White Label: 24-month minimum." },
            ].map((faq, i) => (
              <details key={i} className="rounded-xl p-4 cursor-pointer" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <summary className="text-sm font-bold text-white">{faq.q}</summary>
                <div className="text-xs text-[#8899AB] mt-2">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-10 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(38,161,123,0.10))",
            border: "1px solid rgba(255,107,53,0.25)",
          }}>
          <h2 className="text-3xl font-black text-white mb-2">Ready to Launch?</h2>
          <p className="text-sm text-[#8899AB] mb-6">Start your 14-day free trial. No credit card required.</p>
          <Link to="/signup">
            <button className="px-8 py-3 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-8 border-t border-white/[0.06] text-center">
        <div className="text-[10px] text-[#4A5A70]">
          © 2026 TETHER.BET Holdem Platform · Premium Texas Hold'em SaaS
        </div>
      </div>
    </div>
  );
}
