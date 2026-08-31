'use strict';

var SHELL_CACHE = 'word-loop-shell-v10';
var SHELL_FILES = [
  './',
  './index.html',
  './word-chain-game.html',
  './manifest.webmanifest',
  './og.png',
  './game.css',
  './campaign.css',
  './word-definitions.css',
  './achievements.css',
  './user-system.css',
  './start-screen.css',
  './motion.css',
  './pwa.css',
  './dictionary-core.js',
  './dictionary-extended.js',
  './game.js',
  './campaign-levels.js',
  './campaign.js',
  './start-screen.js',
  './achievements.js',
  './user-system.js',
  './word-definitions.js',
  './motion.js',
  './pwa.js',
  './assets/icons/icon-32.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(SHELL_CACHE).then(function(cache) {
    return cache.addAll(SHELL_FILES);
  }));
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== SHELL_CACHE && key.indexOf('word-loop-shell-') === 0) {
          return caches.delete(key);
        }
        return Promise.resolve(false);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (new URL(request.url).pathname.indexOf('/api/') === 0) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function(response) {
        if (response.ok) {
          var copy = response.clone();
          caches.open(SHELL_CACHE).then(function(cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function() {
        return caches.match(request, { ignoreSearch: true }).then(function(cached) {
          return cached || caches.match('./word-chain-game.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response.ok) {
          var copy = response.clone();
          caches.open(SHELL_CACHE).then(function(cache) { cache.put(request, copy); });
        }
        return response;
      });
    })
  );
});
