import type { HandLandmarker } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';
import type { NavigationAction } from '@/lib/booth/navigation';
import { createHandLandmarker } from '@/lib/booth/vision';

export type GestureStatus = 'idle' | 'loading' | 'running' | 'unavailable';

type Options = {
    video: HTMLVideoElement | null;
    enabled: boolean;
    confidence: number;
    cooldownMs: number;
    onAction: (action: NavigationAction) => void;
};

/** How far across the frame the hand must travel for a swipe to count. */
const SWIPE_DISTANCE = 0.18;

/** How long a swipe may take before it is treated as ordinary movement. */
const SWIPE_WINDOW_MS = 700;

/** Frames are polled faster than person detection so a swipe is not missed. */
const SAMPLE_INTERVAL_MS = 80;

/**
 * Turn a horizontal hand swipe into a navigation action.
 *
 * The wrist landmark is tracked across a short window. A swipe only counts when
 * it clears the distance threshold inside that window, and the cooldown stops
 * one physical wave from paging through several poses.
 */
export function useHandGesture({
    video,
    enabled,
    confidence,
    cooldownMs,
    onAction,
}: Options) {
    const [status, setStatus] = useState<GestureStatus>('idle');

    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const originRef = useRef<{ x: number; at: number } | null>(null);
    const cooldownUntilRef = useRef(0);
    const onActionRef = useRef(onAction);

    useEffect(() => {
        onActionRef.current = onAction;
    }, [onAction]);

    useEffect(() => {
        if (!enabled || !video) {
            return;
        }

        let cancelled = false;
        let timer: number | undefined;

        const run = async () => {
            setStatus('loading');

            try {
                landmarkerRef.current = await createHandLandmarker(confidence);
            } catch {
                if (!cancelled) {
                    setStatus('unavailable');
                }

                return;
            }

            if (cancelled) {
                landmarkerRef.current?.close();
                landmarkerRef.current = null;

                return;
            }

            setStatus('running');

            const sample = () => {
                const landmarker = landmarkerRef.current;

                if (cancelled || !landmarker || video.readyState < 2) {
                    return;
                }

                let wrist: { x: number } | undefined;

                try {
                    const result = landmarker.detectForVideo(
                        video,
                        performance.now(),
                    );

                    wrist = result.landmarks[0]?.[0];
                } catch {
                    return;
                }

                const now = performance.now();

                if (!wrist) {
                    originRef.current = null;

                    return;
                }

                const origin = originRef.current;

                if (!origin || now - origin.at > SWIPE_WINDOW_MS) {
                    originRef.current = { x: wrist.x, at: now };

                    return;
                }

                const travelled = wrist.x - origin.x;

                if (Math.abs(travelled) < SWIPE_DISTANCE) {
                    return;
                }

                originRef.current = { x: wrist.x, at: now };

                if (now < cooldownUntilRef.current) {
                    return;
                }

                cooldownUntilRef.current = now + cooldownMs;

                // The preview is mirrored, so a swipe that looks like it goes
                // left moves the landmark to the right of the frame.
                onActionRef.current(
                    travelled > 0 ? 'NEXT_POSE' : 'PREVIOUS_POSE',
                );
            };

            timer = window.setInterval(sample, SAMPLE_INTERVAL_MS);
        };

        void run();

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            landmarkerRef.current?.close();
            landmarkerRef.current = null;
            originRef.current = null;
            setStatus('idle');
        };
    }, [video, enabled, confidence, cooldownMs]);

    return { status };
}
