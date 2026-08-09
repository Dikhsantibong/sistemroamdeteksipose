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
        <div className="flex items-center justify-between gap-6">
            <button
                type="button"
                disabled={disabled}
                onClick={() => onAction('PREVIOUS_POSE')}
                className="h-24 flex-1 rounded-lg border-2 border-neutral-700 text-3xl font-medium text-neutral-100 transition-colors hover:bg-neutral-900 disabled:opacity-40"
            >
                Previous
            </button>
            <button
                type="button"
                disabled={disabled}
                onClick={() => onAction('NEXT_POSE')}
                className="h-24 flex-1 rounded-lg bg-neutral-100 text-3xl font-medium text-neutral-950 transition-colors hover:bg-white disabled:opacity-40"
            >
                Next
            </button>
        </div>
    );
}
