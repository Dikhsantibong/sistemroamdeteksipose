import type { BoothPose } from '@/types';

/**
 * The pose the customer is looking at, plus their position in the session.
 *
 * Optimised for a 10-inch landscape tablet: the image fills the entire
 * available area and the metadata is overlaid at the bottom so nothing
 * competes for space with the photo.
 */
export function PoseDisplay({
    pose,
    index,
    total,
}: {
    pose: BoothPose;
    index: number;
    total: number;
}) {
    return (
        <div className="relative flex h-full w-full items-center justify-center">
            <img
                key={pose.id}
                src={pose.image_url}
                alt={pose.name}
                className="max-h-full max-w-full rounded-xl object-contain"
            />

            {/* Overlay with pose info at bottom */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 rounded-b-xl bg-gradient-to-t from-black/70 via-black/40 to-transparent px-6 pt-16 pb-5 text-white">
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-3xl leading-tight font-semibold tracking-tight">
                        {pose.name}
                    </h1>

                    {pose.instruction && (
                        <p className="mt-1 line-clamp-2 text-xl leading-snug text-white/80">
                            {pose.instruction}
                        </p>
                    )}
                </div>

                <p className="shrink-0 font-mono text-2xl tabular-nums text-white/90">
                    {index + 1} / {total}
                </p>
            </div>
        </div>
    );
}

