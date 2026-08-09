/**
 * Temporal smoothing for the people counter.
 *
 * Detection runs continuously, also while a pose is on screen, so the count can
 * change at any moment. Two different thresholds keep that from being annoying:
 *
 *  - picking up a group that just walked in should feel immediate, and
 *  - swapping the recommendations of a group that is already posing must take
 *    real evidence, otherwise one arm leaving the frame restarts their session.
 */

/** Share of the window needed to accept a count when none is established yet. */
const ESTABLISH_SHARE = 0.6;

/** Share of the window needed to replace a count that is already established. */
const CHANGE_SHARE = 0.8;

/**
 * Append a sample and keep only the most recent `windowSize` entries.
 */
export function pushSample(
    samples: number[],
    sample: number,
    windowSize: number,
): number[] {
    return [...samples, sample].slice(-Math.max(1, windowSize));
}

/**
 * Resolve the stable people count from the recent samples.
 *
 * `currentCount` is the count the booth is already showing poses for. Passing it
 * applies the stricter threshold, so an established session is only replaced
 * when the new count dominates the window.
 *
 * Returns `null` while the window is not full or while no count is convincing
 * enough, meaning the caller should keep whatever it had.
 */
export function resolveStableCount(
    samples: number[],
    windowSize: number,
    currentCount: number | null = null,
): number | null {
    const size = Math.max(1, windowSize);

    if (samples.length < size) {
        return null;
    }

    const recent = samples.slice(-size);
    const tally = new Map<number, number>();

    for (const sample of recent) {
        tally.set(sample, (tally.get(sample) ?? 0) + 1);
    }

    let winner: number | null = null;
    let best = 0;

    for (const [count, occurrences] of tally) {
        if (occurrences > best) {
            winner = count;
            best = occurrences;
        }
    }

    if (winner === null) {
        return null;
    }

    if (winner === currentCount) {
        return winner;
    }

    // An empty frame is not an established session, so the first people to walk
    // in are picked up with the lower threshold.
    const isEstablished = currentCount !== null && currentCount > 0;
    const required = Math.ceil(
        size * (isEstablished ? CHANGE_SHARE : ESTABLISH_SHARE),
    );

    return best >= required ? winner : null;
}
