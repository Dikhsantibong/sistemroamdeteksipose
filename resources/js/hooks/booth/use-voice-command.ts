import { useEffect, useMemo, useRef, useState } from 'react';
import type { NavigationAction } from '@/lib/booth/navigation';

export type VoiceStatus = 'idle' | 'listening' | 'unavailable';

type Options = {
    enabled: boolean;
    language: string;
    confidence: number;
    onAction: (action: NavigationAction) => void;
};

/**
 * The phrases that move the session, per supported language.
 *
 * Longer phrases are listed first so "next pose" is not matched as "next".
 */
const COMMANDS: Record<
    string,
    { phrases: string[]; action: NavigationAction }[]
> = {
    'en-US': [
        {
            phrases: ['previous pose', 'previous', 'back'],
            action: 'PREVIOUS_POSE',
        },
        { phrases: ['next pose', 'next'], action: 'NEXT_POSE' },
    ],
    'id-ID': [
        {
            phrases: ['pose sebelumnya', 'sebelumnya', 'kembali'],
            action: 'PREVIOUS_POSE',
        },
        {
            phrases: ['pose berikutnya', 'berikutnya', 'lanjut', 'selanjutnya'],
            action: 'NEXT_POSE',
        },
    ],
};

type SpeechRecognitionLike = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
    resultIndex: number;
    results: ArrayLike<
        ArrayLike<{ transcript: string; confidence: number }> & {
            isFinal: boolean;
        }
    >;
};

function recognitionConstructor(): (new () => SpeechRecognitionLike) | null {
    const speech = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };

    return speech.SpeechRecognition ?? speech.webkitSpeechRecognition ?? null;
}

/**
 * Match a transcript against the commands for the active language.
 */
function matchAction(
    transcript: string,
    language: string,
): NavigationAction | null {
    const normalized = transcript.toLowerCase().trim();
    const commands = COMMANDS[language] ?? COMMANDS['en-US'];

    for (const command of commands) {
        if (command.phrases.some((phrase) => normalized.includes(phrase))) {
            return command.action;
        }
    }

    return null;
}

/**
 * Listen for the spoken navigation commands.
 *
 * Recognition is a trigger only: transcripts are matched in memory and never
 * stored or sent anywhere, and no audio is recorded.
 */
export function useVoiceCommand({
    enabled,
    language,
    confidence,
    onAction,
}: Options) {
    const [status, setStatus] = useState<VoiceStatus>('idle');
    const onActionRef = useRef(onAction);

    // Browser support does not change at runtime, so it is resolved once rather
    // than pushed through an effect.
    const Recognition = useMemo(() => recognitionConstructor(), []);

    useEffect(() => {
        onActionRef.current = onAction;
    }, [onAction]);

    useEffect(() => {
        if (!enabled || !Recognition) {
            return;
        }

        const recognition = new Recognition();
        let stopped = false;
        let restartTimer: number | undefined;
        let failureTimer: number | undefined;

        recognition.lang = language;
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            for (
                let index = event.resultIndex;
                index < event.results.length;
                index++
            ) {
                const result = event.results[index];
                const alternative = result[0];

                if (!result.isFinal || !alternative) {
                    continue;
                }

                // Some engines report a confidence of 0 for final results.
                if (
                    alternative.confidence > 0 &&
                    alternative.confidence < confidence
                ) {
                    continue;
                }

                const action = matchAction(alternative.transcript, language);

                if (action) {
                    onActionRef.current(action);
                }
            }
        };

        recognition.onerror = (event) => {
            if (
                event.error === 'not-allowed' ||
                event.error === 'service-not-allowed'
            ) {
                stopped = true;
                setStatus('unavailable');
            }
        };

        // Chrome ends recognition after a pause; restart it to keep listening.
        recognition.onend = () => {
            if (stopped) {
                return;
            }

            restartTimer = window.setTimeout(() => {
                try {
                    recognition.start();
                } catch {
                    setStatus('unavailable');
                }
            }, 400);
        };

        recognition.onstart = () => setStatus('listening');

        try {
            recognition.start();
        } catch {
            // Some engines throw when recognition is already running; report it
            // after the effect so the status change is not a cascading render.
            failureTimer = window.setTimeout(() => setStatus('unavailable'), 0);
        }

        return () => {
            stopped = true;
            window.clearTimeout(restartTimer);
            window.clearTimeout(failureTimer);
            recognition.onstart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            recognition.abort();
            setStatus('idle');
        };
    }, [enabled, language, confidence, Recognition]);

    if (!enabled) {
        return { status: 'idle' as VoiceStatus };
    }

    return {
        status: Recognition === null ? ('unavailable' as VoiceStatus) : status,
    };
}
