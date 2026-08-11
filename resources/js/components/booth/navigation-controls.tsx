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
        <div className="flex items-center justify-between gap-4 pt-2">
            <button
                type="button"
                disabled={disabled}
                onClick={() => onAction('PREVIOUS_POSE')}
                className="h-14 flex-1 rounded-lg border-2 border-booth-border text-xl font-medium text-booth-foreground transition-colors hover:bg-booth-surface disabled:opacity-40"
            >
                Sebelumnya
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onAction('NEXT_POSE')}
                className="h-14 flex-1 rounded-lg bg-booth-accent text-xl font-medium text-booth-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
                Berikutnya
            </button>
        </div>
    );
}
