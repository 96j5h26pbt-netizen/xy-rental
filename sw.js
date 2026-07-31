const CACHE_NAME = 'xiaoyuan-rental-v1.0.4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192b.png',
  './icon-512b.png',
  './apple-touch-iconb.png',
  './favicon-32b.png'
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean ALL old caches and force refresh all clients
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => {
      // Force all open tabs to reload
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          if (client.navigate) client.navigate(client.url);
        });
      });
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const isHTML = e.request.destination === 'document' || e.request.url.endsWith('.html');

  if (isHTML) {
    // Always fetch HTML from network
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
    // Cache-first for assets
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return resp;
        }).catch(() => caches.match('./index.html'));
      })
    );
  }
});
