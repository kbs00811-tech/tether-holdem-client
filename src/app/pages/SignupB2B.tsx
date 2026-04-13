/**
 * TETHER.BET Holdem — B2B Self-Signup
 * 운영사가 직접 가입할 수 있는 셀프 온보딩 페이지
 */

import { useState } from "react";
import { motion } from "motion/react";
import { Check, ArrowRight, Shield, Zap, Crown, Building2, Lock, Mail, Globe } from "lucide-react";
import { toast } from "sonner";

// 글로벌 B2B iGaming 표준 가격 (USD)
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    setupFee: 0,
    color: '#34D399',
    popular: false,
    icon: Zap,
    features: [
      'Up to 1,000 users',
      '100 concurrent players',
      '12 cash tables',
      '50/50 rake share',
      'Standard AI bots (V4)',
      'Email support',
      '14-day free trial',
      'Free setup',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 1999,
    setupFee: 2500,
    color: '#60A5FA',
    popular: true,
    icon: Building2,
    features: [
      'Up to 10,000 users',
      '500 concurrent players',
      'Unlimited tables',
      '4-tier agent system',
      '60/40 rake share',
      'Advanced AI (V5 GTO+)',
      'Tournament (MTT/SnG)',
      'Custom branding',
      'Priority support',
      '14-day free trial',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 7999,
    setupFee: 10000,
    color: '#FFD700',
    popular: false,
    icon: Crown,
    features: [
      'Unlimited everything',
      'Dedicated cloud server',
      '70/30 rake share',
      'Full white label',
      'PKO + Spin&Go + Bomb Pot',
      'Run It Twice + Insurance',
      'Full API access',
      '24/7 dedicated manager',
      'SLA 99.9% uptime',
      '14-day free trial',
    ],
  },
];

