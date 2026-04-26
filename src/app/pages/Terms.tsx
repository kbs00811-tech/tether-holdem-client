/**
 * Terms of Service — Beta-G Day 2-3 (2026-04-26)
 *
 * 영문 standard 1종. 다국어는 출시 후 별도 작업.
 * iGaming/poker 표준 ToS. 법무 검토 권장.
 */

import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0B0E14] dark text-white">
      <div className="border-b border-white/[0.06] sticky top-0 z-30 bg-[#0B0E14]/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/" className="text-[#8899AB] hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-black">Terms of Service</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 prose prose-invert prose-sm">
        <p className="text-[10px] text-[#4A5A70] mb-6">Last updated: 2026-04-26 · v1.0 (beta)</p>

        <h2 className="text-base font-bold mt-6 mb-3">1. Acceptance of Terms</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          By accessing or using TETHER.BET HOLDEM ("the Service"), you agree to be bound by these Terms of Service.
          If you do not agree, do not use the Service.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">2. Eligibility</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-2">You must be:</p>
        <ul className="text-sm text-[#8899AB] leading-relaxed mb-4 list-disc pl-5">
          <li>At least 18 years old (or the legal age of majority in your jurisdiction, whichever is higher)</li>
          <li>Located in a jurisdiction where online poker is legally permitted</li>
          <li>Not a resident of any restricted country (see Section 8)</li>
          <li>Not a self-excluded player or on any responsible gaming exclusion list</li>
        </ul>

        <h2 className="text-base font-bold mt-6 mb-3">3. Account Registration</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          You agree to provide accurate, current, and complete information. You are responsible for all activities
          on your account. Multi-accounting (operating more than one account) is strictly prohibited and may result
          in immediate account closure and forfeiture of funds.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">4. Deposits and Withdrawals</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          All financial transactions are processed via approved payment partners. You acknowledge that:
        </p>
        <ul className="text-sm text-[#8899AB] leading-relaxed mb-4 list-disc pl-5">
          <li>Cryptocurrency (USDT) deposits are subject to network fees and confirmation times</li>
          <li>Withdrawals may require KYC (Know Your Customer) verification</li>
          <li>The Service reserves the right to refuse or reverse transactions suspected of fraud or money laundering</li>
        </ul>

        <h2 className="text-base font-bold mt-6 mb-3">5. Game Integrity</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          The Service uses provably fair shuffling (SHA-256 verifiable). Any form of:
        </p>
        <ul className="text-sm text-[#8899AB] leading-relaxed mb-4 list-disc pl-5">
          <li>Collusion (cooperation with other players to gain unfair advantage)</li>
          <li>Bot or automated play (without explicit permission)</li>
          <li>Exploitation of bugs or glitches</li>
        </ul>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          will result in immediate account termination and forfeiture of funds.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">6. Responsible Gaming</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          Gambling involves financial risk. Only play with funds you can afford to lose. The Service provides
          self-exclusion tools and deposit limits. If you or someone you know has a gambling problem, please
          contact your local responsible gaming organization.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">7. Intellectual Property</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          All content, software, and trademarks of the Service are owned by TETHER.BET. Reproduction or
          unauthorized use is prohibited.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">8. Restricted Jurisdictions</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          The Service is not available to residents or persons located in: United States, France, Italy, Spain,
          Australia, Israel, Singapore, Hong Kong, Iran, North Korea, and other jurisdictions where online poker
          is prohibited. Attempting to access via VPN or proxy is a violation of these Terms.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">9. Limitation of Liability</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          The Service is provided "as is" without warranties. To the fullest extent permitted by law, TETHER.BET
          shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">10. Modifications</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance.
          Material changes will be communicated via email or in-app notification.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">11. Currency, Settlement Asset & Display (Critical)</h2>
        <div className="rounded-xl p-4 mb-4"
          style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.25)" }}>
          <p className="text-sm text-[#FFB085] leading-relaxed mb-2 font-bold">
            ⚠️ Important: Settlement Asset = USDT (Tether)
          </p>
          <p className="text-sm text-[#8899AB] leading-relaxed">
            All deposits, withdrawals, buy-ins, bets, pots, and prize payouts are denominated in
            <strong className="text-white"> USDT (Tether ERC-20/TRC-20)</strong>. USDT is the sole
            settlement asset on this Service.
          </p>
        </div>

        <p className="text-sm text-[#8899AB] leading-relaxed mb-2"><strong className="text-white">11.1 Display Currency Is Informational Only.</strong></p>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-3">
          The Service may display amounts in a fiat currency (KRW, USD, EUR, JPY etc.) for user convenience.
          These figures are <strong className="text-white">non-binding visual conversions</strong> derived from third-party exchange
          rate sources and have <strong className="text-white">no contractual or legal status as the actual settlement amount</strong>.
          The authoritative ledger entry is always in USDT.
        </p>

        <p className="text-sm text-[#8899AB] leading-relaxed mb-2"><strong className="text-white">11.2 Exchange Rate Sources.</strong></p>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-3">
          USDT peg is monitored via Binance and Kraken (USDC/USDT and USDT/USD pairs).
          Fiat conversion (USD, KRW, EUR, JPY, etc.) uses open.er-api.com (US Federal Reserve sourced
          rates, 154 currencies). Cryptocurrency spot prices use CoinGecko aggregated data.
          Sources may change without notice. The Service makes no warranty as to the accuracy,
          timeliness, or availability of any rate source.
        </p>

        <p className="text-sm text-[#8899AB] leading-relaxed mb-2"><strong className="text-white">11.3 Rate Volatility Disclaimer.</strong></p>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-3">
          Cryptocurrency exchange rates are inherently volatile. The fiat-equivalent display of your
          USDT balance, buy-in, or winnings <strong className="text-white">may change between hands</strong>. Your underlying
          USDT amount remains constant. By using the Service you accept this volatility and waive any
          claim against the Service for changes in fiat-equivalent display values.
        </p>

        <p className="text-sm text-[#8899AB] leading-relaxed mb-2"><strong className="text-white">11.4 No Fiat Currency Acceptance.</strong></p>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-3">
          The Service does not accept, hold, or settle in any fiat currency. KRW deposits processed
          via approved payment partners (e.g., PeerX) are converted to USDT at the time of credit
          based on the prevailing rate, and the user&apos;s on-chain ledger is updated in USDT only.
        </p>

        <p className="text-sm text-[#8899AB] leading-relaxed mb-2"><strong className="text-white">11.5 Skill-Based Game Notice.</strong></p>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-3">
          Texas Hold&apos;em poker is a game of skill where the long-term outcome is determined predominantly
          by player decisions. Where local law distinguishes between games of skill and games of chance,
          the Service is positioned as a skill-based competition. You are responsible for verifying the
          legal status of skill-based poker in your jurisdiction.
        </p>

        <p className="text-sm text-[#8899AB] leading-relaxed mb-2"><strong className="text-white">11.6 Self-Exclusion & Responsible Gaming.</strong></p>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-3">
          You may request self-exclusion at any time via support@tethergame.io. Once self-excluded,
          you may not access the Service for the requested period (minimum 30 days). The Service also
          enforces deposit and session-time limits per applicable responsible gaming regulations.
        </p>

        <p className="text-sm text-[#8899AB] leading-relaxed mb-2"><strong className="text-white">11.7 Dispute Resolution & Governing Law.</strong></p>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-3">
          Disputes shall be resolved by binding arbitration under the rules of the operating
          licensor&apos;s jurisdiction (Anjouan / Curaçao, as applicable). User waives the right to
          class actions. Korean residents acknowledge that the Service operates as a USDT skill-game
          platform and that fiat-display values are informational only.
        </p>

        <h2 className="text-base font-bold mt-6 mb-3">12. Contact</h2>
        <p className="text-sm text-[#8899AB] leading-relaxed mb-4">
          For questions or disputes, contact: support@tethergame.io
        </p>

        <div className="mt-12 pt-6 border-t border-white/[0.06]">
          <p className="text-[10px] text-[#4A5A70]">
            By using TETHER.BET HOLDEM, you acknowledge you have read, understood, and agree to these Terms.
          </p>
          <Link to="/privacy" className="text-[11px] text-[#FF6B35] mt-3 inline-block">→ Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
