// Kenokip Farm - Poultry Keeping — service worker
// Minimal cache-first app shell so Chrome will treat this as an installable,
// offline-capable PWA. Bump CACHE_NAME whenever you replace these files on
// the server so returning visitors pick up the update instead of a stale copy.
var CACHE_NAME = 'kenokip-farm-v21';
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
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-functions-compat.js'
];

// Real push notifications (Firebase Cloud Messaging) — this is what lets a
// notification arrive even when the app is fully closed, not just
// backgrounded. The service worker has no access to the page's JS, so the
// (non-secret) Firebase config is repeated here. If these two scripts fail
// to load (offline on first install, or an old cached service worker), the
// try/catch below just skips FCM setup — cache-first offline support above
// still works either way, and it retries again the next time the SW updates.
try{
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: "AIzaSyAEsReYhd4No6-_-TxmzLaTZef9J8cTFe4",
    authDomain: "kenokip-farm.firebaseapp.com",
    projectId: "kenokip-farm",
    storageBucket: "kenokip-farm.firebasestorage.app",
    messagingSenderId: "386891888391",
    appId: "1:386891888391:web:d038b1fde6e4f223ff37a2"
  });
  var messaging = firebase.messaging();
  // Fires only when no tab has this app focused (a foreground tab handles
  // urgent alerts itself via showBackgroundAlert() in index.html, so this
  // never double-fires the same message).
  messaging.onBackgroundMessage(function(payload){
    var n = payload.notification || {};
    self.registration.showNotification(n.title || 'Kenokip Farm', {
      body: n.body || '',
      icon: './icons/icon-192.png',
      tag: 'kenokip-push-' + Date.now(),
      requireInteraction: true
    });
  });
}catch(e){ /* best-effort — see comment above */ }

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

// Clicking an urgent-alert notification (shown even while this tab wasn't
// focused) brings an already-open tab to the front, or opens a new one if
// none is open — it can't do anything if the app has been fully closed,
// since nothing is running to catch the click in that case.
self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for(var i=0; i<list.length; i++){
        if('focus' in list[i]) return list[i].focus();
      }
      if(clients.openWindow) return clients.openWindow('./');
    })
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
