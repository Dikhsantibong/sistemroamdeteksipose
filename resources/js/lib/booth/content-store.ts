import type { BoothPose, BoothSettings } from '@/types';

/**
 * Offline storage for the booth content.
 *
 * Pose metadata can grow well past what localStorage comfortably holds, so the
 * payload lives in IndexedDB. Only the tiny device identity is small enough to
 * stay in localStorage.
 */

const DATABASE_NAME = 'pose-assistant';
const DATABASE_VERSION = 1;
const STORE_NAME = 'content';
const CONTENT_KEY = 'booth-content';

export type CachedContent = {
    contentVersion: string;
    settings: BoothSettings;
    poses: BoothPose[];
    syncedAt: number;
};

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE_NAME)) {
                request.result.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Read the cached content, or null when the booth has never synced.
 */
export async function readContent(): Promise<CachedContent | null> {
    if (!('indexedDB' in window)) {
        return null;
    }

    try {
        const database = await openDatabase();

        return await new Promise<CachedContent | null>((resolve, reject) => {
            const request = database
                .transaction(STORE_NAME, 'readonly')
                .objectStore(STORE_NAME)
                .get(CONTENT_KEY);

            request.onsuccess = () =>
                resolve((request.result as CachedContent) ?? null);
            request.onerror = () => reject(request.error);
        });
    } catch {
        return null;
    }
}

/**
 * Replace the cached content after a successful sync.
 */
export async function writeContent(content: CachedContent): Promise<void> {
    if (!('indexedDB' in window)) {
        return;
    }

    try {
        const database = await openDatabase();

        await new Promise<void>((resolve, reject) => {
            const request = database
                .transaction(STORE_NAME, 'readwrite')
                .objectStore(STORE_NAME)
                .put(content, CONTENT_KEY);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch {
        // Losing the cache only costs the booth its offline mode.
    }
}

/**
 * Ask the service worker to keep the pose images available offline.
 *
 * Fetching each image once is enough: the service worker stores it in the
 * content cache on the way through.
 */
export async function warmImageCache(poses: BoothPose[]): Promise<void> {
    for (const pose of poses) {
        try {
            await fetch(pose.image_url, { cache: 'force-cache' });
        } catch {
            // An image that cannot be prefetched is retried on the next sync.
        }
    }
}
