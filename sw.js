// PowerChord Service Worker - v7
const CACHE_VERSION = 'powerchord-v7';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/detail',
  '/css/style.min.css',
  '/css/style.css',
  '/js/main.js',
  '/js/core.js',
  '/manifest.json',
  '/asset/PowerChord-logo.webp',
  '/asset/favicon.webp',
];

const fetchFollowingRedirect = (request) => fetch(new Request(request.url, {
  method: request.method,
  headers: request.headers,
  credentials: request.credentials,
  redirect: 'follow',
  cache: request.cache,
}));

const getCanonicalNavigationRequest = (request) => {
  const url = new URL(request.url);
  if (url.pathname === '/index.html') url.pathname = '/';
  else if (url.pathname.endsWith('.html')) url.pathname = url.pathname.slice(0, -5);
  return new Request(url, {
    method: 'GET',
    headers: request.headers,
    credentials: request.credentials,
    redirect: 'follow',
    cache: request.cache,
  });
};

// Install: Cache SEMUA aset penting
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return Promise.all(STATIC_ASSETS.map(async (asset) => {
        const response = await fetchFollowingRedirect(new Request(asset, { cache: 'no-cache' }));
        if (!response.ok || response.redirected) return;
        await cache.put(asset, response);
      }));
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
  // Hanya intercept request GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Jangan intercept request cross-origin kecuali origin yang sama
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. Data API (songs.json) → Network First, fallback Cache
  if (url.pathname.includes('songs.json')) {
    event.respondWith(
      fetchFollowingRedirect(event.request)
        .then((response) => {
          if (response.ok && !response.redirected) {
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
        return cached || fetchFollowingRedirect(event.request);
      })
    );
    return;
  }

  // 3. HTML navigation pages → Network First, fallback Cache
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetchFollowingRedirect(getCanonicalNavigationRequest(event.request)).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // 4. Default same-origin request
  event.respondWith(fetchFollowingRedirect(event.request));
});
