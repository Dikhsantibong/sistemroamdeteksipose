import { useEffect, useRef, useState } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'error';

/**
 * Open the tablet camera once and share the stream with every detector.
 *
 * The stream is only ever read frame by frame in memory. Nothing is recorded,
 * stored or uploaded, and the stream is stopped when the booth unmounts.
 */
export function useCamera(enabled: boolean) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [status, setStatus] = useState<CameraStatus>('idle');
    const [video, setVideo] = useState<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let stream: MediaStream | null = null;
        let cancelled = false;

        const start = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setStatus('error');

                return;
            }

            setStatus('requesting');

            try {
                // 720p rather than VGA: a hand two or three metres away is only
                // a few dozen pixels wide at 640x480, which is below what the
                // landmarker can track reliably.
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());

                    return;
                }

                const video = videoRef.current;

                if (!video) {
                    setStatus('error');

                    return;
                }

                video.srcObject = stream;
                await video.play();

                setVideo(video);
                setStatus('ready');
            } catch (error) {
                setStatus(
                    error instanceof DOMException &&
                        (error.name === 'NotAllowedError' ||
                            error.name === 'SecurityError')
                        ? 'denied'
                        : 'error',
                );
            }
        };

        void start();

        return () => {
            cancelled = true;
            stream?.getTracks().forEach((track) => track.stop());
            setVideo(null);
        };
    }, [enabled]);

    return { videoRef, video, status };
}
