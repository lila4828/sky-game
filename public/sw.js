const CACHE_NAME = 'skywarrior-shell-v2';
const SHELL_ASSETS = [
  '/',
  '/css/style.css',
  '/manifest.json',
  '/icons/icon.svg',
  '/vendor/three.min.js',
  '/js/constants.js',
  '/js/state.js',
  '/js/storage.js',
  '/js/three-scene.js',
  '/js/utils3d.js',
  '/js/audio.js',
  '/js/combo.js',
  '/js/player.js',
  '/js/weapons.js',
  '/js/enemies.js',
  '/js/waves.js',
  '/js/powerups.js',
  '/js/boss.js',
  '/js/ui.js',
  '/js/leaderboard.js',
  '/js/stats.js',
  '/js/touch-controls.js',
  '/js/pwa.js',
  '/js/main.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(SHELL_ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    return; // let the network handle live data (leaderboard, stats)
  }

  const isNavigation = event.request.mode === 'navigate';

  // Network-first so online players always get the latest shipped code;
  // cache is only a fallback for offline play, and only successful
  // responses are cached so a transient 5xx never gets stuck as "the" cache.
  event.respondWith(
    fetch(event.request).then(function (res) {
      if (res.ok) {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, resClone); });
      }
      return res;
    }).catch(function () {
      return caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        if (isNavigation) return caches.match('/');
        return Response.error();
      });
    })
  );
});
