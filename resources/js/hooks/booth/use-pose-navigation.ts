import { useCallback, useState } from 'react';
import type {
    NavigationAction,
    NavigationSource,
} from '@/lib/booth/navigation';
import { getRecommendations, nextIndex } from '@/lib/booth/recommendation';
import type { BoothPose } from '@/types';

type Options = {
    poses: BoothPose[];
    peopleCount: number;
    categoryId: number | null;
    recommendationCount: number;
    loop: boolean;
};

type Session = {
    poses: BoothPose[];
    peopleCount: number;
    categoryId: number | null;
    limit: number;
    items: BoothPose[];
    index: number;
    lastSource: NavigationSource | null;
};

function startSession(
    poses: BoothPose[],
    peopleCount: number,
    categoryId: number | null,
    limit: number,
): Session {
    return {
        poses,
        peopleCount,
        categoryId,
        limit,
        items: getRecommendations(poses, peopleCount, limit, categoryId),
        index: 0,
        lastSource: null,
    };
}

/**
 * The single navigation controller every input method talks to.
 *
 * Gestures, voice and the manual buttons all call `dispatch`. Nothing else in
 * the booth is allowed to change the current pose, which keeps the three input
 * methods behaving identically and makes a fourth one trivial to add.
 */
export function usePoseNavigation({
    poses,
    peopleCount,
    categoryId,
    recommendationCount,
    loop,
}: Options) {
    const [session, setSession] = useState<Session>(() =>
        startSession(poses, peopleCount, categoryId, recommendationCount),
    );

    // A new group size, a new category or a content sync starts a fresh session
    // on the first pose. Adjusting state during render is the documented way to
    // reset derived state when the inputs change.
    if (
        session.poses !== poses ||
        session.peopleCount !== peopleCount ||
        session.categoryId !== categoryId ||
        session.limit !== recommendationCount
    ) {
        setSession(
            startSession(poses, peopleCount, categoryId, recommendationCount),
        );
    }

    const dispatch = useCallback(
        (action: NavigationAction, source: NavigationSource) => {
            setSession((current) => ({
                ...current,
                lastSource: source,
                index: nextIndex(
                    current.index,
                    current.items.length,
                    action === 'NEXT_POSE' ? 1 : -1,
                    loop,
                ),
            }));
        },
        [loop],
    );

    return {
        session: session.items,
        index: session.index,
        currentPose: session.items[session.index] ?? null,
        total: session.items.length,
        lastSource: session.lastSource,
        dispatch,
    };
}
