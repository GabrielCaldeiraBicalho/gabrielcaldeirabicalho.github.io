const CACHE_NAME = 'lua-financas-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/utils/formatters.js',
  './js/utils/dom.js',
  './js/utils/validators.js',
  './js/modules/storage.js',
  './js/modules/transactions.js',
  './js/modules/cards.js',
  './js/modules/budgets.js',
  './js/modules/categories.js',
  './js/modules/charts.js',
  './js/modules/theme.js',
  './js/modules/exports.js',
  './js/modules/invoices.js',
  './js/modules/ui.js',
  // CDN externos (opcional, mas útil para offline)
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Estratégia: Cache First para assets estáticos, Network First para API (se houver)
  if (event.request.method !== 'GET') return;
  
  // Para recursos do próprio domínio, tenta cache primeiro
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then(response => {
          // Cacheia a resposta para uso futuro
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        }).catch(() => {
          // Se offline e não estiver em cache, retorna fallback (página inicial)
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
    );
  } else {
    // Recursos de terceiros: tenta rede, depois cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});