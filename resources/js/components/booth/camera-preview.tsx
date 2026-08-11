import type { RefObject } from 'react';
import type { CameraStatus } from '@/hooks/booth/use-camera';

type Props = {
    videoRef: RefObject<HTMLVideoElement | null>;
    cameraStatus: CameraStatus;
    peopleCount: number;
    /** Only meaningful while hand control is the active remote. */
    handVisible: boolean;
    swipeProgress: number;
    showHandState: boolean;
};

/**
 * A small live view of what the camera sees.
 *
 * The booth is otherwise a black box: when a swipe does nothing there is no way
 * to tell whether the hand was out of frame, the lighting was too dim, or the
 * gesture itself was wrong. This is the feedback loop that makes the remote
 * controls learnable.
 *
 * The feed is rendered straight from the local stream. Nothing is recorded,
 * stored or uploaded, and the frames never leave the tablet.
 */
export function CameraPreview({
    videoRef,
    cameraStatus,
    peopleCount,
    handVisible,
    swipeProgress,
    showHandState,
}: Props) {
    const ready = cameraStatus === 'ready';

    return (
        <div className="w-32 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-black/40 backdrop-blur-sm">
            <div className="relative aspect-video">
                {/* Mirrored so the customer sees themselves the way a mirror
                    would, which is what makes a swipe feel the right way round. */}
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="size-full -scale-x-100 object-cover"
                />

                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-sm text-booth-muted">
                        {cameraStatus === 'denied'
                            ? 'Kamera diblokir'
                            : 'Menyiapkan kamera…'}
                    </div>
                )}

                {/* How close the current movement is to counting as a swipe.
                    Turns a silent failure into something a customer can read:
                    keep going, or you are not being tracked at all. */}
                {showHandState && ready && handVisible && (
                    <div className="bg-booth-background/70 absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full">
                        <div
                            className="h-full rounded-full bg-booth-accent transition-[width] duration-100"
                            style={{
                                width: `${Math.round(swipeProgress * 100)}%`,
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-booth-muted">
                <span>
                    {peopleCount === 0
                        ? 'Belum ada orang'
                        : `${peopleCount} orang`}
                </span>

                {showHandState && ready && (
                    <span className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className={`size-2 rounded-full ${
                                handVisible
                                    ? 'bg-booth-accent'
                                    : 'bg-booth-border'
                            }`}
                        />
                        {handVisible
                            ? 'Tangan terlihat'
                            : 'Tangan tak terlihat'}
                    </span>
                )}
            </div>
        </div>
    );
}
