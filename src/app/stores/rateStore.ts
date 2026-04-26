/**
 * Exchange Rate Store (Beta-G+ 2026-04-27)
 *
 * Server pushes EXCHANGE_RATES WS message:
 *   { usdtKrw: 1400, usdtUsd: 1.00, usdtEur: 0.92, usdtJpy: 156, ts: ... }
 *
 * Usage:
 *   - Server-side accounting unit: USDT cents (integer)
 *   - Client-side display: converted to user's preferred fiat
 *   - 1 USDT = N FIAT (held in rateStore)
 *
 * Hand-Freeze: snapshot rate at hand start to prevent in-hand drift.
 */

import { create } from 'zustand';

export interface ExchangeRates {
  usdtKrw: number;  // 1 USDT = N KRW
  usdtUsd: number;  // 1 USDT = N USD (≈1.00 with peg)
  usdtEur: number;
  usdtJpy: number;
  updatedAt: number;
  /** Source attribution (verifiable via DevTools — global rate sources only) */
  sources?: {
    USDT_PEG: string;  // e.g. "Binance/Kraken (2 samples, avg 1.0001)"
    FX: string;         // e.g. "open.er-api.com (US Fed data)"
  };
}

/** User-preferred display currency (Beta-G+ 2026-04-27) */
export type DisplayCurrency = 'KRW' | 'USDT' | 'USD' | 'EUR' | 'JPY';

interface RateStore {
  rates: ExchangeRates;
  /** Hand-Freeze: locked rate during in-hand (null = use live rates) */
  frozenRates: ExchangeRates | null;
  /** User-preferred display currency (cycled from header) */
  displayCurrency: DisplayCurrency;
  setRates: (r: Partial<ExchangeRates>) => void;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  cycleDisplayCurrency: () => void;
  /** Call at hand start — freeze current rate snapshot */
  freezeForHand: () => void;
  /** Call at hand end — unlock */
  unfreezeForHand: () => void;
  /** Fiat units per 1 USDT (UI forward rate) — 0 if unsupported */
  fiatPerUSDT: (currency: string) => number;
  /** USDT cents → fiat display amount */
  toFiat: (usdtCents: number, currency: string) => number;
  /** Effective rates (frozenRates ?? rates) */
  effectiveRates: () => ExchangeRates;
}

const CURRENCY_CYCLE: DisplayCurrency[] = ['KRW', 'USDT', 'USD'];

function loadDisplayCurrency(): DisplayCurrency {
  if (typeof window === 'undefined') return 'USDT';
  try {
    const saved = localStorage.getItem('display_currency');
    if (saved && (CURRENCY_CYCLE as string[]).includes(saved)) return saved as DisplayCurrency;
    // First load — locale-derived default
    const lang = navigator.language?.toLowerCase() || '';
    if (lang.startsWith('ko')) return 'KRW';
    return 'USDT'; // global default
  } catch { return 'USDT'; }
}

export const useRateStore = create<RateStore>((set, get) => ({
  rates: {
    usdtKrw: 1400, usdtUsd: 1.00, usdtEur: 0.92, usdtJpy: 156, updatedAt: 0,
  },
  frozenRates: null,
  displayCurrency: loadDisplayCurrency(),
  setRates: (r) => set((s) => ({ rates: { ...s.rates, ...r, updatedAt: Date.now() } })),
  setDisplayCurrency: (c) => {
    try { localStorage.setItem('display_currency', c); } catch {}
    set({ displayCurrency: c });
  },
  cycleDisplayCurrency: () => {
    const cur = get().displayCurrency;
    const idx = CURRENCY_CYCLE.indexOf(cur);
    const next = CURRENCY_CYCLE[(idx + 1) % CURRENCY_CYCLE.length];
    try { localStorage.setItem('display_currency', next); } catch {}
    set({ displayCurrency: next });
  },
  freezeForHand: () => set((s) => ({ frozenRates: { ...s.rates } })),
  unfreezeForHand: () => set({ frozenRates: null }),
  effectiveRates: () => get().frozenRates ?? get().rates,
  fiatPerUSDT: (currency) => {
    const r = get().effectiveRates();
    switch (currency.toUpperCase()) {
      case 'KRW': return r.usdtKrw;
      case 'USD': return r.usdtUsd;
      case 'EUR': return r.usdtEur;
      case 'JPY': return r.usdtJpy;
      case 'USDT': return 1;
      default: return 0;
    }
  },
  toFiat: (usdtCents, currency) => {
    const usdt = usdtCents / 100;
    return usdt * get().fiatPerUSDT(currency);
  },
}));
