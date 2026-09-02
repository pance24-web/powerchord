// PowerChord Service Worker - v4 (Network First Data Cache)
const CACHE_VERSION = 'powerchord-v4'; // Naikkan versi agar cache lama dihapus
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/detail.html',
  '/css/style.min.css',
  '/css/style.css',
  '/js/main.js',
  '/js/core.js',
  '/manifest.json',
  '/asset/PowerChord-logo.webp',
  '/asset/favicon.webp',
  '/asset/favicon.png'
];

// Install: Cache SEMUA aset penting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.warn('[SW] Failed to cache some assets:', err);
    })
  );
  self.skipWaiting();
});

// Activate: Hapus cache lama
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DATA_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategi caching dengan penanganan redirect yang aman
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. Data API (songs.json) → Network First, fallback Cache
  if (url.pathname.includes('songs.json')) {
    event.respondWith(
      fetch(event.request.url, { redirect: 'follow' })
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
          });
        })
    );
    return;
  }
  
  // 2. Static assets → Cache First
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith('/' + asset.split('/').pop()))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request.url, { redirect: 'follow' });
      })
    );
    return;
  }
  
  // 3. HTML pages → Network First (dengan redirect: 'follow'), fallback Cache
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request.url, { 
        headers: event.request.headers,
        redirect: 'follow' // <-- INI YANG MEMPERBAIKI ERROR
      }).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }
  
  // 4. Default → Network
  event.respondWith(fetch(event.request.url, { redirect: 'follow' }));
});