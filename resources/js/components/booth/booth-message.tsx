/**
 * Full screen message for every state that is not a pose: waiting, loading and
 * the recoverable errors. The booth never shows a blank screen.
 */
export function BoothMessage({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-4xl font-semibold tracking-tight text-booth-foreground">
                {title}
            </p>
            {description && (
                <p className="max-w-2xl text-2xl text-booth-muted">
                    {description}
                </p>
            )}
        </div>
    );
}
