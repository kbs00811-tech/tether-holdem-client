/**
 * Privacy Policy — Beta-G Day 2-3 (2026-04-26)
 *
 * GDPR/CCPA 기본 준수. 법무 검토 권장.
 */

import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0B0E14] dark text-white">
      <div className="border-b border-white/[0.06] sticky top-0 z-30 bg-[#0B0E14]/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="text-[#8899AB] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-black">Privacy Policy</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 prose prose-invert prose-sm">
        <p className="text-[10px] text-[#4A5A70] mb-6">Last updated: 2026-04-26 · v1.0 (beta)</p>

        <h2 className="text-base font-bold mt-6 mb-3">1. Information We Collect</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-2">We collect:</p>
        <ul className="text-sm text-[#8899AB] leading-relaxed mb-4 list-disc pl-5">
          <li><strong className="text-white">Account data</strong>: nickname, email/phone (if provided), country, avatar</li>
          <li><strong className="text-white">Game data</strong>: hand history, statistics, table activity, chat messages</li>
          <li><strong className="text-white">Financial data</strong>: deposit/withdrawal amounts, payment method (no card numbers stored)</li>
          <li><strong className="text-white">Technical data</strong>: IP address, device type, browser, language preferences</li>
          <li><strong className="text-white">Communication</strong>: support tickets, notifications opt-in</li>
        </ul>

        <h2 className="text-base font-bold mt-6 mb-3">2. How We Use Your Data</h2>
        <ul className="text-sm text-[#8899AB] leading-relaxed mb-4 list-disc pl-5">
          <li>Operate and improve the Service (game functionality, anti-cheat detection)</li>
          <li>Process deposits and withdrawals via approved payment partners</li>
          <li>Comply with legal obligations (KYC, anti-money laundering)</li>
          <li>Send notifications about your account, promotions, and game events</li>
          <li>Detect and prevent fraud, collusion, and other prohibited activities</li>
        </ul>

        <h2 className="text-base font-bold mt-6 mb-3">3. Data Sharing</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-2">We share data with:</p>
        <ul className="text-sm text-[#8899AB] leading-relaxed mb-4 list-disc pl-5">
          <li><strong className="text-white">Payment partners</strong> (PeerX, blockchain networks for crypto)</li>
          <li><strong className="text-white">Infrastructure providers</strong> (Supabase, Railway, Vercel — under their respective DPAs)</li>
          <li><strong className="text-white">Telegram</strong> if you opt in to bot notifications</li>
          <li><strong className="text-white">Regulators or law enforcement</strong> when legally required</li>
        </ul>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          We do <strong className="text-white">not</strong> sell your personal data to third parties for marketing.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">4. Cookies and Local Storage</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          We use essential cookies and localStorage for: session management, language preference, sound settings,
          and game state. Analytics cookies (if any) are session-based and anonymized.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">5. Your Rights (GDPR / CCPA)</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-2">If you reside in the EU/UK or California, you have the right to:</p>
        <ul className="text-sm text-[#8899AB] leading-relaxed mb-4 list-disc pl-5">
          <li><strong className="text-white">Access</strong>: request a copy of your personal data</li>
          <li><strong className="text-white">Rectification</strong>: correct inaccurate data</li>
          <li><strong className="text-white">Erasure</strong>: request deletion (subject to legal retention periods, typically 5 years for financial records)</li>
          <li><strong className="text-white">Portability</strong>: export your data in a machine-readable format</li>
          <li><strong className="text-white">Objection</strong>: opt out of marketing communications</li>
          <li><strong className="text-white">Withdrawal of consent</strong>: at any time, where processing is based on consent</li>
        </ul>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          To exercise these rights, contact: <a href="mailto:privacy@tethergame.io" className="text-[#FF6B35]">privacy@tethergame.io</a>
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">6. Data Retention</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          Account and transaction data are retained for at least 5 years after account closure, as required by
          anti-money laundering regulations. Game logs are retained for 90 days.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">7. Security</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          We use industry-standard encryption (TLS, hashed passwords with bcrypt, HMAC-SHA-256 for webhooks)
          and follow security best practices. However, no system is 100% secure — you are responsible for
          keeping your credentials confidential.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">8. Children's Privacy</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          The Service is not intended for users under 18. We do not knowingly collect data from minors.
          If you believe a minor has provided data, contact us for immediate deletion.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">9. International Transfers</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          Data may be processed in countries outside your residence (Korea, USA for Supabase/Railway).
          We rely on Standard Contractual Clauses (SCCs) for EU data transfers.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">10. Updates to this Policy</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          We may update this Policy. Material changes will be announced via in-app notification or email.
          Continued use after changes constitutes acceptance.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">11. Contact</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          Privacy inquiries: <a href="mailto:privacy@tethergame.io" className="text-[#FF6B35]">privacy@tethergame.io</a>
          <br/>
          Data Protection Officer: <a href="mailto:dpo@tethergame.io" className="text-[#FF6B35]">dpo@tethergame.io</a>
        </p>

        <div className="mt-12 pt-6 border-t border-white/[0.06]">
          <Link to="/terms" className="text-[11px] text-[#FF6B35]">→ Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
