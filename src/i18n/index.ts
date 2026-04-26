/**
 * TETHER.BET Holdem — i18n (Internationalization)
 *
 * 경량 다국어 시스템 — react-i18next 없이 번들 사이즈 최소화
 *
 * 지원 언어:
 *   ko — 한국어 (기본)
 *   en — English
 *   ja — 日本語
 *   zh — 中文 (简体)
 *   th — ภาษาไทย
 *
 * 사용법:
 *   import { useT } from '../i18n';
 *   const t = useT();
 *   <span>{t('lobby.create')}</span>
 *   <span>{t('lobby.tablesAvailable', { count: 95 })}</span>
 *
 * 언어 변경:
 *   import { setLocale, getLocale } from '../i18n';
 *   setLocale('en');
 *
 * B2B 연동:
 *   iframe URL에 ?lang=en 전달하면 자동 감지
 */

import ko from './ko.json';
import en from './en.json';
import ja from './ja.json';
import zh from './zh.json';
import th from './th.json';
import es from './es.json';
import mn from './mn.json';
import pt from './pt.json';
import vi from './vi.json';
import hi from './hi.json';
import { useState, useEffect, useCallback } from 'react';

// ── 지원 언어 목록 (10개국) ──
// 배치: 호스트(ko) → 글로벌 베이스(en) → 라틴 그룹 → 신흥 아시아 → 동/북아시아
export const SUPPORTED_LOCALES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mn', name: 'Монгол', flag: '🇲🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
] as const;

export type LocaleCode = typeof SUPPORTED_LOCALES[number]['code'];

const messages: Record<string, any> = { ko, en, ja, zh, th, es, mn, pt, vi, hi };

// ── 현재 로케일 ──
let currentLocale: LocaleCode = 'en'; // V21: 기본 영어 (글로벌 베이스)
const listeners = new Set<() => void>();

// 초기 감지: URL ?lang= > localStorage > navigator.language > 'ko'
function detectLocale(): LocaleCode {
  try {
    // 1. URL param (B2B iframe ?lang=en)
    const url = new URL(window.location.href);
    const langParam = url.searchParams.get('lang') || url.searchParams.get('locale');
    if (langParam && messages[langParam]) return langParam as LocaleCode;

    // 2. localStorage
    const saved = localStorage.getItem('holdem_locale');
    if (saved && messages[saved]) return saved as LocaleCode;

    // 3. navigator.language (ko-KR → ko, en-US → en, ja → ja)
    const browserLang = navigator.language.split('-')[0];
    if (browserLang && messages[browserLang]) return browserLang as LocaleCode;
  } catch {}
  return 'en'; // 글로벌 기본 = 영어
}

currentLocale = detectLocale();

// ── API ──

export function getLocale(): LocaleCode { return currentLocale; }

export function setLocale(locale: LocaleCode): void {
  if (!messages[locale]) return;
  currentLocale = locale;
  try { localStorage.setItem('holdem_locale', locale); } catch {}
  // 모든 구독자에게 알림 → 리렌더
  for (const fn of listeners) fn();
}

/**
 * 번역 함수 — 점 표기법 키로 JSON 값 조회
 * @param key 'lobby.create', 'action.fold' 등
 * @param params 템플릿 변수 { count: 95 } → '{count}' 치환
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = messages[currentLocale];

  for (const k of keys) {
    if (value == null) break;
    value = value[k];
  }

  // 번역 없으면 영어 fallback, 그것도 없으면 키 반환
  if (typeof value !== 'string') {
    let fallback: any = messages['en'];
    for (const k of keys) {
      if (fallback == null) break;
      fallback = fallback[k];
    }
    value = typeof fallback === 'string' ? fallback : key;
  }

  // 템플릿 치환: {count} → params.count
  if (params && typeof value === 'string') {
    for (const [pk, pv] of Object.entries(params)) {
      value = value.replace(`{${pk}}`, String(pv));
    }
  }

  return value;
}

// ── React Hook ──

/** React 컴포넌트에서 사용하는 번역 hook — 언어 변경 시 자동 리렌더 */
export function useT(): typeof t {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  return useCallback((key: string, params?: Record<string, string | number>) => {
    return t(key, params);
  }, []);
}

/** 현재 로케일 코드 반환 hook (리렌더 연동) */
export function useLocale(): [LocaleCode, (locale: LocaleCode) => void] {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const cb = () => forceUpdate(n => n + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  return [currentLocale, setLocale];
}
