/**
 * Wake Lock — 게임 중 모바일 화면 꺼짐 방지 (Plex 방식)
 *
 * 3단계 fallback:
 * 1. Wake Lock API (Chrome 84+, Safari 16.4+) — 가장 깨끗
 * 2. 무음 비디오 재생 (iOS Safari 구버전) — Plex/Netflix가 쓰는 방식
 * 3. 화면 깜빡이기 (최후 수단) — 1분마다 투명 canvas 갱신
 *
 * 게임 방 입장 시 활성화, 퇴장 시 해제.
 */

import { useEffect, useRef } from 'react';

type WakeLockSentinel = any;

// 무음 비디오 (base64 인코딩, 1초짜리 투명 MP4)
// Plex/NoSleep.js 방식 — iOS Safari에서 비디오 재생 중이면 화면 안 꺼짐
const SILENT_VIDEO_BASE64 = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0AAAA1m1vb3YAAABsbXZoZAAAAAAAAAAAAAAAAAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAACRdHJhawAAAFx0a2hkAAAAAwAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAABObWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAoAAAAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAA82luZgAAABRzdGJsAAAAS3N0c2QAAAAAAAAAAQAAAD5hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAoABgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAABFjb2xybmNseAABAA0AAQAAAAAVc3R0cwAAAAAAAAABAAAABAAAQAAAAAAUc3RzcwAAAAAAAAABAAAAAQAAABxzdHNjAAAAAAAAAAEAAAABAAAABAAAAAEAAAAcc3RzegAAAAAAAAAAAAAABAAAA2QAAAAUc3RjbwAAAAAAAAABAAAAMA==';

let silentVideo: HTMLVideoElement | null = null;

function createSilentVideo(): HTMLVideoElement {
  if (silentVideo) return silentVideo;

  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('title', 'wake');
  video.muted = true;
  video.playsInline = true;
  video.loop = true;

  Object.assign(video.style, {
    position: 'fixed',
    top: '-1px',
    left: '-1px',
    width: '1px',
    height: '1px',
    opacity: '0.01',
    pointerEvents: 'none',
    zIndex: '-1',
  });

  video.src = SILENT_VIDEO_BASE64;
  silentVideo = video;
  return video;
}

export function useWakeLock(enabled: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      // 전부 해제
      if (sentinelRef.current) {
        try { sentinelRef.current.release?.(); } catch {}
        sentinelRef.current = null;
      }
      if (videoRef.current) {
        try { videoRef.current.pause(); videoRef.current.remove(); } catch {}
        videoRef.current = null;
      }
      if (canvasTimerRef.current) {
        clearInterval(canvasTimerRef.current);
        canvasTimerRef.current = null;
      }
      return;
    }

    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    let cancelled = false;
    let usingFallback = false;

    // ─── 방법 1: Wake Lock API (최우선) ───
    const acquireWakeLock = async () => {
      if (!nav?.wakeLock?.request) return false;
      try {
        const sentinel = await nav.wakeLock.request('screen');
        if (cancelled) {
          try { sentinel.release?.(); } catch {}
          return false;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener?.('release', () => {
          sentinelRef.current = null;
        });
        return true;
      } catch {
        return false;
      }
    };

    // ─── 방법 2: 무음 비디오 (iOS Safari fallback — Plex 방식) ───
    const startSilentVideo = () => {
      try {
        const video = createSilentVideo();
        document.body.appendChild(video);
        video.play().catch(() => {});
        videoRef.current = video;
        usingFallback = true;
      } catch {}
    };

    // ─── 방법 3: Canvas 깜빡이기 (최후 수단) ───
    const startCanvasKeepAlive = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      Object.assign(canvas.style, {
        position: 'fixed', top: '-1px', left: '-1px',
        width: '1px', height: '1px', opacity: '0.01',
        pointerEvents: 'none', zIndex: '-1',
      });
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      canvasTimerRef.current = window.setInterval(() => {
        if (ctx) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.01})`;
          ctx.fillRect(0, 0, 1, 1);
        }
      }, 30000) as unknown as number; // 30초마다

      return canvas;
    };

    // ─── 실행 순서 ───
    let canvasEl: HTMLCanvasElement | null = null;

    const init = async () => {
      // 1차: Wake Lock API
      const success = await acquireWakeLock();
      if (success || cancelled) return;

      // 2차: 무음 비디오 (Plex 방식)
      startSilentVideo();

      // 3차: Canvas (추가 보험)
      canvasEl = startCanvasKeepAlive();
    };

    init();

    // 탭 포그라운드 복귀 시 재획득
    const onVisible = async () => {
      if (document.visibilityState !== 'visible' || cancelled) return;

      // Wake Lock 재시도
      if (!sentinelRef.current) {
        const success = await acquireWakeLock();
        if (success) return;
      }

      // 비디오 재시작
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    };

    // 유저 터치 시 비디오 재생 (iOS autoplay 정책 대응)
    const onUserInteraction = () => {
      if (usingFallback && videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('touchstart', onUserInteraction, { once: false, passive: true });
    document.addEventListener('click', onUserInteraction, { once: false });

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('touchstart', onUserInteraction);
      document.removeEventListener('click', onUserInteraction);

      if (sentinelRef.current) {
        try { sentinelRef.current.release?.(); } catch {}
        sentinelRef.current = null;
      }
      if (videoRef.current) {
        try { videoRef.current.pause(); videoRef.current.remove(); } catch {}
        videoRef.current = null;
      }
      if (canvasTimerRef.current) {
        clearInterval(canvasTimerRef.current);
        canvasTimerRef.current = null;
      }
      if (canvasEl) {
        try { canvasEl.remove(); } catch {}
      }
    };
  }, [enabled]);
}
