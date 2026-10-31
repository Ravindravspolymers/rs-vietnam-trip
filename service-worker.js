/* RS Vietnam Trip — service worker
   Pre-caches every asset on install so the app works fully offline.
   TO RELEASE AN UPDATE: change CACHE_VERSION (and APP_VERSION in js/app.js), then push. */
'use strict';

const CACHE_VERSION = 'rs-v2.7.0';

// Every file the app needs. Add new files here in later phases.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/trip.js',
  './js/today.js',
  './js/money.js',
  './js/plan.js',
  './js/story.js',
  './js/food.js',
  './js/phrases.js',
  './js/shopping.js',
  './js/docs.js',
  './js/prep.js',
  './js/emergency.js',
  './js/ask.js',
  './js/explore.js',
  './js/chat.js',
  './js/translate.js',
  './js/cash.js',
  './js/transport.js',
  './js/weather.js',
  './js/confirm.js',
  './data/prep.json',
  './data/emergency.json',
  './data/shopping.json',
  './data/places.json',
  './data/restaurants.json',
  './data/dishes.json',
  './data/phrases.json',
  './data/trip.json',
  './data/explore.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './fonts/noto-sans-latin-400-normal.woff2',
  './fonts/noto-sans-latin-700-normal.woff2',
  './fonts/noto-sans-vietnamese-400-normal.woff2',
  './fonts/noto-sans-vietnamese-700-normal.woff2',
  './fonts/noto-sans-kannada-kannada-400-normal.woff2',
  './fonts/noto-sans-kannada-kannada-700-normal.woff2'
];

// Never cache these (live data)
const NETWORK_ONLY = ['open.er-api.com', 'api.deepseek.com'];

self.addEventListener('install', event => {
  // cache:'reload' bypasses the browser HTTP cache so updates are truly fresh
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' }))))
  );
  // Do NOT skipWaiting here: the app shows "New version available" and the user taps it.
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NETWORK_ONLY.some(host => url.hostname.includes(host))) return;
  if (url.origin !== self.location.origin) return; // e.g. Google Maps links

  // Cache first (offline-first). Page navigations fall back to index.html.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).catch(() =>
        req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    })
  );
});
