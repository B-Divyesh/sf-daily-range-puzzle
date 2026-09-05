const CACHE = 'daily-range-v4';
const SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

async function cacheShell() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  const index = await cache.match('/index.html');
  const html = await index.text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1]);
  await cache.addAll(assets);
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (new URL(event.request.url).origin === location.origin && response.ok) {
      caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
    }
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('/index.html', { ignoreVary: true }) : Response.error())));
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache-page-assets' || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((url) => {
    try { return new URL(url).origin === location.origin; } catch { return false; }
  });
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(urls.map((url) => cache.add(url).catch(() => undefined)))));
});