const formatUSD = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function SignupB2B() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: 'KR',
    domain: '',
    brandName: '',
    primaryColor: '#FF6B35',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  const handleSignup = () => {
    if (!selectedPlan || !formData.email || !formData.companyName) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Welcome ${formData.companyName}! 14-day trial started.`);
    setStep(3);
  };

  const plan = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 50% 30%, #0F1923, #080E16)" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-base font-black text-white">TETHER.BET Holdem</div>
            <div className="text-[10px] text-[#4A5A70]">B2B Partner Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B7A90]">
          <Lock className="h-3 w-3" />
          Secure SSL
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 py-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                ${step >= s ? 'text-white' : 'text-[#4A5A70]'}`}
                style={{ background: step >= s ? 'linear-gradient(135deg, #FF6B35, #E85D2C)' : 'rgba(255,255,255,0.05)' }}>
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              <div className="ml-3 mr-3">
                <div className={`text-xs font-bold ${step >= s ? 'text-white' : 'text-[#4A5A70]'}`}>
                  {s === 1 ? 'Choose Plan' : s === 2 ? 'Account Info' : 'Complete'}
                </div>
              </div>
              {s < 3 && <div className="flex-1 h-px bg-white/[0.05]" />}
            </div>
          ))}
        </div>

        {/* Step 1: 플랜 선택 */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white mb-2">Choose Your Plan</h1>
              <p className="text-sm text-[#6B7A90]">Start with a 14-day free trial. No credit card required.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PLANS.map(p => (
                <motion.div key={p.id}
                  whileHover={{ y: -5 }}
                  className={`relative rounded-2xl p-6 cursor-pointer transition-all
                    ${selectedPlan === p.id ? 'ring-2' : ''}`}
                  style={{
                    background: "#141820",
                    border: `1px solid ${selectedPlan === p.id ? p.color : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: p.popular ? `0 0 30px ${p.color}20` : 'none',
                  }}
                  onClick={() => setSelectedPlan(p.id)}>
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ background: p.color }}>
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                      <p.icon className="h-5 w-5" style={{ color: p.color }} />
                    </div>
                    <div>
                      <div className="text-lg font-black text-white">{p.name}</div>
                      <div className="text-[10px] text-[#4A5A70]">14-day free trial</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="font-mono text-3xl font-black" style={{ color: p.color }}>
                      {formatUSD(p.price)}
                    </div>
                    <div className="text-xs text-[#6B7A90]">per month · USD</div>
                    {p.setupFee > 0 ? (
                      <div className="text-[10px] text-[#4A5A70] mt-0.5">+ {formatUSD(p.setupFee)} setup</div>
                    ) : (
                      <div className="text-[10px] text-emerald-400 mt-0.5">Free setup</div>
                    )}
                  </div>

                  <div className="space-y-2 mb-5">
                    {p.features.map(f => (
                      <div key={f} className="flex items-start gap-2 text-xs text-[#8899AB]">
                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: p.color }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: selectedPlan === p.id ? `linear-gradient(135deg, ${p.color}, ${p.color}CC)` : `${p.color}15`,
                      color: selectedPlan === p.id ? '#fff' : p.color,
                      border: `1px solid ${p.color}30`,
                    }}>
                    {selectedPlan === p.id ? 'Selected ✓' : 'Select Plan'}
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => selectedPlan && setStep(2)}
                disabled={!selectedPlan}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
                Continue to Account Setup <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: 계정 정보 */}
        {step === 2 && plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {/* 회사 정보 */}
                <div className="rounded-2xl p-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#FF6B35]" /> Company Info
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1">Company Name *</label>
                      <input value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Acme Poker Inc."
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-[#0B1018] border border-[#1A2235] focus:outline-none focus:border-[#FF6B35]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1">Contact Name *</label>
                      <input value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-[#0B1018] border border-[#1A2235] focus:outline-none focus:border-[#FF6B35]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1">Country *</label>
                      <select value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-[#0B1018] border border-[#1A2235] focus:outline-none focus:border-[#FF6B35]">
                        <option value="KR">🇰🇷 South Korea</option>
                        <option value="US">🇺🇸 United States</option>
                        <option value="JP">🇯🇵 Japan</option>
                        <option value="VN">🇻🇳 Vietnam</option>
                        <option value="TH">🇹🇭 Thailand</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5A70]" />
                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                          placeholder="admin@example.com"
                          className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm text-white bg-[#0B1018] border border-[#1A2235] focus:outline-none focus:border-[#FF6B35]" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1">Phone</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+82-10-1234-5678"
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-[#0B1018] border border-[#1A2235] focus:outline-none focus:border-[#FF6B35]" />
                    </div>
                  </div>
                </div>

                {/* 브랜딩 */}
                <div className="rounded-2xl p-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#26A17B]" /> Branding & Domain
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1">Brand Name</label>
                      <input value={formData.brandName} onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                        placeholder="My Poker Site"
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-[#0B1018] border border-[#1A2235] focus:outline-none focus:border-[#26A17B]" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1">Domain</label>
                      <input value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })}
                        placeholder="poker.example.com"
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white bg-[#0B1018] border border-[#1A2235] focus:outline-none focus:border-[#26A17B]" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-[#4A5A70] uppercase tracking-wider block mb-1">Primary Color</label>
                      <div className="flex gap-2">
                        {['#FF6B35', '#26A17B', '#9333EA', '#3B82F6', '#FBBF24', '#EF4444', '#A78BFA'].map(c => (
                          <button key={c} onClick={() => setFormData({ ...formData, primaryColor: c })}
                            className="w-8 h-8 rounded-lg transition-all"
                            style={{
                              background: c,
                              border: formData.primaryColor === c ? '2px solid #fff' : '2px solid transparent',
                              transform: formData.primaryColor === c ? 'scale(1.1)' : 'none',
                            }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 주문 요약 */}
              <div className="rounded-2xl p-6 h-fit sticky top-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold text-white mb-4">Order Summary</h3>

                <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.02)", borderTop: `2px solid ${plan.color}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <plan.icon className="h-4 w-4" style={{ color: plan.color }} />
                    <div className="text-sm font-bold text-white">{plan.name} Plan</div>
                  </div>
                  <div className="font-mono text-xl font-black mb-1" style={{ color: plan.color }}>
                    {formatUSD(plan.price)}<span className="text-xs text-[#6B7A90]">/mo</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between text-[#6B7A90]">
                    <span>Monthly Fee</span>
                    <span className="font-mono">{formatUSD(plan.price)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7A90]">
                    <span>Setup Fee</span>
                    <span className={`font-mono ${plan.setupFee > 0 ? 'text-[#8899AB]' : 'text-emerald-400'}`}>
                      {plan.setupFee > 0 ? formatUSD(plan.setupFee) : 'FREE'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B7A90]">
                    <span>Trial Period</span>
                    <span className="text-emerald-400 font-bold">14 days FREE</span>
                  </div>
                  <div className="border-t border-white/[0.06] pt-2 mt-2 flex justify-between text-white font-bold">
                    <span>Today's Charge</span>
                    <span className="font-mono text-emerald-400">$0</span>
                  </div>
                  <div className="text-[9px] text-[#4A5A70] text-right">
                    Setup fee charged after trial ends
                  </div>
                </div>

                <button onClick={handleSignup}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
                  Start Free Trial
                </button>

                <div className="text-center text-[9px] text-[#4A5A70] mt-3">
                  No credit card required • Cancel anytime
                </div>
              </div>
            </div>

            <button onClick={() => setStep(1)}
              className="mt-6 text-xs text-[#6B7A90] hover:text-white">
              ← Back to plans
            </button>
          </motion.div>
        )}

        {/* Step 3: 완료 */}
        {step === 3 && plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #34D399, #10B981)" }}>
              <Check className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Welcome aboard! 🎉</h1>
            <p className="text-sm text-[#6B7A90] mb-6">
              Your TETHER.BET Holdem partner account is being set up.
              You'll receive an email at <span className="text-white">{formData.email}</span> with login details.
            </p>

            <div className="rounded-2xl p-6 mb-6" style={{ background: "#141820", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Next Steps</h3>
              <div className="space-y-3 text-left">
                {[
                  { num: 1, title: 'Check your email', desc: 'Confirmation link + API credentials' },
                  { num: 2, title: 'Login to admin', desc: 'admin.holdem.tether.bet' },
                  { num: 3, title: 'Configure rooms', desc: 'Customize stakes, branding, agents' },
                  { num: 4, title: 'Embed iframe', desc: 'Copy embed code into your site' },
                  { num: 5, title: 'Go live!', desc: 'Start onboarding your players' },
                ].map(s => (
                  <div key={s.num} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>{s.num}</div>
                    <div>
                      <div className="text-xs text-white font-semibold">{s.title}</div>
                      <div className="text-[10px] text-[#6B7A90]">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a href="/admin" className="inline-block px-8 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FF6B35, #E85D2C)" }}>
              Go to Admin Dashboard
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
