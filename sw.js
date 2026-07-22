/**
 * ==========================================================================
 * REEN AI PWA SERVICE WORKER (sw.js) - NETWORK FIRST AUTO-UPDATE
 * Automatically purges old caches and fetches fresh updates from network.
 * ==========================================================================
 */

const CACHE_NAME = 'reen-ai-v5.0-master';
const ASSETS_TO_CACHE = [
    './index.html',
    './style.css',
    './app.js',
    './aiAssistantHelper.js',
    './googleApiHelper.js',
    './emailSummarizer.js',
    './manifest.json'
];

// Install Event - Pre-cache core assets & skip waiting immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event - Purge all old caches and claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - Network First Strategy with Cache Fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
