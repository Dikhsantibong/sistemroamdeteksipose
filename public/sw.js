/**
 * Service worker for the Self Photo Booth Pose Assistant.
 *
 * Two things are cached and they are deliberately kept apart:
 *
 *  - the application shell (HTML, build assets, icons), which only changes when
 *    the app is deployed, and
 *  - the content (pose images and API payloads), which the administrator changes
 *    from the dashboard without any redeploy.
 *
 * Bump APP_VERSION when the shell changes. The tablet then sees an update and
 * offers it to the operator instead of reloading mid session.
 */
const APP_VERSION = 'v2';

const SHELL_CACHE = `pose-assistant-shell-${APP_VERSION}`;
const ASSET_CACHE = `pose-assistant-assets-${APP_VERSION}`;
const CONTENT_CACHE = 'pose-assistant-content';

const SHELL_URLS = [
    '/',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) =>
                Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))),
            ),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            await Promise.all(
                keys
                    .filter(
                        (key) =>
                            key.startsWith('pose-assistant-') &&
                            key !== SHELL_CACHE &&
                            key !== ASSET_CACHE &&
                            key !== CONTENT_CACHE,
                    )
                    .map((key) => caches.delete(key)),
            );

            await self.clients.claim();
        })(),
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

/**
 * Serve from the cache and refresh in the background. Used for content that
 * rarely changes but must never block the booth.
 */
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    const response = await fetch(request);

    if (response.ok) {
        cache.put(request, response.clone());
    }

    return response;
}

/**
 * Prefer the network so the booth picks up new content, but fall back to the
 * cached copy the moment the connection drops.
 */
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);

        if (response.ok) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        throw error;
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    // Never cache authenticated dashboard traffic.
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/settings')) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            networkFirst(request, SHELL_CACHE).catch(() => caches.match('/')),
        );

        return;
    }

    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(cacheFirst(request, ASSET_CACHE));

        return;
    }

    if (url.pathname.startsWith('/storage/poses')) {
        event.respondWith(cacheFirst(request, CONTENT_CACHE));

        return;
    }

    if (url.pathname.startsWith('/api/booth')) {
        event.respondWith(networkFirst(request, CONTENT_CACHE));
    }
});
