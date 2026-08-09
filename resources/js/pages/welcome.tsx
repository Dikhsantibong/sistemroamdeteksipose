import { Head } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';
import { BoothMessage } from '@/components/booth/booth-message';
import { NavigationControls } from '@/components/booth/navigation-controls';
import { PoseDisplay } from '@/components/booth/pose-display';
import { useCamera } from '@/hooks/booth/use-camera';
import { useContentSync } from '@/hooks/booth/use-content-sync';
import { useDevice } from '@/hooks/booth/use-device';
import { useHandGesture } from '@/hooks/booth/use-hand-gesture';
import { usePersonDetection } from '@/hooks/booth/use-person-detection';
import { usePoseNavigation } from '@/hooks/booth/use-pose-navigation';
import { useVoiceCommand } from '@/hooks/booth/use-voice-command';
import { useServiceWorker } from '@/hooks/use-pwa';
import type { BoothState, NavigationAction } from '@/lib/booth/navigation';
import type { BoothEndpoints, BoothSettings, PeopleCount } from '@/types';

/**
 * Booth mode. This is the application root so the tablet needs no address bar
 * and no navigation: opening the app lands the customer straight here.
 */
export default function Booth({
    settings: initialSettings,
    contentVersion: initialContentVersion,
    peopleCounts,
    endpoints,
}: {
    settings: BoothSettings;
    contentVersion: string;
    peopleCounts: Pick<PeopleCount, 'count' | 'label'>[];
    endpoints: BoothEndpoints;
}) {
    const {
        poses,
        settings,
        contentVersion,
        status: syncStatus,
        isReady,
    } = useContentSync({
        endpoints,
        initialSettings,
        initialContentVersion,
    });

    const { updateAvailable, applyUpdate } = useServiceWorker();

    useDevice(endpoints, settings.heartbeat_interval, contentVersion);

    const { videoRef, video, status: cameraStatus } = useCamera(true);

    // Detection never pauses. It keeps counting while a pose is on screen, so a
    // group that grows or shrinks gets a new set of recommendations by itself.
    const detection = usePersonDetection({
        video,
        enabled: cameraStatus === 'ready',
        confidence: settings.detection_confidence,
        intervalMs: settings.detection_interval,
        smoothingFrames: settings.detection_smoothing,
    });

    const navigation = usePoseNavigation({
        poses,
        peopleCount: detection.stableCount,
        recommendationCount: settings.recommendation_count,
        loop: settings.pose_loop_enabled,
    });

    const { dispatch } = navigation;

    const handleGesture = useCallback(
        (action: NavigationAction) => dispatch(action, 'gesture'),
        [dispatch],
    );

    const handleVoice = useCallback(
        (action: NavigationAction) => dispatch(action, 'voice'),
        [dispatch],
    );

    const handleManual = useCallback(
        (action: NavigationAction) => dispatch(action, 'manual'),
        [dispatch],
    );

    const gesture = useHandGesture({
        video,
        enabled: settings.hand_gesture_enabled && cameraStatus === 'ready',
        confidence: settings.gesture_confidence,
        cooldownMs: settings.gesture_cooldown,
        onAction: handleGesture,
    });

    const voice = useVoiceCommand({
        enabled: settings.voice_enabled,
        language: settings.voice_language,
        confidence: settings.voice_confidence,
        onAction: handleVoice,
    });

    const groupLabel = useMemo(() => {
        const configured = peopleCounts.find(
            (peopleCount) => peopleCount.count === detection.stableCount,
        );

        if (configured) {
            return configured.label;
        }

        return detection.stableCount === 1
            ? '1 person'
            : `${detection.stableCount} people`;
    }, [peopleCounts, detection.stableCount]);

    const state: BoothState = useMemo(() => {
        if (cameraStatus === 'denied' || cameraStatus === 'error') {
            return 'ERROR';
        }

        if (detection.status === 'unavailable') {
            return 'ERROR';
        }

        if (
            cameraStatus !== 'ready' ||
            detection.status === 'loading' ||
            !isReady
        ) {
            return 'INITIALIZING';
        }

        if (detection.stableCount === 0) {
            return 'DETECTING';
        }

        if (navigation.total === 0) {
            return 'LOADING_RECOMMENDATIONS';
        }

        return 'SHOWING_POSE';
    }, [
        cameraStatus,
        detection.status,
        detection.stableCount,
        isReady,
        navigation.total,
    ]);

    const message = () => {
        if (cameraStatus === 'denied') {
            return {
                title: 'Camera permission is required',
                description:
                    'Allow camera access to detect the number of people.',
            };
        }

        if (cameraStatus === 'error') {
            return {
                title: 'Camera is unavailable',
                description:
                    'Check that no other application is using the camera.',
            };
        }

        if (detection.status === 'unavailable') {
            return {
                title: 'Person detection is unavailable',
                description: settings.manual_navigation_enabled
                    ? 'Use the manual buttons to browse poses.'
                    : undefined,
            };
        }

        if (state === 'INITIALIZING') {
            return { title: 'Starting up…' };
        }

        if (state === 'DETECTING') {
            return { title: 'Waiting for people…' };
        }

        if (state === 'LOADING_RECOMMENDATIONS') {
            return poses.length === 0 && syncStatus === 'syncing'
                ? { title: 'Loading poses…' }
                : {
                      title: 'No poses are available',
                      description: `Nothing has been added for ${groupLabel} yet.`,
                  };
        }

        return null;
    };

    const boothMessage = message();

    return (
        <>
            <Head title="Booth" />

            <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 p-8 text-neutral-100">
                {/* The camera feed is processed in memory only; it is never
                    shown, recorded or uploaded. */}
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="pointer-events-none absolute size-px opacity-0"
                    aria-hidden="true"
                />

                <header className="flex items-center justify-between text-base text-neutral-500">
                    <span
                        key={detection.stableCount}
                        className="animate-in rounded-md border border-neutral-800 px-3 py-1 text-neutral-300 duration-500 fade-in"
                    >
                        {detection.stableCount === 0
                            ? 'No one in frame'
                            : groupLabel}
                    </span>
                    <span className="flex items-center gap-4">
                        {syncStatus === 'offline' && (
                            <span>Offline mode — using cached content</span>
                        )}
                        {settings.voice_enabled &&
                            voice.status === 'unavailable' && (
                                <span>
                                    Voice command is unavailable. Use the manual
                                    button.
                                </span>
                            )}
                        {settings.hand_gesture_enabled &&
                            gesture.status === 'unavailable' && (
                                <span>Hand gesture is unavailable.</span>
                            )}
                    </span>
                </header>

                {/* Keyed on the group size so a new session fades in instead of
                    swapping abruptly when someone joins or leaves. */}
                <main
                    key={detection.stableCount}
                    className="min-h-0 flex-1 animate-in py-6 duration-500 fade-in"
                >
                    {boothMessage ? (
                        <BoothMessage
                            title={boothMessage.title}
                            description={boothMessage.description}
                        />
                    ) : (
                        navigation.currentPose && (
                            <PoseDisplay
                                pose={navigation.currentPose}
                                index={navigation.index}
                                total={navigation.total}
                            />
                        )
                    )}
                </main>

                {settings.manual_navigation_enabled && (
                    <NavigationControls
                        onAction={handleManual}
                        disabled={navigation.total === 0}
                    />
                )}

                {updateAvailable && (
                    <div className="absolute right-8 bottom-8 flex items-center gap-4 rounded-lg border border-neutral-700 bg-neutral-900 px-6 py-4">
                        <span className="text-lg">
                            A new version is available.
                        </span>
                        <button
                            type="button"
                            onClick={applyUpdate}
                            className="rounded-md bg-neutral-100 px-4 py-2 text-lg font-medium text-neutral-950"
                        >
                            Update Now
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
