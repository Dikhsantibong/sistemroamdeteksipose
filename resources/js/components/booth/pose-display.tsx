import type { BoothPose } from '@/types';

/**
 * The pose the customer is looking at, plus their position in the session.
 *
 * Type is deliberately large: the tablet sits next to the camera and is read
 * from a few metres away.
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
        <div className="flex h-full w-full items-center gap-8">
            <div className="flex h-full flex-1 items-center justify-center">
                <img
                    key={pose.id}
                    src={pose.image_url}
                    alt={pose.name}
                    className="max-h-full max-w-full rounded-lg object-contain"
                />
            </div>

            <div className="flex w-2/5 max-w-md flex-col gap-6">
                <p className="font-mono text-2xl text-neutral-400 tabular-nums">
                    {index + 1} / {total}
                </p>

                <h1 className="text-4xl leading-tight font-semibold tracking-tight">
                    {pose.name}
                </h1>

                {pose.instruction && (
                    <p className="text-2xl leading-relaxed text-neutral-300">
                        {pose.instruction}
                    </p>
                )}
            </div>
        </div>
    );
}
