/**
 * useEmbedMode — B2C(TETHER.BET) iframe 임베드 모드 감지 및 동기화
 *
 * 호스트(B2C)가 `?embed=1` 파라미터와 함께 로드하면 embed 모드 활성화.
 * 이 모드에서는:
 *  1. 자체 헤더/바텀내비 숨김 (호스트 헤더만 사용)
 *  2. URL params 의 balance/nickname 을 진실로 사용
 *  3. postMessage BALANCE_UPDATE 이벤트 수신하여 잔액 실시간 동기화
 *  4. 호스트에게 REQUEST_BALANCE 요청 가능
 */

import { useEffect, useState } from 'react';

interface EmbedUser {
  userId: string;
  nickname: string;
  balance: number;   // 원 단위 (또는 호스트가 주는 단위)
  currency: string;
  tenant: string;
}

interface EmbedState {
  isEmbedded: boolean;
  user: EmbedUser | null;
  hostOrigin: string | null;
}

let cachedState: EmbedState | null = null;
let listeners: ((s: EmbedState) => void)[] = [];

function computeInitialState(): EmbedState {
  if (typeof window === 'undefined') {
    return { isEmbedded: false, user: null, hostOrigin: null };
  }
  const params = new URLSearchParams(window.location.search);
  const embedFlag = params.get('embed') === '1';
  const inIframe = window.self !== window.top;
  const isEmbedded = embedFlag || inIframe;

  let user: EmbedUser | null = null;
  const userId = params.get('userId');
  const nickname = params.get('nickname');
  if (userId && nickname) {
    user = {
      userId,
      nickname,
      balance: Number(params.get('balance') ?? '0'),
      currency: params.get('currency') ?? 'KRW',
      tenant: params.get('tenant') ?? 'default',
    };
  }

  let hostOrigin: string | null = null;
  try {
    if (isEmbedded && document.referrer) {
      hostOrigin = new URL(document.referrer).origin;
    }
  } catch {}

  return { isEmbedded, user, hostOrigin };
}

function setState(next: EmbedState) {
  cachedState = next;
  listeners.forEach(l => l(next));
}

function initListenersOnce() {
  if (typeof window === 'undefined') return;
  if ((window as any).__embedListenersInit) return;
  (window as any).__embedListenersInit = true;

  // 호스트로부터 BALANCE_UPDATE / AUTH_UPDATE 수신
  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (!data || typeof data !== 'object') return;

    // 보안: 원하면 origin 체크 추가
    // if (cachedState?.hostOrigin && event.origin !== cachedState.hostOrigin) return;

    if (data.type === 'BALANCE_UPDATE') {
      const prev = cachedState ?? computeInitialState();
      const updatedUser = prev.user
        ? { ...prev.user, balance: Number(data.balance ?? prev.user.balance), nickname: data.username ?? prev.user.nickname }
        : data.userId ? {
            userId: String(data.userId),
            nickname: String(data.username ?? 'Player'),
            balance: Number(data.balance ?? 0),
            currency: String(data.currency ?? 'KRW'),
            tenant: 'default',
          } : null;
      setState({ ...prev, user: updatedUser });
    }
  });

  // 호스트에 초기 잔액 요청
  if (cachedState?.isEmbedded && window.parent !== window) {
    try {
      window.parent.postMessage({ type: 'REQUEST_BALANCE' }, '*');
    } catch {}
  }
}

export function useEmbedMode(): EmbedState & { requestBalance: () => void } {
  const [state, setLocalState] = useState<EmbedState>(() => {
    if (!cachedState) cachedState = computeInitialState();
    return cachedState;
  });

  useEffect(() => {
    initListenersOnce();
    const listener = (s: EmbedState) => setLocalState(s);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const requestBalance = () => {
    if (typeof window === 'undefined') return;
    try {
      window.parent?.postMessage({ type: 'REQUEST_BALANCE' }, '*');
    } catch {}
  };

  return { ...state, requestBalance };
}

/** 비 훅 접근 (필요 시) */
export function getEmbedState(): EmbedState {
  if (!cachedState) cachedState = computeInitialState();
  return cachedState;
}
