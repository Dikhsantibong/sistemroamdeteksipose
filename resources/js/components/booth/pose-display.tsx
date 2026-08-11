import type { BoothPose } from '@/types';

/**
 * The pose the customer is looking at, plus their position in the session.
 *
 * Optimised for a 10-inch landscape tablet: the image fills the entire
 * available area. The metadata overlay is anchored to the image itself
 * (not the outer container) so it never floats below the photo.
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
        <div className="flex h-full w-full items-center justify-center">
            {/* inline-block wrapper shrink-wraps the image so the overlay
                stays flush against the photo regardless of aspect ratio. */}
            <div className="relative inline-block max-h-full max-w-full">
                <img
                    key={pose.id}
                    src={pose.image_url}
                    alt={pose.name}
                    className="block max-h-[calc(100vh-13rem)] w-auto rounded-xl object-contain"
                />

                {/* Overlay anchored to actual image bounds */}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 rounded-b-xl bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pt-10 pb-3 text-white">
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-2xl leading-tight font-semibold tracking-tight">
                            {pose.name}
                        </h1>

                        {pose.instruction && (
                            <p className="mt-0.5 line-clamp-1 text-base leading-snug text-white/80">
                                {pose.instruction}
                            </p>
                        )}
                    </div>

                    <p className="shrink-0 font-mono text-lg tabular-nums text-white/90">
                        {index + 1} / {total}
                    </p>
                </div>
            </div>
        </div>
    );
}

