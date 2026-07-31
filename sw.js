const CACHE_NAME = 'xy-rental-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

// Install: cache all assets, skip waiting
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.destination === 'document' || e.request.url.endsWith('.html');
  if (isHTML) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return resp;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
});
