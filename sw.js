// sw.js - PWA para Lua Finanças
const CACHE_NAME = 'lua-financas-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalação: faz cache dos assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('🟢 SW: cacheando assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia: Cache First (com fallback para index.html)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Evita cache de requisições não-GET
  if (event.request.method !== 'GET') return;

  // Para requisições do próprio app (mesma origem)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          console.log('📦 SW: cache hit', event.request.url);
          return cached;
        }
        console.log('🌐 SW: fetch', event.request.url);
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        }).catch(() => {
          // Fallback offline: serve index.html
          return caches.match('./index.html');
        });
      })
    );
  } else {
    // Para recursos externos (CDNs, etc.) – apenas tenta a rede
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});