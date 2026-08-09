import type { BoothPose } from '@/types';

/**
 * Client side mirror of the server recommendation engine.
 *
 * The booth keeps the full active pose list in IndexedDB so it can build a
 * session while offline. The rules match the server exactly: filter by group
 * size, shuffle, never repeat a pose, and stop at the configured count.
 */

/**
 * Fisher-Yates shuffle over a copy of the input.
 */
function shuffle<T>(items: T[]): T[] {
    const result = [...items];

    for (let index = result.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1));
        [result[index], result[swap]] = [result[swap], result[index]];
    }

    return result;
}

/**
 * Build a recommendation session for the given group size.
 *
 * When fewer poses exist than requested, the smaller set is returned: poses are
 * never duplicated to reach the target count.
 */
export function getRecommendations(
    poses: BoothPose[],
    peopleCount: number,
    limit: number,
): BoothPose[] {
    if (peopleCount < 1 || limit < 1) {
        return [];
    }

    const matching = poses.filter((pose) => pose.people_count === peopleCount);

    return shuffle(matching).slice(0, limit);
}

/**
 * Move within a session, wrapping around when looping is enabled.
 */
export function nextIndex(
    current: number,
    total: number,
    step: 1 | -1,
    loop: boolean,
): number {
    if (total === 0) {
        return 0;
    }

    const target = current + step;

    if (target >= total) {
        return loop ? 0 : total - 1;
    }

    if (target < 0) {
        return loop ? total - 1 : 0;
    }

    return target;
}
