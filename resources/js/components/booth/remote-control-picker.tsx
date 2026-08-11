import { Hand, Mic } from 'lucide-react';
import type { RemoteControl } from '@/hooks/booth/use-remote-control';
import { voiceExamples } from '@/lib/booth/voice-commands';

const ICONS: Record<RemoteControl, typeof Mic> = {
    voice: Mic,
    gesture: Hand,
};

const LABELS: Record<RemoteControl, string> = {
    voice: 'Suara',
    gesture: 'Tangan',
};

/**
 * Choose whether the customer drives the booth by voice or by hand.
 *
 * The active option is filled in the accent colour and carries its own one line
 * instruction, so a customer walking up can tell at a glance both which method
 * is live and what to actually do. Rendered only when the administrator enabled
 * both, so the header never carries a control with a single option.
 */
export function RemoteControlPicker({
    available,
    active,
    voiceLanguage,
    onSelect,
}: {
    available: RemoteControl[];
    active: RemoteControl | null;
    /** Recognition language, so the hint names a word the engine listens for. */
    voiceLanguage: string;
    onSelect: (mode: RemoteControl) => void;
}) {
    const hints: Record<RemoteControl, string> = {
        voice: `Ucapkan "${voiceExamples(voiceLanguage).next}"`,
        gesture: 'Geser tangan ke samping',
    };

    return (
        <div
            className="flex shrink-0 items-center gap-2 rounded-xl border border-booth-border p-1.5"
            role="group"
            aria-label="Kendali jarak jauh"
        >
            {available.map((mode) => {
                const Icon = ICONS[mode];
                const isActive = active === mode;

                return (
                    <button
                        key={mode}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onSelect(mode)}
                        className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-left transition-colors ${
                            isActive
                                ? 'bg-booth-accent text-booth-accent-foreground'
                                : 'text-booth-muted hover:bg-booth-surface'
                        }`}
                    >
                        <Icon className="size-6 shrink-0" />
                        <span className="leading-tight">
                            <span className="block text-lg font-medium">
                                {LABELS[mode]}
                            </span>
                            <span
                                className={`block text-sm ${
                                    isActive
                                        ? 'opacity-80'
                                        : 'text-booth-muted/70'
                                }`}
                            >
                                {isActive ? hints[mode] : 'Ketuk untuk pakai'}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
