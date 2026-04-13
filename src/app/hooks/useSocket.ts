/**
 * TETHER.BET Holdem - WebSocket Hook (Singleton)
 * 단일 WebSocket 연결, 중복 연결 방지
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import type { ClientMessage, ServerMessage } from '../types/serverTypes';

// 페이지와 동일한 오리진으로 WebSocket 연결 → serve.js(4000)가 9950으로 프록시
// 로컬 개발(vite dev)에서는 명시적으로 9950 직접 연결
// TETHER.BET iframe 통합: URL 쿼리(token/userId 등)를 WS URL에 전달
function resolveWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:9950';
  if ((window as any).__HOLDEM_WS_URL) return (window as any).__HOLDEM_WS_URL;
  const { protocol, host, hostname, search } = window.location;

  // 현재 URL 쿼리에서 인증 관련 파라미터 추출
  const params = new URLSearchParams(search);
  const authKeys = ['token', 'userId', 'nickname', 'balance', 'currency', 'tenant'];
  const authQuery = new URLSearchParams();
  for (const key of authKeys) {
    const v = params.get(key);
    if (v) authQuery.set(key, v);
  }
  const queryStr = authQuery.toString() ? `?${authQuery.toString()}` : '';

  // Vite dev 서버(5173)에서는 9950 직접 연결
  if (hostname === 'localhost' && window.location.port === '5173') {
    return `ws://localhost:9950${queryStr}`;
  }
  // 프로덕션/serve.js(4000): 현재 오리진으로 연결 (프록시)
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${host}${queryStr}`;
}

const WS_URL = resolveWsUrl();

// ─── Singleton WebSocket ───
let ws: WebSocket | null = null;
let wsReady = false;
let reconnectTimer: number | null = null;
let messageHandler: ((msg: ServerMessage) => void) | null = null;

function ensureConnection() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[WS] Connected (singleton)');
      wsReady = true;
      useGameStore.getState().setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        if (messageHandler) messageHandler(msg);
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      wsReady = false;
      ws = null;
      useGameStore.getState().setConnected(false);
      // 3초 후 재연결 (한 번만)
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(ensureConnection, 3000);
    };

    ws.onerror = () => {};
  } catch {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = window.setTimeout(ensureConnection, 3000);
  }
}

function sendMessage(msg: ClientMessage) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  } else {
    console.warn('[WS] Not connected, dropping:', msg.type);
  }
}

// ─── React Hook ───
export function useSocket() {
  const { handleServerMessage } = useGameStore();

  // 메시지 핸들러 등록 (항상 최신 참조)
  useEffect(() => {
    messageHandler = handleServerMessage;
  }, [handleServerMessage]);

  // 연결 시작 (한 번만)
  useEffect(() => {
    ensureConnection();

    // Heartbeat
    const hb = setInterval(() => sendMessage({ type: 'HEARTBEAT' }), 30000);

    return () => {
      clearInterval(hb);
      // 컴포넌트 언마운트해도 WS는 안 닫음 (싱글턴)
    };
  }, []);

  const send = useCallback((msg: ClientMessage) => {
    sendMessage(msg);
  }, []);

  const connected = useGameStore(s => s.connected);
  return { send, connected };
}
