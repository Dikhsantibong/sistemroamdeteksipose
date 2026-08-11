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
 * `categoryId` narrows the set further; null means every category. When fewer
 * poses exist than requested, the smaller set is returned: poses are never
 * duplicated to reach the target count.
 */
export function getRecommendations(
    poses: BoothPose[],
    peopleCount: number,
    limit: number,
    categoryId: number | null = null,
): BoothPose[] {
    if (peopleCount < 1 || limit < 1) {
        return [];
    }

    const matching = poses.filter(
        (pose) =>
            pose.people_count === peopleCount &&
            (categoryId === null || pose.category?.id === categoryId),
    );

    return shuffle(matching).slice(0, limit);
}

/**
 * List the categories that actually have poses for the given group size.
 *
 * Deriving the list from the poses rather than the category table means the
 * booth never offers a category that would come back empty.
 */
export function availableCategories(
    poses: BoothPose[],
    peopleCount: number,
): { id: number; name: string }[] {
    const found = new Map<number, string>();

    for (const pose of poses) {
        if (pose.people_count !== peopleCount || pose.category === null) {
            continue;
        }

        found.set(pose.category.id, pose.category.name);
    }

    return [...found.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
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
