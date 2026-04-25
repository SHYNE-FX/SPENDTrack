// ══════════════════════════════════════════
//  SPENDTrak Service Worker  v1.0
// ══════════════════════════════════════════
const CACHE_NAME = 'spendtrak-v1';

// Everything the app needs to work offline
const PRECACHE = [
  './SPENDTrak.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons+Round'
];

// ── INSTALL: cache all assets ──────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Core assets cached strictly; font CDN cached best-effort
      const core  = PRECACHE.filter(u => !u.startsWith('https://fonts'));
      const fonts = PRECACHE.filter(u =>  u.startsWith('https://fonts'));
      return cache.addAll(core).then(() =>
        Promise.allSettled(fonts.map(u => cache.add(u)))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: purge old caches ─────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first, network fallback ───
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Network fetch → stash in cache for next time
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./SPENDTrak.html');
        }
      });
    })
  );
});
