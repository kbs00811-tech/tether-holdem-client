/**
 * Geo Guard (Beta-G Day 2-3, 2026-04-26)
 *
 * 클라이언트 사이드 경량 차단 — 진짜 IP 차단은 Cloudflare 등 인프라 레벨에서.
 * 이 모듈은 first defense + 안내 페이지.
 *
 * 차단 국가 (iGaming 금지 기본):
 *   US, FR, IT, ES (스페인 도박 라이선스 요구), AU, IL, SG, HK,
 *   IR, KP (제재), CN (실제로는 VPN 우회)
 *
 * 우회 가능 (의도): VPN/Proxy 사용자는 차단 못 함 — 책임은 사용자에게
 *
 * 검출 방법:
 *   1. navigator.language 의 region (ko-KR, en-US 등) — 약함
 *   2. Intl.DateTimeFormat().resolvedOptions().timeZone — 강함 (KR=Asia/Seoul, US=America/...)
 *   3. (옵션) Cloudflare CF-IPCountry 헤더 — 서버 측 인젝션 필요
 *
 * 정책 (베타):
 *   - HARD_BLOCKED: 안내 페이지 + 진입 차단
 *   - SOFT_WARN: 배너 안내, 진입은 허용 (E.U. 일부)
 *   - 그 외: 통과
 */

const HARD_BLOCKED_COUNTRIES = new Set([
  'US', // 미국 — 연방 UIGEA + 주별 차이 (NJ/NV/PA 등 일부 합법이지만 라이선스 없으면 불법)
  'FR', // 프랑스 — ARJEL 라이선스 필수
  'IT', // 이탈리아 — ADM 라이선스 필수
  'ES', // 스페인 — DGOJ 라이선스 필수
  'AU', // 호주 — 2017 Interactive Gambling Act
  'IL', // 이스라엘 — 도박 금지
  'SG', // 싱가포르 — Remote Gambling Act
  'HK', // 홍콩 — 사설 도박 금지
  'IR', // 이란 — 종교 + 제재
  'KP', // 북한 — 제재
  'CU', 'SY', // 추가 제재국
]);

const SOFT_WARN_COUNTRIES = new Set([
  'GB', // 영국 — UKGC 라이선스 권장 (베타 안내만)
  'DE', // 독일 — GlüStV 라이선스 권장
  'NL', // 네덜란드 — KSA
  'CA', // 캐나다 — 주별 (Ontario 등 일부만 합법)
]);

export type GeoStatus = 'allowed' | 'soft_warn' | 'hard_blocked';

export interface GeoCheckResult {
  status: GeoStatus;
  country: string | null;
  source: 'timezone' | 'language' | 'unknown';
  reason?: string;
}

// timezone → country 매핑 (자주 보이는 케이스 위주)
const TZ_TO_COUNTRY: Record<string, string> = {
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Anchorage': 'US', 'America/Phoenix': 'US',
  'America/Detroit': 'US', 'America/Indiana/Indianapolis': 'US',
  'Europe/Paris': 'FR', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES',
  'Europe/London': 'GB', 'Europe/Berlin': 'DE', 'Europe/Amsterdam': 'NL',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU',
  'Asia/Jerusalem': 'IL', 'Asia/Tel_Aviv': 'IL',
  'Asia/Singapore': 'SG', 'Asia/Hong_Kong': 'HK',
  'Asia/Tehran': 'IR', 'Asia/Pyongyang': 'KP',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Montreal': 'CA',
  // 명시 허용 (디버깅용 — 베타 동안 차단 안 함을 확실히)
  'Asia/Seoul': 'KR', 'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN',
  'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Kolkata': 'IN',
  'Asia/Ulaanbaatar': 'MN', 'America/Sao_Paulo': 'BR',
};

function detectCountry(): { country: string | null; source: 'timezone' | 'language' | 'unknown' } {
  // 1순위: timezone (가장 신뢰)
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzCountry = TZ_TO_COUNTRY[tz];
    if (tzCountry) return { country: tzCountry, source: 'timezone' };
  } catch {}

  // 2순위: navigator.language region (예: en-US → US)
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const parts = navigator.language.split('-');
      if (parts.length >= 2) {
        const region = parts[1].toUpperCase();
        if (region.length === 2) return { country: region, source: 'language' };
      }
    }
  } catch {}

  return { country: null, source: 'unknown' };
}

export function checkGeo(): GeoCheckResult {
  const { country, source } = detectCountry();
  if (!country) return { status: 'allowed', country: null, source };
  if (HARD_BLOCKED_COUNTRIES.has(country)) {
    return {
      status: 'hard_blocked',
      country,
      source,
      reason: `Service not available in ${country} (regulatory restriction).`,
    };
  }
  if (SOFT_WARN_COUNTRIES.has(country)) {
    return {
      status: 'soft_warn',
      country,
      source,
      reason: `Service operates in beta in ${country}. Please verify local regulations.`,
    };
  }
  return { status: 'allowed', country, source };
}

/** Override (개발/QA용) — URL ?geoOverride=allow 또는 localStorage */
export function isGeoOverridden(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('geoOverride') === 'allow') {
      try { localStorage.setItem('holdem_geo_override', '1'); } catch {}
      return true;
    }
    return localStorage.getItem('holdem_geo_override') === '1';
  } catch { return false; }
}
