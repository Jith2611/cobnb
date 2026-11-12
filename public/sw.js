// Service Worker for COBNB+ PWA Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser handle normal network requests
  // Allows PWA criteria to be fulfilled
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

