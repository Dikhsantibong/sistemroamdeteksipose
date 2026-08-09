import { useCallback, useEffect, useRef, useState } from 'react';
import {
    readContent,
    warmImageCache,
    writeContent,
} from '@/lib/booth/content-store';
import type { BoothEndpoints, BoothPose, BoothSettings } from '@/types';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

type Options = {
    endpoints: BoothEndpoints;
    initialSettings: BoothSettings;
    initialContentVersion: string;
};

/**
 * Keep the booth content up to date without ever reinstalling the app.
 *
 * On start the cached copy is used immediately so the booth is usable offline.
 * A cheap content-version check then decides whether the poses and settings
 * need to be downloaded again.
 */
export function useContentSync({
    endpoints,
    initialSettings,
    initialContentVersion,
}: Options) {
    const [poses, setPoses] = useState<BoothPose[]>([]);
    const [settings, setSettings] = useState<BoothSettings>(initialSettings);
    const [contentVersion, setContentVersion] = useState(initialContentVersion);
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [isReady, setIsReady] = useState(false);

    const versionRef = useRef(initialContentVersion);
    const syncingRef = useRef(false);

    const sync = useCallback(
        async (force = false) => {
            if (syncingRef.current) {
                return;
            }

            syncingRef.current = true;
            setStatus('syncing');

            try {
                const versionResponse = await fetch(endpoints.contentVersion, {
                    headers: { Accept: 'application/json' },
                });

                if (!versionResponse.ok) {
                    throw new Error('Content version request failed.');
                }

                const { content_version: remoteVersion } =
                    (await versionResponse.json()) as {
                        content_version: string;
                    };

                if (!force && remoteVersion === versionRef.current) {
                    setStatus('synced');

                    return;
                }

                const [posesResponse, configurationResponse] =
                    await Promise.all([
                        fetch(endpoints.poses, {
                            headers: { Accept: 'application/json' },
                        }),
                        fetch(endpoints.configuration, {
                            headers: { Accept: 'application/json' },
                        }),
                    ]);

                if (!posesResponse.ok || !configurationResponse.ok) {
                    throw new Error('Content request failed.');
                }

                const posesPayload = (await posesResponse.json()) as {
                    data: BoothPose[];
                };
                const configuration = (await configurationResponse.json()) as {
                    settings: BoothSettings;
                    content_version: string;
                };

                versionRef.current = configuration.content_version;

                setPoses(posesPayload.data);
                setSettings(configuration.settings);
                setContentVersion(configuration.content_version);
                setStatus('synced');
                setIsReady(true);

                await writeContent({
                    contentVersion: configuration.content_version,
                    settings: configuration.settings,
                    poses: posesPayload.data,
                    syncedAt: Date.now(),
                });

                void warmImageCache(posesPayload.data);
            } catch {
                setStatus('offline');
            } finally {
                syncingRef.current = false;
            }
        },
        [endpoints],
    );

    // Load the cached content first so the booth works before the network does.
    useEffect(() => {
        let cancelled = false;

        const start = async () => {
            const cached = await readContent();

            if (!cancelled && cached) {
                versionRef.current = cached.contentVersion;
                setPoses(cached.poses);
                setSettings(cached.settings);
                setContentVersion(cached.contentVersion);
                setIsReady(true);
            }

            if (!cancelled) {
                await sync(cached === null);
            }
        };

        void start();

        return () => {
            cancelled = true;
        };
    }, [sync]);

    useEffect(() => {
        const seconds = Math.max(30, settings.content_sync_interval);
        const timer = window.setInterval(() => void sync(), seconds * 1000);

        return () => window.clearInterval(timer);
    }, [settings.content_sync_interval, sync]);

    return { poses, settings, contentVersion, status, isReady, sync };
}
