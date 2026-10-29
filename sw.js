/* Poker Academy : fonctionnement hors connexion (web app) */
var CACHE = 'pa-2.0.0-q';
var FILES = ['./', './index.html', './style.css', './fonts/fonts.css', './data.js', './core.js', './game.js', './situations.js', './lessons.js', './audio/index.js', './learn.js', './analyse.js', './tools.js', './bank.js', './cards.js', './ui.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './fonts/big-shoulders-display-latin-700-normal.woff2', './fonts/big-shoulders-display-latin-800-normal.woff2',
  './fonts/ibm-plex-sans-latin-400-normal.woff2', './fonts/ibm-plex-sans-latin-500-normal.woff2', './fonts/ibm-plex-sans-latin-600-normal.woff2', './fonts/ibm-plex-sans-latin-700-normal.woff2'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
// réseau d'abord (pour recevoir les mises à jour), cache si hors connexion
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('./index.html'); }); }));
});
