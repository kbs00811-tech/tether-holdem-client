/**
 * Buy-in Tier 시각 강조 (전문가 합의 — 디자인 + 폰트, 2026-04-26)
 *
 * 룸 리스트에서 buy-in 금액을 stake 수준에 따라 4개 tier 색상으로 분류:
 *   - Micro (≤1K)   : slate (회색)
 *   - Low   (≤10K)  : emerald (그린)
 *   - Mid   (≤100K) : orange (오렌지)
 *   - High  (>100K) : gold + ring (금색 + 테두리 강조)
 *
 * 표기 (compact):
 *   1,000      → 1K
 *   10,000     → 10K
 *   100,000    → 100K
 *   1,000,000  → 1M
 *
 * 통화 prefix는 부모에서 별도 표시 (₩ 작게 + 숫자 크게 + K 중간).
 */

export interface BuyInTier {
  textColor: string;
  bgClass: string;
  ringClass: string;
}

/** Tier 분류 — KRW 단위 (또는 currency-agnostic 비례) */
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
 * Compact 숫자 표기 — 룸 리스트 buy-in 강조용
 *   1,000  → "1K"
 *   10,000 → "10K"
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
 * Buy-in 표시용 분리 토큰
 *   "₩50,000" 또는 "$50.00" 같은 통화 + 압축된 숫자 + 단위 분리
 *
 * 반환:
 *   { prefix: '₩', amount: '50', suffix: 'K' }   (KRW 50,000)
 *   { prefix: '$', amount: '50', suffix: '' }    (USD 50)
 */
export function splitBuyInDisplay(n: number, currencySymbol: string = '₩'): {
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
