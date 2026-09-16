const CACHE_NAME = 'logix-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Базовая стратегия: сначала сеть, при сбое — кэш
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});