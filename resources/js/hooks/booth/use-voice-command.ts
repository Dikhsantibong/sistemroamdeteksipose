import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NavigationAction } from '@/lib/booth/navigation';
import { extractCommandsFromAlternatives } from '@/lib/booth/voice-commands';

export type VoiceStatus =
    | 'idle'
    | 'starting'
    | 'listening'
    | 'denied'
    | 'unsupported'
    | 'unavailable';

type Options = {
    enabled: boolean;
    language: string;
    /**
     * Below FUZZY_THRESHOLD the booth also accepts near-misses such as "nexr".
     * Raising it makes recognition stricter, not slower.
     */
    confidence: number;
    onAction: (action: NavigationAction) => void;
};

/** Voice confidence at or above this disables near-miss matching. */
const FUZZY_THRESHOLD = 0.5;

/**
 * Safety valve: a single transcript update should never fire more than this.
 * Protects against a garbled result that happens to contain many command words.
 */
const MAX_ACTIONS_PER_UPDATE = 4;

/**
 * Minimum gap between two dispatched commands.
 *
 * Duplicate events for one utterance arrive within tens of milliseconds, while
 * a person repeating "next" cannot manage it faster than roughly half a second.
 * The gap discards the former without ever blocking the latter.
 */
const MIN_DISPATCH_GAP_MS = 250;

/**
 * Chrome ends a recognition session on its own after a pause, after a network
 * blip, and whenever the tab is backgrounded. Restarting immediately is what
 * keeps the booth listening all day.
 */
const RESTART_DELAY_MS = 0;

/** Backoff when the engine refuses to start because it is still tearing down. */
const RETRY_DELAY_MS = 250;

/**
 * How many guesses to ask the engine for. The intended word is often not the
 * top ranked one for a single syllable like "next".
 */
const MAX_ALTERNATIVES = 10;

/** If nothing at all is heard for this long, the session is rebuilt. */
const WATCHDOG_MS = 8_000;

/** Errors that simply mean "carry on"; anything else is treated as fatal. */
const RECOVERABLE_ERRORS = new Set([
    'no-speech',
    'aborted',
    'audio-capture',
    'network',
]);

type SpeechRecognitionAlternative = {
    transcript: string;
    confidence: number;
};

type SpeechRecognitionResultLike = ArrayLike<SpeechRecognitionAlternative> & {
    isFinal: boolean;
};

type SpeechRecognitionEventLike = {
    resultIndex: number;
    results: ArrayLike<SpeechRecognitionResultLike>;
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
    onaudiostart: (() => void) | null;
    onspeechstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
};

function recognitionConstructor(): (new () => SpeechRecognitionLike) | null {
    const speech = window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };

    return speech.SpeechRecognition ?? speech.webkitSpeechRecognition ?? null;
}

