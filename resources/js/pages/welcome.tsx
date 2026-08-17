import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BoothMessage } from '@/components/booth/booth-message';
import { CameraPreview } from '@/components/booth/camera-preview';
import { CategoryPicker } from '@/components/booth/category-picker';
import { InputStatus } from '@/components/booth/input-status';
import { NavigationControls } from '@/components/booth/navigation-controls';
import { OrientationToggle } from '@/components/booth/orientation-toggle';
import { QrCodeRemote } from '@/components/booth/qrcode-remote';
import { RemoteControlPicker } from '@/components/booth/remote-control-picker';
import { useCamera } from '@/hooks/booth/use-camera';
import { useContentSync } from '@/hooks/booth/use-content-sync';
import { useDevice } from '@/hooks/booth/use-device';
import { useHandGesture } from '@/hooks/booth/use-hand-gesture';
import { usePersonDetection } from '@/hooks/booth/use-person-detection';
import { usePoseNavigation } from '@/hooks/booth/use-pose-navigation';
import { useRemoteControl } from '@/hooks/booth/use-remote-control';
import { useVoiceCommand } from '@/hooks/booth/use-voice-command';
import { useServiceWorker } from '@/hooks/use-pwa';
import type { BoothState, NavigationAction } from '@/lib/booth/navigation';
import { availableCategories } from '@/lib/booth/recommendation';
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

    const remote = useRemoteControl(
        settings.voice_enabled,
        settings.hand_gesture_enabled,
    );

    const [preferredCategoryId, setPreferredCategoryId] = useState<
        number | null
    >(null);

    const categories = useMemo(
        () => availableCategories(poses, detection.stableCount),
        [poses, detection.stableCount],
    );

    // A category that has nothing for the new group size falls back to "All"
    // rather than leaving the customer on an empty session.
    const categoryId =
        preferredCategoryId !== null &&
        categories.some((category) => category.id === preferredCategoryId)
            ? preferredCategoryId
            : null;

    const navigation = usePoseNavigation({
        poses,
        peopleCount: detection.stableCount,
        categoryId,
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
        enabled: remote.active === 'gesture' && cameraStatus === 'ready',
        confidence: settings.gesture_confidence,
        cooldownMs: settings.gesture_cooldown,
        onAction: handleGesture,
    });

    const voice = useVoiceCommand({
        enabled: remote.active === 'voice',
        language: settings.voice_language,
        confidence: settings.voice_confidence,
        onAction: handleVoice,
    });

    const [remoteToken, setRemoteToken] = useState<string | null>(null);

    // Generate a new token whenever someone steps into the booth.
    // If the count drops to 0, clear the token (invalidating the session).
    useEffect(() => {
        if (detection.stableCount > 0) {
            // Generate a random string for the session token
            setRemoteToken(Math.random().toString(36).substring(2, 10));
        } else {
            setRemoteToken(null);
        }
    }, [detection.stableCount]);

    // Poll for remote actions using the current token
    useEffect(() => {
        if (!remoteToken) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/remote/${remoteToken}/action`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.action) {
                        dispatch(data.action as NavigationAction, 'manual');
                    }
                }
            } catch (e) {
                // Ignore network errors on polling
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [remoteToken, dispatch]);

    const groupLabel = useMemo(() => {
        const configured = peopleCounts.find(
            (peopleCount) => peopleCount.count === detection.stableCount,
        );

        if (configured) {
            return configured.label;
        }

        return `${detection.stableCount} orang`;
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
                title: 'Izin kamera diperlukan',
                description:
                    'Izinkan akses kamera untuk mendeteksi jumlah orang.',
            };
        }

        if (cameraStatus === 'error') {
            return {
                title: 'Kamera tidak tersedia',
                description:
                    'Pastikan tidak ada aplikasi lain yang sedang memakai kamera.',
            };
        }

        if (detection.status === 'unavailable') {
            return {
                title: 'Deteksi orang tidak tersedia',
                description: settings.manual_navigation_enabled
                    ? 'Gunakan tombol di bawah untuk berpindah pose.'
                    : undefined,
            };
        }

        if (state === 'INITIALIZING') {
            return { title: 'Menyiapkan…' };
        }

        if (state === 'DETECTING') {
            return { title: 'Menunggu orang…' };
        }

        if (state === 'LOADING_RECOMMENDATIONS') {
            if (poses.length === 0 && syncStatus === 'syncing') {
                return { title: 'Memuat pose…' };
            }

            return categoryId === null
                ? {
                      title: 'Belum ada pose',
                      description: `Belum ada pose untuk ${groupLabel}.`,
                  }
                : {
                      title: 'Tidak ada pose di kategori ini',
                      description: 'Pilih kategori lain di atas.',
                  };
        }

        return null;
    };

    const boothMessage = message();

    const showingPose = state === 'SHOWING_POSE' && navigation.currentPose;

    return (
        <>
            <Head title="Booth" />

            <div className="booth-theme relative h-screen w-screen overflow-hidden bg-booth text-booth-foreground">
                {/* Full-screen pose image background */}
                {showingPose && (
                    <>
                        {/* Blurred ambient fill — covers empty space when the
                            pose is portrait on a landscape screen, or vice versa. */}
                        <img
                            src={navigation.currentPose.image_url}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
                        />

                        {/* Sharp pose image, always fully visible */}
                        <img
                            key={navigation.currentPose.id}
                            src={navigation.currentPose.image_url}
                            alt={navigation.currentPose.name}
                            className="absolute inset-0 h-full w-full animate-in object-contain duration-300 fade-in"
                        />
                    </>
                )}

                {/* Full-screen message when not showing a pose */}
                {boothMessage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BoothMessage
                            title={boothMessage.title}
                            description={boothMessage.description}
                        />
                    </div>
                )}

                {/* ---- All UI overlays on top ---- */}

                {/* Top bar: category picker + remote control */}
                <header className="absolute inset-x-0 top-0 z-10 flex flex-col items-start gap-2 p-3 landscape:flex-row landscape:items-start landscape:justify-between landscape:gap-3">
                    <CategoryPicker
                        categories={categories}
                        activeId={categoryId}
                        onSelect={setPreferredCategoryId}
                    />

                    {remote.isChoosable && (
                        <RemoteControlPicker
                            available={remote.available}
                            active={remote.active}
                            voiceLanguage={settings.voice_language}
                            onSelect={remote.choose}
                        />
                    )}

                    <div className="absolute right-6 top-6 flex flex-col gap-3">
                        <OrientationToggle />
                        <QrCodeRemote token={remoteToken} />
                    </div>
                </header>

                {/* Pose name + counter overlay (only when showing pose) */}
                {showingPose && (
                    <div className="absolute inset-x-0 bottom-0 z-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pt-20 pb-32 landscape:pb-20">
                        <div className="flex items-end justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-2xl leading-tight font-semibold tracking-tight text-white">
                                    {navigation.currentPose.name}
                                </h1>
                                {navigation.currentPose.instruction && (
                                    <p className="mt-0.5 line-clamp-1 text-base text-white/75">
                                        {navigation.currentPose.instruction}
                                    </p>
                                )}
                            </div>
                            <p className="shrink-0 font-mono text-lg tabular-nums text-white/80">
                                {navigation.index + 1} / {navigation.total}
                            </p>
                        </div>
                    </div>
                )}

                {/* Bottom bar: camera + status + nav buttons */}
                <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-3 landscape:flex-row landscape:items-end landscape:gap-3">
                    <CameraPreview
                        videoRef={videoRef}
                        cameraStatus={cameraStatus}
                        peopleCount={detection.stableCount}
                        handVisible={gesture.handVisible}
                        swipeProgress={gesture.progress}
                        showHandState={remote.active === 'gesture'}
                    />

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between gap-3">
                            <InputStatus
                                remote={remote.active}
                                voiceStatus={voice.status}
                                voiceRetry={voice.retry}
                                voiceLastHeardAt={voice.lastHeardAt}
                                voiceLanguage={settings.voice_language}
                                gestureStatus={gesture.status}
                                handVisible={gesture.handVisible}
                                gestureLastSwipeAt={gesture.lastSwipeAt}
                            />

                            <span className="shrink-0 text-xs text-booth-muted">
                                {syncStatus === 'offline'
                                    ? 'Offline'
                                    : groupLabel}
                            </span>
                        </div>

                        {settings.manual_navigation_enabled && (
                            <NavigationControls
                                onAction={handleManual}
                                disabled={navigation.total === 0}
                            />
                        )}
                    </div>
                </div>

                {updateAvailable && (
                    <div className="absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-booth-border bg-booth-surface/90 px-4 py-2 backdrop-blur-sm">
                        <span className="text-sm">Versi baru tersedia.</span>
                        <button
                            type="button"
                            onClick={applyUpdate}
                            className="rounded-md bg-booth-accent px-3 py-1.5 text-sm font-medium text-booth-accent-foreground"
                        >
                            Perbarui
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
