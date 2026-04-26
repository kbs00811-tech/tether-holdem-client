/**
 * USDT asset-model onboarding (Beta-G+ 2026-04-27)
 *
 * Shown once on first visit — localStorage 'usdt_onboarded_v1' flag.
 * Communicates USDT single-asset model + fiat display informational notice (ToS Section 11).
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Coins, Info } from "lucide-react";
import { useT } from "../../i18n";
import { Link } from "react-router";

export function UsdtOnboardingModal() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      // Skip if already shown OR running inside iframe (B2C host handles its own onboarding)
      if (localStorage.getItem('usdt_onboarded_v1') === '1') return;
      const inIframe = window.self !== window.top;
      if (inIframe) return;
      // Brief delay for UI to settle
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    } catch {}
  }, []);

  const dismiss = () => {
    try { localStorage.setItem('usdt_onboarded_v1', '1'); } catch {}
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="max-w-md w-full rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg, #141820, #0F1419)",
              border: "1px solid rgba(38,161,123,0.3)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(38,161,123,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #26A17B, #1E7E5C)", boxShadow: "0 0 24px rgba(38,161,123,0.4)" }}>
                <Coins className="h-8 w-8 text-white" />
              </div>
            </div>

            <h2 className="text-xl font-black text-white text-center mb-2">
              💎 Powered by USDT
            </h2>
            <p className="text-sm text-[#26A17B] text-center font-bold mb-4">
              Tether (USDT) — Real Crypto Asset
            </p>

            <div className="rounded-xl p-4 mb-4 space-y-2.5"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">💰</span>
                <p className="text-[12px] text-[#C0CDDB] leading-relaxed">
                  <strong className="text-white">All chips, pots, and winnings are real USDT.</strong>{" "}
                  Your balance is actual Tether stablecoin held by the platform.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">📊</span>
                <p className="text-[12px] text-[#C0CDDB] leading-relaxed">
                  <strong className="text-white">Local prices (₩, $, €) shown for convenience</strong>{" "}
                  — sourced from global rate providers (Binance / Kraken / open.er-api), refreshed every 5 minutes. Informational only.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">🔒</span>
                <p className="text-[12px] text-[#C0CDDB] leading-relaxed">
                  <strong className="text-white">Provably fair shuffles</strong>, deterministic on-chain
                  ledger. Withdrawals settle in USDT to your wallet.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
              style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)" }}>
              <Info className="h-3.5 w-3.5 text-[#FF6B35] shrink-0" />
              <p className="text-[10px] text-[#8899AB] leading-tight">
                Fiat-equivalent display values may fluctuate with market rates.
                Your USDT amount remains constant.
              </p>
            </div>

            <button
              onClick={dismiss}
              className="w-full py-3 rounded-xl text-sm font-black text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #26A17B, #1E7E5C)",
                boxShadow: "0 4px 16px rgba(38,161,123,0.3)",
              }}
            >
              Got It · Let&apos;s Play
            </button>
            <p className="text-center mt-3">
              <Link to="/terms" onClick={dismiss}
                className="text-[10px] text-[#6B7A90] underline">
                Read full Terms · Section 11
              </Link>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
