import type { NavigationAction } from '@/lib/booth/navigation';

/**
 * The manual fallback. These buttons dispatch the same actions as the gesture
 * and voice inputs, so the booth keeps working when either of those fails.
 */
export function NavigationControls({
    onAction,
    disabled,
}: {
    onAction: (action: NavigationAction) => void;
    disabled: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <button
                type="button"
                disabled={disabled}
                onClick={() => onAction('PREVIOUS_POSE')}
                className="h-10 flex-1 rounded-lg border border-white/20 bg-black/40 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60 disabled:opacity-40"
            >
                ← Sebelumnya
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onAction('NEXT_POSE')}
                className="h-10 flex-1 rounded-lg bg-booth-accent/90 text-base font-medium text-booth-accent-foreground backdrop-blur-sm transition-opacity hover:bg-booth-accent disabled:opacity-40"
            >
                Berikutnya →
            </button>
        </div>
    );
}
