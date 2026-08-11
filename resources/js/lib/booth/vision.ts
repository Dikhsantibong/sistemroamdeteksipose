import {
    FilesetResolver,
    HandLandmarker,
    ObjectDetector,
} from '@mediapipe/tasks-vision';

/**
 * MediaPipe loaders for the booth.
 *
 * The wasm runtime and the model files are served from this application, not a
 * CDN, so detection keeps working once the booth loses its connection. Every
 * frame is processed on the device: nothing is uploaded and nothing is stored.
 */

const WASM_PATH = '/mediapipe/wasm';
const PERSON_MODEL = '/models/efficientdet_lite0.tflite';
const HAND_MODEL = '/models/hand_landmarker.task';

/** The label EfficientDet uses for a person. */
export const PERSON_CATEGORY = 'person';

let filesetPromise: Promise<
    Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>
> | null = null;

function vision() {
    filesetPromise ??= FilesetResolver.forVisionTasks(WASM_PATH);

    return filesetPromise;
}

/**
 * Create the detector used to count the people in front of the camera.
 */
export async function createPersonDetector(
    scoreThreshold: number,
): Promise<ObjectDetector> {
    return ObjectDetector.createFromOptions(await vision(), {
        baseOptions: { modelAssetPath: PERSON_MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        scoreThreshold,
        categoryAllowlist: [PERSON_CATEGORY],
        maxResults: 20,
    });
}

/**
 * Create the detector used to read swipe gestures.
 *
 * Both hands are tracked so the customer can wave with either one. Presence and
 * tracking run at a lower bar than first detection: once a hand is found it
 * should stay tracked through a fast swipe, which is exactly when landmark
 * confidence dips.
 */
export async function createHandLandmarker(
    confidence: number,
): Promise<HandLandmarker> {
    const options = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: { modelAssetPath: HAND_MODEL, delegate },
        runningMode: 'VIDEO' as const,
        numHands: 2,
        minHandDetectionConfidence: confidence,
        minHandPresenceConfidence: Math.max(0.3, confidence - 0.2),
        minTrackingConfidence: Math.max(0.3, confidence - 0.2),
    });

    const fileset = await vision();

    try {
        return await HandLandmarker.createFromOptions(fileset, options('GPU'));
    } catch {
        // Person detection already holds a GPU context, and some Android
        // drivers refuse a second one. CPU is slower but the hand model is
        // small, and a working gesture beats no gesture.
        return HandLandmarker.createFromOptions(fileset, options('CPU'));
    }
}
