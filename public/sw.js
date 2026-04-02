const CACHE_NAME = 'pandas-tracker-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

const API_BLOCKLIST = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebase.googleapis.com',
  'googleapis.com',
  'cloudfunctions.net',
  'firebaseio.com',
  'firebasestorage.googleapis.com',
  'recaptchaenterprise.googleapis.com'
];

function isApiRequest(url) {
  return API_BLOCKLIST.some(function(domain) { return url.includes(domain); });
}

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/.test(url);
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.startsWith('http://') && !event.request.url.includes('localhost')) {
    event.respondWith(Response.redirect(event.request.url.replace('http://', 'https://'), 301));
    return;
  }

  if (event.request.method !== 'GET') {
    return;
  }

  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  if (isApiRequest(event.request.url)) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(networkResponse) {
      if (networkResponse && networkResponse.ok) {
        var responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return networkResponse;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
