import { useEffect, useRef } from 'react';
import type { BoothEndpoints } from '@/types';

const UUID_KEY = 'booth.device.uuid';
const TOKEN_KEY = 'booth.device.token';
const NAME_KEY = 'booth.device.name';

/** Bumped when the booth application itself is deployed. */
export const APP_VERSION = '1.0.0';

function readOrCreateUuid(): string {
    const existing = window.localStorage.getItem(UUID_KEY);

    if (existing) {
        return existing;
    }

    const uuid = crypto.randomUUID();
    window.localStorage.setItem(UUID_KEY, uuid);

    return uuid;
}

/**
 * Register the tablet with the server and report that it is still alive.
 *
 * The identity is a random UUID generated on the device, so no personal or
 * hardware information ever leaves the tablet. Failures are silent: a booth
 * without a connection must keep showing poses.
 */
export function useDevice(
    endpoints: BoothEndpoints,
    heartbeatSeconds: number,
    contentVersion: string,
) {
    const contentVersionRef = useRef(contentVersion);

    useEffect(() => {
        contentVersionRef.current = contentVersion;
    }, [contentVersion]);

    useEffect(() => {
        let cancelled = false;

        const token = async (): Promise<string | null> => {
            const existing = window.localStorage.getItem(TOKEN_KEY);

            if (existing) {
                return existing;
            }

            const uuid = readOrCreateUuid();
            const name =
                window.localStorage.getItem(NAME_KEY) ??
                `Booth Tablet ${uuid.slice(0, 4).toUpperCase()}`;

            try {
                const response = await fetch(endpoints.deviceRegister, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        uuid,
                        name,
                        app_version: APP_VERSION,
                    }),
                });

                if (!response.ok) {
                    return null;
                }

                const payload = (await response.json()) as { token: string };

                window.localStorage.setItem(TOKEN_KEY, payload.token);
                window.localStorage.setItem(NAME_KEY, name);

                return payload.token;
            } catch {
                return null;
            }
        };

        const beat = async () => {
            const bearer = await token();

            if (cancelled || !bearer) {
                return;
            }

            try {
                const response = await fetch(endpoints.deviceHeartbeat, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${bearer}`,
                    },
                    body: JSON.stringify({
                        app_version: APP_VERSION,
                        content_version: contentVersionRef.current,
                    }),
                });

                // A rejected token means the device was removed from the
                // dashboard; drop it so the tablet registers again.
                if (response.status === 401) {
                    window.localStorage.removeItem(TOKEN_KEY);
                }
            } catch {
                // Offline booths simply report late.
            }
        };

        void beat();

        const timer = window.setInterval(
            () => void beat(),
            Math.max(30, heartbeatSeconds) * 1000,
        );

        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [endpoints, heartbeatSeconds]);
}
