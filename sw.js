const cacheName = 'anewday-shell-v1';
const assetsToCache = [
  './icons/check.svg',
  './icons/checkbox.svg',
  './icons/delete-grey.svg',
  './icons/heart.svg',
  './icons/home.svg',
  './icons/info.svg',
  './icons/minus.svg',
  './icons/plusBl.svg',
  './js/HtmlService.js',
  './js/TodoService.js',
  './node_modules/sortablejs/modular/sortable.complete.esm.js',
  './css/style.css',
  './favicon.ico',
  './info.html',
  './index.html',
  './'
];

function removeOldCache(key) {
  if (key !== cacheName) {
    console.log(`[Service Worker] Removing old cache: ${key}`);
    return caches.delete(key);
  }
}

async function cacheCleanup() {
  const keyList = await caches.keys();
  return Promise.all(keyList.map(removeOldCache));
}

async function cacheStaticAssets() {
  const cache = await caches.open(cacheName);
  return cache.addAll(assetsToCache);
}

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...', event);
  event.waitUntil(cacheStaticAssets());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...', event);
  event.waitUntil(cacheCleanup());
  return self.clients.claim();
});

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(cacheName);
    return cache.match(request);
  }
}

async function cacheFirst(request) {
  try {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);
    return response || fetch(request);
  } catch (error) {
    console.log(error);
  }
}

self.addEventListener('fetch', event => {
  // console.log('[Service Worker] Fetch event: ' + event.request.url);
  event.respondWith(cacheFirst(event.request));
});