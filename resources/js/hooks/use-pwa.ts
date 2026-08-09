import { useCallback, useEffect, useState } from 'react';

/**
 * The Chromium-only event that lets a page trigger the install prompt itself.
 */
type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type InstallState =
    'checking' | 'ready' | 'installing' | 'installed' | 'unsupported';

function isRunningStandalone(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        // iOS Safari reports standalone mode on the navigator instead.
        (window.navigator as Navigator & { standalone?: boolean })
            .standalone === true
    );
}

/**
 * Track whether the PWA can be installed and drive the install prompt.
 *
 * Browsers that never fire `beforeinstallprompt` land on "unsupported" so the
 * install page can show manual instructions instead of a dead button.
 */
export function usePwaInstall() {
    const [state, setState] = useState<InstallState>(() =>
        isRunningStandalone() ? 'installed' : 'checking',
    );
    const [promptEvent, setPromptEvent] =
        useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (isRunningStandalone()) {
            return;
        }

        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setPromptEvent(event as BeforeInstallPromptEvent);
            setState('ready');
        };

        const onInstalled = () => {
            setPromptEvent(null);
            setState('installed');
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onInstalled);

        // The event fires early or not at all; give it a moment before falling
        // back to the manual instructions.
        const timeout = window.setTimeout(() => {
            setState((current) =>
                current === 'checking' ? 'unsupported' : current,
            );
        }, 2500);

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                onBeforeInstallPrompt,
            );
            window.removeEventListener('appinstalled', onInstalled);
            window.clearTimeout(timeout);
        };
    }, []);

    const install = useCallback(async () => {
        if (!promptEvent) {
            return;
        }

        setState('installing');

        try {
            await promptEvent.prompt();
            const choice = await promptEvent.userChoice;

            setState(choice.outcome === 'accepted' ? 'installed' : 'ready');
        } catch {
            setState('ready');
        }
    }, [promptEvent]);

    return { state, install };
}

/**
 * Register the service worker and surface waiting updates.
 *
 * The booth is never reloaded automatically: `applyUpdate` is called from a
 * prompt so a customer is not interrupted mid session.
 */
export function useServiceWorker() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        let registration: ServiceWorkerRegistration | null = null;

        const track = (worker: ServiceWorker | null) => {
            if (!worker) {
                return;
            }

            if (
                worker.state === 'installed' &&
                navigator.serviceWorker.controller
            ) {
                setWaiting(worker);
                setUpdateAvailable(true);
            }

            worker.addEventListener('statechange', () => {
                if (
                    worker.state === 'installed' &&
                    navigator.serviceWorker.controller
                ) {
                    setWaiting(worker);
                    setUpdateAvailable(true);
                }
            });
        };

        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((result) => {
                registration = result;

                track(result.waiting);

                result.addEventListener('updatefound', () => {
                    track(result.installing);
                });
            })
            .catch(() => {
                // A failed registration must never break the booth.
            });

        const interval = window.setInterval(
            () => registration?.update(),
            60 * 60 * 1000,
        );

        return () => window.clearInterval(interval);
    }, []);

    const applyUpdate = useCallback(() => {
        waiting?.postMessage('SKIP_WAITING');

        navigator.serviceWorker?.addEventListener(
            'controllerchange',
            () => window.location.reload(),
            { once: true },
        );
    }, [waiting]);

    return { updateAvailable, applyUpdate };
}
