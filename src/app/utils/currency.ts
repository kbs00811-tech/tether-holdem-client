/**
 * TETHER.BET Holdem - Currency Display
 * API 응답의 currency 필드 기반 자동 통화 전환
 */

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

// 현재 유저 통화 (API 응답에서 설정)
let currentCurrency = 'KRW';

export function setCurrency(currency: string): void {
  currentCurrency = currency;
}

export function getCurrency(): string {
  return currentCurrency;
}

/** 금액 포맷 (현재 통화 기준) */
export function formatMoney(amount: number, currency?: string): string {
  const cur = currency ?? currentCurrency;
  const config = CURRENCY_CONFIG[cur] ?? CURRENCY_CONFIG.KRW!;

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  return `${config.symbol}${formatted}`;
}

/** 통화 심볼만 */
export function getSymbol(currency?: string): string {
  const cur = currency ?? currentCurrency;
  return CURRENCY_CONFIG[cur]?.symbol ?? '₩';
}
