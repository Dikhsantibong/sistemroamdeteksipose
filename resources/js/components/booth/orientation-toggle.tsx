import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Orientation = 'landscape' | 'portrait';

function getCurrentOrientation(): Orientation {
    return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
}

/**
 * A small button that toggles the screen orientation between landscape and
 * portrait using the Screen Orientation API (available in standalone PWA mode).
 */
export function OrientationToggle() {
    const [orientation, setOrientation] = useState<Orientation>(
        getCurrentOrientation,
    );
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        if (!screen.orientation) {
            setSupported(false);

            return;
        }

        const onChange = () => setOrientation(getCurrentOrientation());

        screen.orientation.addEventListener('change', onChange);
        window.addEventListener('resize', onChange);

        return () => {
            screen.orientation.removeEventListener('change', onChange);
            window.removeEventListener('resize', onChange);
        };
    }, []);

    const toggle = useCallback(async () => {
        if (!screen.orientation?.lock) {
            setSupported(false);

            return;
        }

        const target: OrientationLockType =
            orientation === 'landscape' ? 'portrait' : 'landscape';

        try {
            await screen.orientation.lock(target);
            setOrientation(target);
        } catch {
            // lock() fails outside standalone / fullscreen mode.
            setSupported(false);
        }
    }, [orientation]);

    if (!supported) {
        return null;
    }

    const label =
        orientation === 'landscape'
            ? 'Beralih ke potret'
            : 'Beralih ke lanskap';

    return (
        <button
            type="button"
            onClick={toggle}
            title={label}
            aria-label={label}
            className="flex items-center justify-center rounded-lg border border-white/15 bg-black/40 p-2 backdrop-blur-sm transition-colors hover:bg-black/60"
        >
            <RotateCcw
                className={`size-5 text-white/80 transition-transform ${
                    orientation === 'portrait' ? 'rotate-90' : ''
                }`}
            />
        </button>
    );
}
