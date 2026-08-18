const CACHE_NAME = 'skywarrior-shell-v1';
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
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (res) {
        return caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, res.clone());
          return res;
        });
      });
    }).catch(function () { return caches.match('/'); })
  );
});
