/**
 * Exchange Rate Store (Beta-G+ 2026-04-27)
 *
 * 서버가 EXCHANGE_RATES WS 메시지로 환율 push:
 *   { usdtKrw: 1400, usdtUsd: 1.00, usdtEur: 0.92, usdtJpy: 156, ts: ... }
 *
 * 사용 시나리오:
 *   - 서버 자산 단위 = USDT cents (정수)
 *   - 클라 표시: 사용자 선호 통화로 환산
 *   - 1 USDT = N FIAT (rateStore 가 보유)
 *
 * Hand-Freeze: 핸드 시작 시 rate snapshot → useFrozenRate hook 사용
 */

import { create } from 'zustand';

export interface ExchangeRates {
  usdtKrw: number;  // 1 USDT = N KRW
  usdtUsd: number;  // 1 USDT = N USD (≈1.00)
  usdtEur: number;
  usdtJpy: number;
  updatedAt: number;
}

/** 사용자 선호 표시 통화 (Beta-G+ 2026-04-27) */
export type DisplayCurrency = 'KRW' | 'USDT' | 'USD' | 'EUR' | 'JPY';

interface RateStore {
  rates: ExchangeRates;
  /** Hand-Freeze: 핸드 진행 중 사용할 lock 환율 (null = 실시간 사용) */
  frozenRates: ExchangeRates | null;
  /** 사용자 선호 표시 통화 (헤더에서 클릭 cycle) */
  displayCurrency: DisplayCurrency;
  setRates: (r: Partial<ExchangeRates>) => void;
  setDisplayCurrency: (c: DisplayCurrency) => void;
  cycleDisplayCurrency: () => void;
  /** Hand 시작 시 호출 — 현재 환율 freeze */
  freezeForHand: () => void;
  /** Hand 종료 시 호출 — freeze 해제 */
  unfreezeForHand: () => void;
  /** 1 USDT 당 fiat 단위 수 (UI 표시용) — currency 미지원 시 0 */
  fiatPerUSDT: (currency: string) => number;
  /** USDT cents → fiat 표시 금액 */
  toFiat: (usdtCents: number, currency: string) => number;
  /** Hand-Freeze 상태에서 현재 사용 환율 (frozenRates ?? rates) */
  effectiveRates: () => ExchangeRates;
}

const CURRENCY_CYCLE: DisplayCurrency[] = ['KRW', 'USDT', 'USD'];

function loadDisplayCurrency(): DisplayCurrency {
  if (typeof window === 'undefined') return 'KRW';
  try {
    const saved = localStorage.getItem('display_currency');
    if (saved && (CURRENCY_CYCLE as string[]).includes(saved)) return saved as DisplayCurrency;
    // 첫 진입: navigator.language 기반 기본값
    const lang = navigator.language?.toLowerCase() || '';
    if (lang.startsWith('ko')) return 'KRW';
    return 'USDT'; // 글로벌 default
  } catch { return 'KRW'; }
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
