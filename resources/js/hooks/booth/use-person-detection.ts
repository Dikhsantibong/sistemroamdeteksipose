import type { ObjectDetector } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';
import { pushSample, resolveStableCount } from '@/lib/booth/stable-count';
import { createPersonDetector } from '@/lib/booth/vision';

export type DetectionStatus = 'idle' | 'loading' | 'running' | 'unavailable';

type Options = {
    video: HTMLVideoElement | null;
    enabled: boolean;
    confidence: number;
    intervalMs: number;
    smoothingFrames: number;
};

/**
 * Count the people in front of the camera and smooth the result over time.
 *
 * The loop never stops: it keeps counting while a pose is on screen, so a
 * person joining or leaving the group updates the count and, through the
 * navigation controller, the recommendations.
 *
 * Detection runs on a timer rather than every animation frame — a booth tablet
 * has a modest CPU and a pose recommendation does not need 60 counts a second.
 */
export function usePersonDetection({
    video,
    enabled,
    confidence,
    intervalMs,
    smoothingFrames,
}: Options) {
    const [status, setStatus] = useState<DetectionStatus>('idle');
    const [rawCount, setRawCount] = useState(0);
    const [stableCount, setStableCount] = useState(0);

    const samplesRef = useRef<number[]>([]);
    const stableCountRef = useRef(0);
    const detectorRef = useRef<ObjectDetector | null>(null);

    useEffect(() => {
        if (!enabled || !video) {
            return;
        }

        let cancelled = false;
        let timer: number | undefined;

        const run = async () => {
            setStatus('loading');

            try {
                detectorRef.current = await createPersonDetector(confidence);
            } catch {
                if (!cancelled) {
                    setStatus('unavailable');
                }

                return;
            }

            if (cancelled) {
                detectorRef.current?.close();
                detectorRef.current = null;

                return;
            }

            setStatus('running');

            const detect = () => {
                const detector = detectorRef.current;

                if (cancelled || !detector || video.readyState < 2) {
                    return;
                }

                try {
                    const result = detector.detectForVideo(
                        video,
                        performance.now(),
                    );

                    const people = result.detections.filter((detection) =>
                        detection.categories.some(
                            (category) => category.score >= confidence,
                        ),
                    ).length;

                    // Only push state when it actually moves: this loop runs
                    // for as long as the booth is open.
                    setRawCount((current) =>
                        current === people ? current : people,
                    );

                    samplesRef.current = pushSample(
                        samplesRef.current,
                        people,
                        smoothingFrames,
                    );

                    const resolved = resolveStableCount(
                        samplesRef.current,
                        smoothingFrames,
                        stableCountRef.current,
                    );

                    if (
                        resolved !== null &&
                        resolved !== stableCountRef.current
                    ) {
                        stableCountRef.current = resolved;
                        setStableCount(resolved);
                    }
                } catch {
                    // A dropped frame is not worth tearing the detector down.
                }
            };

            timer = window.setInterval(detect, intervalMs);
        };

        void run();

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            detectorRef.current?.close();
            detectorRef.current = null;
            samplesRef.current = [];
            stableCountRef.current = 0;
            setStableCount(0);
            setStatus('idle');
        };
    }, [video, enabled, confidence, intervalMs, smoothingFrames]);

    return { status, rawCount, stableCount };
}
