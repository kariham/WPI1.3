/* QHSE Inspectietool — service worker
   Cachet de volledige app-shell zodat de app ook zonder internetverbinding
   volledig bruikbaar is (inclusief PDF-export, want jsPDF wordt ook gecached).

   Strategie:
   - Eigen app-bestanden (html/css/js/json): NETWERK-EERST. Zo komt elke update
     die je op GitHub zet meteen door zodra je online bent. Enkel als er geen
     internet is, valt de app terug op de laatst gecachete versie.
   - Externe CDN-bestanden (jsPDF): CACHE-EERST, want die wijzigen zelden en
     dit bespaart dataverbruik / werkt betrouwbaarder offline. */

const CACHE_NAME = 'qhse-inspectie-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/db.js',
  './js/logo.js',
  './js/pdf.js',
  './js/app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isSameOrigin = new URL(event.request.url).origin === self.location.origin;

  if (isSameOrigin) {
    // Netwerk-eerst: altijd de nieuwste versie ophalen als er internet is.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-eerst voor externe CDN-libraries.
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return response;
        });
      })
    );
  }
});
