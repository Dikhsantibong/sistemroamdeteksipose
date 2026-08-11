import { useCallback, useMemo, useState } from 'react';

export type RemoteControl = 'voice' | 'gesture';

const STORAGE_KEY = 'booth.remote-control';

function readPreference(): RemoteControl | null {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        return stored === 'voice' || stored === 'gesture' ? stored : null;
    } catch {
        return null;
    }
}

/**
 * Let the customer pick which remote control is live.
 *
 * Only one runs at a time. That is partly a preference — some booths are noisy,
 * some customers would rather wave — and partly performance: the hand
 * landmarker is the most expensive thing the tablet does, and there is no
 * reason to run it while somebody is using their voice.
 *
 * The administrator decides what is *available*; this decides what is *active*.
 * When only one method is enabled there is nothing to choose and the picker
 * stays off the screen.
 */
export function useRemoteControl(
    voiceEnabled: boolean,
    gestureEnabled: boolean,
) {
    const [preference, setPreference] = useState<RemoteControl | null>(
        readPreference,
    );

    const available = useMemo(() => {
        const options: RemoteControl[] = [];

        if (voiceEnabled) {
            options.push('voice');
        }

        if (gestureEnabled) {
            options.push('gesture');
        }

        return options;
    }, [voiceEnabled, gestureEnabled]);

    // A stored preference the administrator has since disabled falls back to
    // whatever is still available, rather than leaving the booth with no remote.
    const active =
        preference !== null && available.includes(preference)
            ? preference
            : (available[0] ?? null);

    const choose = useCallback((mode: RemoteControl) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // A booth with storage disabled simply forgets between sessions.
        }

        setPreference(mode);
    }, []);

    return {
        active,
        available,
        choose,
        /** Nothing to choose when the administrator enabled a single method. */
        isChoosable: available.length > 1,
    };
}
