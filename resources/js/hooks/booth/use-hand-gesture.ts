import type { HandLandmarker } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';
import type { NavigationAction } from '@/lib/booth/navigation';
import type { SwipeOptions, SwipeSample } from '@/lib/booth/swipe';
import { detectSwipe, pushSwipeSample, swipeProgress } from '@/lib/booth/swipe';
import { createHandLandmarker } from '@/lib/booth/vision';

export type GestureStatus = 'idle' | 'loading' | 'running' | 'unavailable';

type Options = {
    video: HTMLVideoElement | null;
    enabled: boolean;
    confidence: number;
    cooldownMs: number;
    onAction: (action: NavigationAction) => void;
};

/**
 * A swipe is measured in hand-widths, so it works at any distance from the
 * tablet. Roughly two hand-widths within 700ms is a deliberate sideways flick.
 */
const SWIPE: SwipeOptions = {
    travelRatio: 2.2,
    minimumTravel: 0.05,
    maximumTravel: 0.28,
    maximumDurationMs: 700,
};

/**
 * How long a trail of positions is kept.
 *
 * Longer than the swipe itself on purpose: detectSwipe searches backwards
 * through this history for the flick, so the trail needs to hold the moments
 * before it as well.
 */
const SWIPE_WINDOW_MS = 1000;

/** Delay between reads. The loop reschedules itself, so this is a gap, not a rate. */
const SAMPLE_INTERVAL_MS = 40;

/** Frames without a hand before the trail is abandoned. */
const LOST_HAND_FRAMES = 6;

/**
 * A hand below this line is hanging by the customer's side, not gesturing.
 * Ignoring it stops ordinary arm movement from paging through poses.
 */
const RAISED_HAND_LIMIT = 0.8;

/** Landmarks that form the palm: wrist plus the four finger bases. */
const PALM_LANDMARKS = [0, 5, 9, 13, 17];

type Landmark = { x: number; y: number };

/**
 * Turn a horizontal hand swipe into a navigation action.
 *
 * Tracking follows the palm centre rather than the wrist. A single landmark
 * jitters by several percent of the frame between reads, which at distance is
 * the same order as the gesture itself; averaging the five palm points is far
 * steadier and costs nothing.
 *
 * Both hands are tracked and the larger one wins, so it does not matter which
 * hand the customer raises.
 */
export function useHandGesture({
    video,
    enabled,
    confidence,
    cooldownMs,
    onAction,
}: Options) {
    const [status, setStatus] = useState<GestureStatus>('idle');
    const [handVisible, setHandVisible] = useState(false);
    const [lastSwipeAt, setLastSwipeAt] = useState(0);
    const [progress, setProgress] = useState(0);

    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const trailRef = useRef<SwipeSample[]>([]);
    const missesRef = useRef(0);
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

                let hands: Landmark[][] = [];

                try {
                    hands = landmarker.detectForVideo(
                        video,
                        performance.now(),
                    ).landmarks;
                } catch {
                    return;
                }

                const now = performance.now();
                const hand = widestHand(hands);

                if (!hand) {
                    missesRef.current++;

                    // A single dropped frame mid swipe must not reset the
                    // trail, but a hand that left the frame should.
                    if (missesRef.current >= LOST_HAND_FRAMES) {
                        trailRef.current = [];
                        setHandVisible((current) =>
                            current ? false : current,
                        );
                    }

                    return;
                }

                missesRef.current = 0;
                setHandVisible((current) => (current ? current : true));

                const palm = palmCentre(hand);

                if (palm.y > RAISED_HAND_LIMIT) {
                    trailRef.current = [];

                    return;
                }

                trailRef.current = pushSwipeSample(
                    trailRef.current,
                    { ...palm, span: handSpan(hand), at: now },
                    SWIPE_WINDOW_MS,
                );

                if (now < cooldownUntilRef.current) {
                    return;
                }

                // Rounded so a jittering hand does not re-render every frame.
                const reached =
                    Math.round(swipeProgress(trailRef.current, SWIPE) * 10) /
                    10;

                setProgress((current) =>
                    current === reached ? current : reached,
                );

                const direction = detectSwipe(trailRef.current, SWIPE);

                if (direction === null) {
                    return;
                }

                trailRef.current = [];
                setProgress(0);
                cooldownUntilRef.current = now + cooldownMs;
                setLastSwipeAt(Date.now());

                // The preview is mirrored for the customer, so a sweep that
                // looks like it goes left travels right across the raw image.
                onActionRef.current(
                    direction === 'right' ? 'NEXT_POSE' : 'PREVIOUS_POSE',
                );
            };

            // Reschedule after each read rather than on a fixed interval. Hand
            // landmarking costs tens of milliseconds on a tablet, and a timer
            // that fires faster than the work completes queues up callbacks
            // until the whole page stutters.
            const loop = () => {
                if (cancelled) {
                    return;
                }

                sample();
                timer = window.setTimeout(loop, SAMPLE_INTERVAL_MS);
            };

            loop();
        };

        void run();

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            landmarkerRef.current?.close();
            landmarkerRef.current = null;
            trailRef.current = [];
            missesRef.current = 0;
            setHandVisible(false);
            setProgress(0);
            setStatus('idle');
        };
    }, [video, enabled, confidence, cooldownMs]);

    return { status, handVisible, lastSwipeAt, progress };
}

/**
 * Average the palm landmarks into one steady tracking point.
 */
function palmCentre(hand: Landmark[]): { x: number; y: number } {
    let x = 0;
    let y = 0;

    for (const index of PALM_LANDMARKS) {
        x += hand[index].x;
        y += hand[index].y;
    }

    return { x: x / PALM_LANDMARKS.length, y: y / PALM_LANDMARKS.length };
}

/**
 * The width of the hand, used as the yardstick for how far a swipe must travel.
 */
function handSpan(hand: Landmark[]): number {
    const xs = hand.map((point) => point.x);

    return Math.max(...xs) - Math.min(...xs);
}

/**
 * Pick the hand that covers the most of the frame, which is the one closest to
 * the camera and therefore the most reliable to track.
 */
function widestHand(hands: Landmark[][]): Landmark[] | null {
    let widest: Landmark[] | null = null;
    let widestArea = 0;

    for (const hand of hands) {
        if (hand.length === 0) {
            continue;
        }

        const xs = hand.map((point) => point.x);
        const ys = hand.map((point) => point.y);
        const area =
            (Math.max(...xs) - Math.min(...xs)) *
            (Math.max(...ys) - Math.min(...ys));

        if (area > widestArea) {
            widest = hand;
            widestArea = area;
        }
    }

    return widest;
}
