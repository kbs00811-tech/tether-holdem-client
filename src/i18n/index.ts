/**
 * i18n KRW 고정 stub (2026-04-27 추가)
 *
 * 이 태그(backup-pre-i18n-20260426)는 i18n 인프라가 제거되기 직전 상태이지만
 * 일부 페이지(Lobby, GameTable, TournamentLobby, CreateRoomModal)에 이미
 * `useT` import가 들어가 있어 빌드 차단. 한국어 단일 stub 으로 빌드 복구.
 *
 * 사용법: `useT()` → `t('lobby.title', '폴백')` 형태 호출.
 *   ko.json 의 dot-path 를 lookup. 없으면 fallback 또는 key 자체 반환.
 */

import koJson from './ko.json';

export const SUPPORTED_LOCALES = ['ko'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

export function useLocale(): Locale {
  return 'ko';
}

type Dict = Record<string, any>;

function lookup(dict: Dict, key: string): string | undefined {
  const parts = key.split('.');
  let cur: any = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object') cur = cur[p];
    else return undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function useT() {
  return (key: string, fallbackOrParams?: string | Record<string, string | number>): string => {
    let template = lookup(koJson as Dict, key);
    let fallback: string | undefined;
    let params: Record<string, string | number> | undefined;
    if (typeof fallbackOrParams === 'string') {
      fallback = fallbackOrParams;
    } else if (fallbackOrParams && typeof fallbackOrParams === 'object') {
      params = fallbackOrParams;
    }
    if (!template) template = fallback ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return template;
  };
}
