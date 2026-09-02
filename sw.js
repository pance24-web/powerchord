// PowerChord Service Worker - v2 (Fixed)
const CACHE_VERSION = 'powerchord-v2'; // ← Naikkan versi agar cache lama dihapus
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
  '/asset/favicon.png',
  '/data/songs.json' // ← TAMBAHKAN INI! Agar songs.json di-cache sejak awal
];

// Install: Cache SEMUA aset penting termasuk songs.json
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

// Fetch: Strategi caching berdasarkan tipe
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. Data API (songs.json) → Cache First, fallback Network
  if (url.pathname.includes('songs.json')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Update cache di background (stale-while-revalidate)
          const fetchPromise = fetch(event.request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DATA_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          }).catch(() => cached); // Jika fetch gagal, tetap return cached
          
          return cached; // Return cached langsung, update di background
        }
        // Jika tidak ada cache, fetch dari network
        return fetch(event.request).catch(() => {
          return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }
  
  // 2. Static assets → Cache First
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith('/' + asset.split('/').pop()))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
    return;
  }
  
  // 3. HTML pages → Network First, fallback Cache
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }
  
  // 4. Default → Network
  event.respondWith(fetch(event.request));
});