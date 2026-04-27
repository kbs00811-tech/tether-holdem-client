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

/** KRW major 단위 → 현재 활성 통화 단위로 변환 (numeric, no symbol) */
export function fromKrwMajor(krwMajor: number, target?: string): number {
  return convertFromKrwMajor(krwMajor, target ?? getCurrency());
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

/**
 * 역변환: 현재 활성 통화 단위 → KRW major
 * 베팅 입력 박스 등에서 사용자가 입력한 값을 서버 단위(KRW-cents)로 환산하기 위해.
 *
 * 예: 사용자가 USDT 모드에서 "5" 입력 (₮5 의도)
 *   → toKrwMajor(5, 'USDT') = 5 × 1400 = 7000 (₩7,000)
 *   → ×100 cents = 700,000 (서버 단위)
 */
export function toKrwMajor(value: number, source?: string): number {
  const cur = source ?? getCurrency();
  if (cur === 'KRW') return value;
  let rates;
  try { rates = useRateStore.getState().effectiveRates(); }
  catch { return value; }
  const usdtKrw = rates.usdtKrw || 1400;
  switch (cur) {
    case 'USDT': return value * usdtKrw;
    case 'USD': return (value / (rates.usdtUsd || 1)) * usdtKrw;
    case 'EUR': return (value / (rates.usdtEur || 0.92)) * usdtKrw;
    case 'JPY': return (value / (rates.usdtJpy || 156)) * usdtKrw;
    default: return value;
  }
}

/**
 * 디자인팀 가독성 규칙 (2026-04-27):
 *   매그니튜드별 자릿수 자동 조정 — "₮33.83" 같은 노이즈 제거
 *
 *   |amount|       fraction digits  compact
 *   ─────────────────────────────────────
 *    < 1            2                X       (예: ₮0.36, $0.71)
 *    1 ~ 9.99       1                X       (예: ₮3.5, $7.2)
 *    10 ~ 999       0                X       (예: ₮34, ₮500)
 *    1K ~ 9.99K     0 (× 1000)       K       (예: ₮3K, ₮5K)
 *    10K ~ 999K     0 (× 1000)       K       (예: ₮34K, ₮500K)
 *    >= 1M          1 (× 1M)         M       (예: ₮1.2M)
 *
 *   KRW/JPY/VND (zero-decimal) 는 절대값 그대로 유지하되 ≥1K 이면 compact.
 */
function smartFormat(value: number, baseDecimals: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return (value / 1_000_000).toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + 'M';
  }
  if (abs >= 1_000) {
    return Math.round(value / 1_000).toLocaleString('en-US') + 'K';
  }
  // < 1000 — baseDecimals 기준이지만 USDT/USD 류는 매그니튜드별 자동 조정
  if (baseDecimals === 0) {
    // KRW / JPY 류 — 절대값 정수
    return Math.round(value).toLocaleString('en-US');
  }
  // USDT / USD / EUR 류
  if (abs < 1) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (abs < 10) return value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return Math.round(value).toLocaleString('en-US');
}

/** 금액 포맷 — 입력은 KRW major 단위로 가정 (legacy) */
export function formatMoney(amount: number, currency?: string): string {
  const cur = currency ?? getCurrency();
  const config = CURRENCY_CONFIG[cur] ?? CURRENCY_CONFIG.KRW!;
  const value = convertFromKrwMajor(amount, cur);
  return `${config.symbol}${smartFormat(value, config.decimals)}`;
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
  return smartFormat(value, config.decimals);
}
