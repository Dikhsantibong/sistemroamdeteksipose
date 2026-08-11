import { Head } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { BoothMessage } from '@/components/booth/booth-message';
import { CameraPreview } from '@/components/booth/camera-preview';
import { CategoryPicker } from '@/components/booth/category-picker';
import { InputStatus } from '@/components/booth/input-status';
import { NavigationControls } from '@/components/booth/navigation-controls';
import { PoseDisplay } from '@/components/booth/pose-display';
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

    return (
        <>
            <Head title="Booth" />

            <div className="booth-theme flex h-screen w-screen flex-col overflow-hidden bg-booth p-5 text-booth-foreground">
                <header className="flex shrink-0 items-start justify-between gap-6">
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
                </header>

                {/* Keyed on the session inputs so a new set fades in instead of
                    swapping abruptly. */}
                <main
                    key={`${detection.stableCount}-${categoryId ?? 'all'}`}
                    className="min-h-0 flex-1 animate-in py-3 duration-500 fade-in"
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

                <div className="flex shrink-0 items-end justify-between gap-6 pb-2">
                    <CameraPreview
                        videoRef={videoRef}
                        cameraStatus={cameraStatus}
                        peopleCount={detection.stableCount}
                        handVisible={gesture.handVisible}
                        swipeProgress={gesture.progress}
                        showHandState={remote.active === 'gesture'}
                    />

                    <div className="flex flex-1 items-center justify-between gap-6">
                        <InputStatus
                            remote={remote.active}
                            voiceStatus={voice.status}
                            voiceLastHeardAt={voice.lastHeardAt}
                            voiceLanguage={settings.voice_language}
                            gestureStatus={gesture.status}
                            handVisible={gesture.handVisible}
                            gestureLastSwipeAt={gesture.lastSwipeAt}
                        />

                        <span className="text-base text-booth-muted">
                            {syncStatus === 'offline'
                                ? 'Mode offline — memakai pose tersimpan'
                                : groupLabel}
                        </span>
                    </div>
                </div>

                {settings.manual_navigation_enabled && (
                    <NavigationControls
                        onAction={handleManual}
                        disabled={navigation.total === 0}
                    />
                )}

                {updateAvailable && (
                    <div className="absolute right-8 bottom-8 flex items-center gap-4 rounded-lg border border-booth-border bg-booth-surface px-6 py-4">
                        <span className="text-lg">Versi baru tersedia.</span>
                        <button
                            type="button"
                            onClick={applyUpdate}
                            className="rounded-md bg-booth-accent px-4 py-2 text-lg font-medium text-booth-accent-foreground"
                        >
                            Perbarui Sekarang
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