/**
 * Listen for the spoken navigation commands.
 *
 * Reliability comes from five things:
 *
 *  - interim results are acted on, so a command fires while the customer is
 *    still speaking instead of after the engine decides they finished,
 *  - commands are counted rather than merely detected, so "next next next"
 *    moves three poses and none of them is replayed as the transcript grows,
 *  - every alternative the engine offers is scanned, because the intended word
 *    is often not its top ranked guess for a single syllable,
 *  - the session is restarted on every end, error and tab wake-up, and
 *  - a watchdog rebuilds a session that went quiet without telling us.
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
    const [lastHeardAt, setLastHeardAt] = useState(0);

    const onActionRef = useRef(onAction);
    const activityRef = useRef(0);

    /**
     * How many commands have already been acted on, per recognition result.
     *
     * A continuous session keeps refining and extending one transcript, so the
     * same "next" arrives over and over. Remembering the count is what makes
     * three quick "next" move three poses while replaying none of them.
     */
    const handledRef = useRef(new Map<number, number>());
    const lastDispatchRef = useRef(0);

    // Browser support does not change at runtime, so it is resolved once.
    const Recognition = useMemo(() => recognitionConstructor(), []);

    useEffect(() => {
        onActionRef.current = onAction;
    }, [onAction]);

    const handleResult = useCallback(
        (resultIndex: number, transcripts: string[]) => {
            const commands = extractCommandsFromAlternatives(
                transcripts,
                confidence < FUZZY_THRESHOLD,
            );

            if (commands.length === 0) {
                return;
            }

            const handled = handledRef.current.get(resultIndex) ?? 0;

            if (commands.length <= handled) {
                return;
            }

            const now = Date.now();

            // Chrome can restate one utterance under a fresh result index, so
            // the per-index count alone cannot catch every duplicate.
            if (now - lastDispatchRef.current < MIN_DISPATCH_GAP_MS) {
                handledRef.current.set(resultIndex, commands.length);

                return;
            }

            // Only the commands that appeared since the last update. Everything
            // before that was already acted on.
            const upTo = Math.min(
                commands.length,
                handled + MAX_ACTIONS_PER_UPDATE,
            );

            for (let index = handled; index < upTo; index++) {
                onActionRef.current(commands[index]);
            }

            handledRef.current.set(resultIndex, commands.length);
            lastDispatchRef.current = now;
            setLastHeardAt(now);
        },
        [confidence],
    );

    /**
     * Collect every guess the engine offered for one result.
     */
    const alternativesOf = (result: SpeechRecognitionResultLike): string[] => {
        const transcripts: string[] = [];

        for (let index = 0; index < result.length; index++) {
            const alternative = result[index];

            if (alternative?.transcript) {
                transcripts.push(alternative.transcript);
            }
        }

        return transcripts;
    };

    useEffect(() => {
        if (!enabled || !Recognition) {
            return;
        }

        const recognition = new Recognition();

        let stopped = false;
        let running = false;
        let restartTimer: number | undefined;

        recognition.lang = language;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = MAX_ALTERNATIVES;

        const markActivity = () => {
            activityRef.current = Date.now();
        };

        const start = () => {
            if (stopped || running) {
                return;
            }

            try {
                recognition.start();
                running = true;
                markActivity();
            } catch {
                // Chrome throws when the previous session has not fully torn
                // down yet. Treating that as "started" left the booth deaf
                // until the watchdog fired seconds later, which is exactly how
                // a command goes missing. Retry shortly instead.
                running = false;
                setStatus('starting');
                window.clearTimeout(restartTimer);
                restartTimer = window.setTimeout(start, RETRY_DELAY_MS);
            }
        };

        const restart = (delay = RESTART_DELAY_MS) => {
            if (stopped) {
                return;
            }

            running = false;
            window.clearTimeout(restartTimer);
            restartTimer = window.setTimeout(start, delay);
        };

        recognition.onstart = () => {
            running = true;
            markActivity();
            setStatus('listening');

            // Result indices restart with the session, so the handled counts
            // from the previous one would suppress fresh commands.
            handledRef.current.clear();
        };

        recognition.onaudiostart = markActivity;
        recognition.onspeechstart = markActivity;

        recognition.onresult = (event) => {
            markActivity();

            for (
                let index = event.resultIndex;
                index < event.results.length;
                index++
            ) {
                const result = event.results[index];

                if (!result) {
                    continue;
                }

                handleResult(index, alternativesOf(result));
            }
        };

        recognition.onerror = (event) => {
            console.warn('Voice recognition error:', event.error);
            if (RECOVERABLE_ERRORS.has(event.error)) {
                // A network hiccup deserves a longer pause than a silent room.
                restart(event.error === 'network' ? 1500 : RESTART_DELAY_MS);

                return;
            }

            stopped = true;
            if (event.error === 'not-allowed') {
                setStatus('denied');
            } else {
                setStatus('unavailable');
            }
        };

        recognition.onend = () => restart();

        // Android suspends recognition when the app goes to the background.
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                restart();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        // Rebuild a session that stopped delivering events without an end or
        // error, which Chrome does occasionally on long running pages.
        const watchdog = window.setInterval(() => {
            if (stopped || Date.now() - activityRef.current < WATCHDOG_MS) {
                return;
            }

            try {
                recognition.abort();
            } catch {
                // Aborting an already dead session is fine.
            }

            restart();
        }, WATCHDOG_MS);

        start();

        return () => {
            stopped = true;
            window.clearTimeout(restartTimer);
            window.clearInterval(watchdog);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
            recognition.onstart = null;
            recognition.onaudiostart = null;
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;

            try {
                recognition.abort();
            } catch {
                // Nothing to abort.
            }

            setStatus('idle');
        };
    }, [enabled, language, Recognition, handleResult]);

    if (!enabled) {
        return { status: 'idle' as VoiceStatus, lastHeardAt: 0 };
    }

    if (Recognition === null) {
        return { status: 'unsupported' as VoiceStatus, lastHeardAt };
    }

    // The effect starts a session on mount, so "idle" while enabled means the
    // engine has not reported back yet.
    return {
        status: status === 'idle' ? ('starting' as VoiceStatus) : status,
        lastHeardAt,
    };
}
