/**
 * ==========================================================================
 * REEN AI PWA SERVICE WORKER (sw.js)
 * Caches core app assets for offline execution and fast mobile startup.
 * ==========================================================================
 */

const CACHE_NAME = 'reen-ai-v2.5';
const ASSETS_TO_CACHE = [
    './index.html',
    './style.css',
    './app.js',
    './aiAssistantHelper.js',
    './googleApiHelper.js',
    './emailSummarizer.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
