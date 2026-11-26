const CACHE_PREFIX = 'ev-revival-v';
const CACHE_NAME = CACHE_PREFIX + '2';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.search ||
      url.pathname.includes('/ev-revival-local/') ||
      url.pathname.endsWith('/ev-revival-local.html')) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && !response.redirected && response.type === 'basic') {
          const clone = response.clone();
          event.waitUntil(caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {}));
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') return (await cache.match('./offline.html')) || Response.error();
        return Response.error();
      })
  );
});
