import { RotateCcw, Smartphone, Tablet } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Orientation = 'landscape' | 'portrait';

function getCurrentOrientation(): Orientation {
    return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
}

/**
 * A prominent button that toggles the screen orientation between landscape and
 * portrait. Uses the Screen Orientation API, falling back to requesting
 * fullscreen first (required by most Android browsers).
 */
export function OrientationToggle() {
    const [orientation, setOrientation] = useState<Orientation>(
        getCurrentOrientation,
    );

    useEffect(() => {
        const onChange = () => setOrientation(getCurrentOrientation());

        screen.orientation?.addEventListener('change', onChange);
        window.addEventListener('resize', onChange);

        return () => {
            screen.orientation?.removeEventListener('change', onChange);
            window.removeEventListener('resize', onChange);
        };
    }, []);

    const toggle = useCallback(async () => {
        const target: OrientationLockType =
            orientation === 'landscape' ? 'portrait' : 'landscape';

        // Try locking orientation directly first (works in standalone PWA).
        if (screen.orientation?.lock) {
            try {
                await screen.orientation.lock(target);
                setOrientation(target);

                return;
            } catch {
                // Falls through to fullscreen approach.
            }
        }

        // Fallback: request fullscreen first, then lock orientation.
        // Most Android browsers require fullscreen for orientation lock.
        try {
            const element = document.documentElement;

            if (!document.fullscreenElement) {
                await element.requestFullscreen();
            }

            if (screen.orientation?.lock) {
                await screen.orientation.lock(target);
                setOrientation(target);
            }
        } catch {
            // Last resort: just tell the user to rotate manually.
            alert(
                orientation === 'landscape'
                    ? 'Putar tablet ke posisi tegak (potret) secara manual.'
                    : 'Putar tablet ke posisi tidur (lanskap) secara manual.',
            );
        }
    }, [orientation]);

    const isLandscape = orientation === 'landscape';
    const Icon = isLandscape ? Smartphone : Tablet;
    const label = isLandscape ? 'Potret' : 'Lanskap';

    return (
        <button
            type="button"
            onClick={toggle}
            title={isLandscape ? 'Beralih ke potret' : 'Beralih ke lanskap'}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-booth-accent/50 bg-booth-accent/20 px-4 py-2.5 text-booth-accent backdrop-blur-sm transition-colors hover:bg-booth-accent/30 active:bg-booth-accent/40"
        >
            <RotateCcw className="size-5" />
            <span className="text-sm font-medium">{label}</span>
            <Icon className="size-4 opacity-70" />
        </button>
    );
}
