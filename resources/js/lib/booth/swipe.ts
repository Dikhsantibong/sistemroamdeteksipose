/**
 * Swipe detection over a short trail of hand positions.
 *
 * The hard part is that the customer's distance from the tablet is unknown and
 * changes constantly. Someone an arm's length away sweeps across half the
 * frame; someone three metres back covers a tenth of it doing the same gesture.
 * A fixed distance threshold is therefore either impossible to trigger from far
 * away or fires on every twitch up close.
 *
 * The threshold is instead expressed as a multiple of the hand's own width,
 * which shrinks with distance in exactly the same proportion. "Move your hand
 * a couple of hand-widths sideways" holds true wherever the customer stands.
 */

export type SwipeSample = {
    /** Palm centre, 0 (image left) to 1 (image right). */
    x: number;
    /** Palm centre, 0 (image top) to 1 (image bottom). */
    y: number;
    /** Width of the hand in the same normalised units. */
    span: number;
    /** Timestamp in milliseconds. */
    at: number;
};

export type SwipeDirection = 'left' | 'right';

export type SwipeOptions = {
    /** How many hand-widths the palm must travel. */
    travelRatio: number;
    /** Floor for the threshold, so a tiny hand cannot fire on noise. */
    minimumTravel: number;
    /**
     * Ceiling for the threshold. A customer close to the tablet has a large
     * hand in frame, and without a cap the gesture would grow into a sweep
     * across half the screen.
     */
    maximumTravel: number;
    /** A swipe slower than this is drifting, not gesturing. */
    maximumDurationMs: number;
};

/**
 * Fraction of consecutive steps that must agree with the overall direction.
 *
 * Now that only the flick itself is judged rather than the whole window, this
 * can be strict: a genuine sweep moves one way throughout, while a customer
 * waving hello reverses direction and must not page through poses.
 */
const CONSISTENCY_SHARE = 0.75;

/** Fewer samples than this cannot describe a movement. */
const MINIMUM_SAMPLES = 3;

/**
 * Append a sample and drop everything older than the detection window.
 */
export function pushSwipeSample(
    trail: SwipeSample[],
    sample: SwipeSample,
    windowMs: number,
): SwipeSample[] {
    return [...trail, sample].filter(
        (entry) => sample.at - entry.at <= windowMs,
    );
}

/**
 * The typical hand width across the trail.
 *
 * The median rather than the mean: one badly tracked frame can report a hand
 * twice its real size and would otherwise raise the bar for the whole gesture.
 */
function medianSpan(trail: SwipeSample[]): number {
    const spans = trail.map((entry) => entry.span).sort((a, b) => a - b);

    return spans[Math.floor(spans.length / 2)];
}

/**
 * How far the current movement has got towards triggering, from 0 to 1.
 *
 * Purely for feedback: a swipe that does not register is otherwise silent, and
 * there is no way for a customer to tell "not moving far enough" from "not
 * being tracked at all".
 */
export function swipeProgress(
    trail: SwipeSample[],
    options: SwipeOptions,
): number {
    if (trail.length < MINIMUM_SAMPLES) {
        return 0;
    }

    const last = trail[trail.length - 1];
    const required = Math.min(
        options.maximumTravel,
        Math.max(
            options.minimumTravel,
            medianSpan(trail) * options.travelRatio,
        ),
    );

    let furthest = 0;

    for (const sample of trail) {
        furthest = Math.max(furthest, Math.abs(last.x - sample.x));
    }

    return Math.min(1, furthest / required);
}

/**
 * Detect a swipe in the trail.
 *
 * Returns the direction the hand travelled across the *image*, or null when the
 * movement was too small, too slow or too erratic to be intentional.
 */
export function detectSwipe(
    trail: SwipeSample[],
    options: SwipeOptions,
): SwipeDirection | null {
    if (trail.length < MINIMUM_SAMPLES) {
        return null;
    }

    const last = trail[trail.length - 1];
    const required = Math.min(
        options.maximumTravel,
        Math.max(
            options.minimumTravel,
            medianSpan(trail) * options.travelRatio,
        ),
    );

    // Find the SHORTEST recent stretch that covers the required distance, by
    // walking backwards from the newest sample.
    //
    // Judging the whole trail was the flaw that made real swipes impossible: a
    // hand hovers in frame for most of the window and only flicks at the end,
    // so the stationary jitter beforehand dominated the direction check and
    // sank every gesture. A person does not sweep steadily for a full second;
    // they hold still, then flick.
    let start = -1;
    let travelled = 0;

    for (let index = trail.length - MINIMUM_SAMPLES; index >= 0; index--) {
        const distance = last.x - trail[index].x;

        if (Math.abs(distance) >= required) {
            start = index;
            travelled = distance;

            break;
        }
    }

    if (start < 0) {
        return null;
    }

    const segment = trail.slice(start);

    // A flick, not a slow drift across the frame.
    if (last.at - segment[0].at > options.maximumDurationMs) {
        return null;
    }

    const direction = Math.sign(travelled);
    let agreeing = 0;

    for (let index = 1; index < segment.length; index++) {
        const step = segment[index].x - segment[index - 1].x;

        // A stationary step is neutral rather than contradicting.
        if (step === 0 || Math.sign(step) === direction) {
            agreeing++;
        }
    }

    const steps = segment.length - 1;

    if (agreeing / steps < CONSISTENCY_SHARE) {
        return null;
    }

    return direction > 0 ? 'right' : 'left';
}
