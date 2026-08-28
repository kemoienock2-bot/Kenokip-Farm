// Kenokip Farm - Poultry Keeping — service worker
// Minimal cache-first app shell so Chrome will treat this as an installable,
// offline-capable PWA. Bump CACHE_NAME whenever you replace these files on
// the server so returning visitors pick up the update instead of a stale copy.
var CACHE_NAME = 'kenokip-farm-v4';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
  // Precache the Firebase SDK itself too, so a phone that has opened the app
  // at least once while online can still load it — and use its offline
  // write queue — with zero signal.
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(name){ return name !== CACHE_NAME; })
             .map(function(name){ return caches.delete(name); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(response){
        // Only cache same-origin, successful responses (skip Google Fonts etc.
        // — they have their own caching and we don't want to fail install
        // over a flaky third-party request).
        if(response && response.ok && event.request.url.indexOf(self.location.origin) === 0){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){
        // Offline and not cached — for a navigation, fall back to the app shell.
        if(event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
