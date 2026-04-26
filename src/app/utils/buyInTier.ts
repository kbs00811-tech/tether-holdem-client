/**
 * Buy-in Tier visual emphasis (Design + Typography expert consensus, 2026-04-26)
 *
 * Classifies room buy-in amounts into 4 stake tiers with distinct color treatment:
 *   - Micro (≤1K)   : slate (neutral grey, low visual noise)
 *   - Low   (≤10K)  : emerald (green, beginner-friendly)
 *   - Mid   (≤100K) : orange (mainstream stake)
 *   - High  (>100K) : gold + ring (high roller, premium ring border)
 *
 * Compact notation:
 *   1,000      → 1K
 *   10,000     → 10K
 *   100,000    → 100K
 *   1,000,000  → 1M
 *
 * Currency prefix rendered by parent (small symbol + large digits + medium suffix).
 */

export interface BuyInTier {
  textColor: string;
  bgClass: string;
  ringClass: string;
}

/** Tier classification — display-unit-agnostic (works with any fiat or USDT) */
export function getBuyInTier(amount: number): BuyInTier {
  if (amount >= 100_000) {
    // High roller — gold + ring
    return {
      textColor: '#FFD700',
      bgClass: 'bg-yellow-500/15',
      ringClass: 'ring-1 ring-yellow-500/30',
    };
  }
  if (amount >= 10_000) {
    // Mid stake — orange
    return {
      textColor: '#FF8A4C',
      bgClass: 'bg-orange-500/15',
      ringClass: '',
    };
  }
  if (amount >= 1_000) {
    // Low stake — emerald
    return {
      textColor: '#34D399',
      bgClass: 'bg-emerald-500/10',
      ringClass: '',
    };
  }
  // Micro — slate
  return {
    textColor: '#94A3B8',
    bgClass: 'bg-slate-500/10',
    ringClass: '',
  };
}

/**
 * Compact numeric formatter — for buy-in emphasis in room list.
 *   1,000     → "1K"
 *   10,000    → "10K"
 *   1,234,567 → "1.2M"
 */
export function formatBuyInCompact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return v >= 10 ? `${Math.round(v)}M` : `${v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return v >= 100 ? `${Math.round(v)}K` : v >= 10 ? `${Math.round(v)}K` : `${v.toFixed(1)}K`;
  }
  return String(n);
}

/**
 * Buy-in display token splitter.
 *   Splits e.g. "₩50,000" or "$50.00" into prefix + compact-amount + suffix tokens.
 *
 * Returns:
 *   { prefix: '₩', amount: '50', suffix: 'K' }   (e.g. 50,000)
 *   { prefix: '$', amount: '50', suffix: '' }    (e.g. 50)
 */
export function splitBuyInDisplay(n: number, currencySymbol: string = '₮'): {
  prefix: string;
  amount: string;
  suffix: string;
} {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return { prefix: currencySymbol, amount: v >= 10 ? String(Math.round(v)) : v.toFixed(1), suffix: 'M' };
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return { prefix: currencySymbol, amount: v >= 10 ? String(Math.round(v)) : v.toFixed(1), suffix: 'K' };
  }
  return { prefix: currencySymbol, amount: String(n), suffix: '' };
}

/**
 * Dual-display token splitter for USDT cents + secondary fiat (Beta-G+ 2026-04-27)
 *
 * Layout strategy by user's preferred display currency:
 *   - Fiat preferred (any region): main=fiat (familiarity) / sub=USDT (settlement asset)
 *   - USDT preferred (global default): main=USDT (asset) / sub=USD (reference)
 *
 * Args:
 *   amount: display-unit integer (any fiat or USDT cents)
 *   currencySymbol: preferred display symbol (e.g. ₩/$/₮)
 */
export function splitDualDisplay(
  amount: number,
  mainSymbol: string,
  subAmount: number | null,
  subSymbol: string | null,
): {
  main: { prefix: string; amount: string; suffix: string };
  sub: { prefix: string; amount: string; suffix: string } | null;
} {
  return {
    main: splitBuyInDisplay(amount, mainSymbol),
    sub: subAmount !== null && subSymbol !== null
      ? splitBuyInDisplay(subAmount, subSymbol)
      : null,
  };
}
