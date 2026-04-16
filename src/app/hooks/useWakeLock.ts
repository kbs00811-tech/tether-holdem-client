/**
 * V3 P2D: Wake Lock — 게임 플레이 중 모바일 화면이 꺼지지 않도록
 *
 * navigator.wakeLock.request('screen') API 사용.
 * - 지원 브라우저: Chrome 84+, Edge 84+, Safari 16.4+
 * - 미지원 브라우저에선 조용히 noop
 * - 탭 백그라운드 이동 시 자동 해제 → visibilitychange 시 재획득
 */

import { useEffect, useRef } from 'react';

type WakeLockSentinel = any;

export function useWakeLock(enabled: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled) {
      // 해제
      if (sentinelRef.current) {
        try { sentinelRef.current.release?.(); } catch {}
        sentinelRef.current = null;
      }
      return;
    }

    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    if (!nav?.wakeLock?.request) {
      // 미지원
      return;
    }

    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await nav.wakeLock.request('screen');
        if (cancelled) {
          try { sentinel.release?.(); } catch {}
          return;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener?.('release', () => {
          // 자동 해제 시 sentinelRef 만 clear (visibilitychange 가 재획득)
          sentinelRef.current = null;
        });
        console.log('[WakeLock] acquired');
      } catch (e) {
        console.warn('[WakeLock] request failed:', e);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire();
      }
    };

    acquire();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (sentinelRef.current) {
        try { sentinelRef.current.release?.(); } catch {}
        sentinelRef.current = null;
      }
    };
  }, [enabled]);
}
