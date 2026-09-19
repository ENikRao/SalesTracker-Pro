const CACHE_NAME = 'salestracker-pro-v3';

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .catch(error => {
                console.warn('App shell cache failed:', error);
            })
    );

    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
    );

    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {

                const networkRequest = fetch(request)
                    .then(response => {

                        if (
                            response &&
                            (
                                response.ok ||
                                response.type === 'opaque'
                            )
                        ) {
                            const responseClone = response.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(request, responseClone);
                                })
                                .catch(() => {});
                        }

                        return response;
                    })
                    .catch(() => {
                        return cachedResponse ||
                            caches.match('./index.html');
                    });

                return cachedResponse || networkRequest;
            })
    );
});
