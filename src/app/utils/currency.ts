/**
 * TETHER.BET Holdem - Currency Display
 *
 * Beta-G++ (2026-04-27): rateStore 와 브릿지.
 *   서버는 모든 금액을 KRW-cents (= ₩ × 100) 으로 송신 (legacy from KR-only era).
 *   호출자는 (cents/100) 로 KRW major 를 넘긴다고 가정 — getSymbol/formatMoney 가
 *   rateStore.displayCurrency 에 따라 자동 변환 + 심볼 적용.
 *
 *   displayCurrency=USDT 면 KRW major → USDT 변환 (÷ usdtKrw)
 *   displayCurrency=USD/EUR/JPY 면 USDT 거쳐 환산 (× fiatPerUSDT)
 *
 *   호출 사이트 변경 없이 게임 테이블 전역이 사용자 선호 통화로 표시.
 */

import { useRateStore } from '../stores/rateStore';

const CURRENCY_CONFIG: Record<string, { symbol: string; decimals: number; name: string }> = {
  KRW: { symbol: '₩', decimals: 0, name: 'Korean Won' },
  USD: { symbol: '$', decimals: 2, name: 'US Dollar' },
  USDT: { symbol: '₮', decimals: 2, name: 'Tether' },
  JPY: { symbol: '¥', decimals: 0, name: 'Japanese Yen' },
  EUR: { symbol: '€', decimals: 2, name: 'Euro' },
  GBP: { symbol: '£', decimals: 2, name: 'British Pound' },
  CNY: { symbol: '¥', decimals: 2, name: 'Chinese Yuan' },
  VND: { symbol: '₫', decimals: 0, name: 'Vietnamese Dong' },
  THB: { symbol: '฿', decimals: 2, name: 'Thai Baht' },
  PHP: { symbol: '₱', decimals: 2, name: 'Philippine Peso' },
};

// Legacy: 호출자가 명시적으로 통화를 강제할 때만 사용 (대시보드 등)
let overrideCurrency: string | null = null;

export function setCurrency(currency: string): void { overrideCurrency = currency; }
export function clearCurrencyOverride(): void { overrideCurrency = null; }

/** 현재 활성 통화 — override > rateStore.displayCurrency > KRW */
export function getCurrency(): string {
  if (overrideCurrency) return overrideCurrency;
  try { return useRateStore.getState().displayCurrency; } catch { return 'KRW'; }
}

/** KRW major 단위 → 현재 활성 통화 단위로 변환 */
function convertFromKrwMajor(krwMajor: number, target: string): number {
  if (target === 'KRW') return krwMajor;
  let rates;
  try { rates = useRateStore.getState().effectiveRates(); }
  catch { return krwMajor; } // SSR / store 미초기화 시 KRW 유지
  const usdtKrw = rates.usdtKrw || 1400;
  const usdt = krwMajor / usdtKrw;
  switch (target) {
    case 'USDT': return usdt;
    case 'USD': return usdt * (rates.usdtUsd || 1);
    case 'EUR': return usdt * (rates.usdtEur || 0.92);
    case 'JPY': return usdt * (rates.usdtJpy || 156);
    default: return krwMajor;
  }
}

/** 금액 포맷 — 입력은 KRW major 단위로 가정 (legacy) */
export function formatMoney(amount: number, currency?: string): string {
  const cur = currency ?? getCurrency();
  const config = CURRENCY_CONFIG[cur] ?? CURRENCY_CONFIG.KRW!;
  const value = convertFromKrwMajor(amount, cur);
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  return `${config.symbol}${formatted}`;
}

/** 통화 심볼만 — getCurrency() 의 심볼 반환 */
export function getSymbol(currency?: string): string {
  const cur = currency ?? getCurrency();
  return CURRENCY_CONFIG[cur]?.symbol ?? '₩';
}

/**
 * 변환된 금액 문자열 (심볼 미포함) — 호출 사이트가 ${getSymbol()}${value} 패턴일 때
 * value 부분을 자동 환산하기 위한 헬퍼.
 *
 * 사용:
 *   {getSymbol()}{formatAmount(krwMajor)}     // 자동 변환 + 포맷
 *   formatMoney(krwMajor)                     // 심볼 포함 단축형
 */
export function formatAmount(krwMajor: number, currency?: string): string {
  const cur = currency ?? getCurrency();
  const config = CURRENCY_CONFIG[cur] ?? CURRENCY_CONFIG.KRW!;
  const value = convertFromKrwMajor(krwMajor, cur);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
}
