/**
 * TETHER.BET Holdem — Service Worker
 *
 * 기능:
 * - 오프라인 캐싱 (앱 셸 + 정적 파일)
 * - 푸시 알림 수신
 * - 백그라운드 동기화
 */

const CACHE_NAME = 'holdem-v38';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
];

// Install — 정적 파일 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API/WebSocket는 캐싱하지 않음
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api') || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // HTML 요청은 항상 네트워크 (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // 정적 파일: 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공하면 캐시 업데이트
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push 알림 수신
self.addEventListener('push', (event) => {
  let data = { title: 'TETHER.BET Holdem', body: 'New notification', icon: '/brand/icon-192.png' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/brand/icon-192.png',
      badge: '/brand/favicon.png',
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        { action: 'open', title: 'Play Now' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // 이미 열린 탭 있으면 포커스
      for (const client of clients) {
        if (client.url.includes('holdem') && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭
      return self.clients.openWindow('/lobby');
    })
  );
});
