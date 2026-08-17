import type { GestureStatus } from '@/hooks/booth/use-hand-gesture';
import type { RemoteControl } from '@/hooks/booth/use-remote-control';
import type { VoiceStatus } from '@/hooks/booth/use-voice-command';
import { voiceExamples } from '@/lib/booth/voice-commands';

type Props = {
    remote: RemoteControl | null;
    voiceStatus: VoiceStatus;
    voiceLastHeardAt: number;
    /** Recognition language, so the hint names words the engine listens for. */
    voiceLanguage: string;
    gestureStatus: GestureStatus;
    handVisible: boolean;
    gestureLastSwipeAt: number;
};

/**
 * Tell the customer how to drive the booth and confirm when a command lands.
 *
 * Without this the booth silently ignores a command that was not understood and
 * there is no way to tell a misheard word from a broken microphone. One line,
 * one hint: only the remote control that is actually active is described.
 */
export function InputStatus({
    remote,
    voiceStatus,
    voiceLastHeardAt,
    voiceLanguage,
    gestureStatus,
    handVisible,
    gestureLastSwipeAt,
}: Props) {
    if (remote === null) {
        return null;
    }

    const examples = voiceExamples(voiceLanguage);

    const isVoice = remote === 'voice';

    const live = isVoice ? voiceStatus === 'listening' : handVisible;
    const acceptedAt = isVoice ? voiceLastHeardAt : gestureLastSwipeAt;

    const hint = () => {
        if (isVoice) {
            if (voiceStatus === 'unsupported') {
                return 'Browser tidak mendukung perintah suara.';
            }

            if (voiceStatus === 'denied') {
                return 'Izin mikrofon ditolak. Periksa pengaturan browser Anda.';
            }

            if (voiceStatus === 'unavailable') {
                return 'Perintah suara tidak tersedia. Gunakan tombol di bawah.';
            }

            return voiceStatus === 'listening'
                ? `Ucapkan "${examples.next}" atau "${examples.previous}"`
                : 'Menyiapkan perintah suara…';
        }

        if (gestureStatus === 'unavailable') {
            return 'Gerakan tangan tidak tersedia. Gunakan tombol di bawah.';
        }

        if (gestureStatus !== 'running') {
            return 'Menyiapkan gerakan tangan…';
        }

        return handVisible
            ? 'Tangan terdeteksi — geser ke samping untuk ganti pose'
            : 'Angkat tangan lalu geser ke samping';
    };

    return (
        <div className="flex items-center gap-3 text-lg text-booth-muted">
            <span
                aria-hidden="true"
                className={`size-2 rounded-full ${
                    live ? 'bg-booth-accent' : 'bg-booth-border'
                }`}
            />
            <span>{hint()}</span>

            {/* Keyed on the timestamp so each accepted command replays the fade,
                confirming the booth heard or saw it. */}
            {acceptedAt > 0 && (
                <span
                    key={acceptedAt}
                    className="animate-out text-booth-accent duration-[2000ms] fill-mode-forwards fade-out"
                >
                    Perintah diterima
                </span>
            )}
        </div>
    );
}
