type Category = { id: number; name: string };

/**
 * Switch the recommendations to another category mid session.
 *
 * The list is derived from the poses that exist for the current group size, so
 * every chip leads somewhere. Chips stay small and stay in the header: the pose
 * photo is what the customer should be looking at.
 */
export function CategoryPicker({
    categories,
    activeId,
    onSelect,
}: {
    categories: Category[];
    activeId: number | null;
    onSelect: (categoryId: number | null) => void;
}) {
    if (categories.length === 0) {
        return null;
    }

    const chip = (isActive: boolean) =>
        `shrink-0 rounded-full border px-4 py-1.5 text-base transition-colors ${
            isActive
                ? 'border-booth-accent bg-booth-accent text-booth-accent-foreground'
                : 'border-booth-border text-booth-muted hover:text-booth-foreground'
        }`;

    return (
        <div
            className="flex max-w-full items-center gap-2 overflow-x-auto"
            role="group"
            aria-label="Kategori pose"
        >
            <button
                type="button"
                className={chip(activeId === null)}
                aria-pressed={activeId === null}
                onClick={() => onSelect(null)}
            >
                Semua
            </button>

            {categories.map((category) => (
                <button
                    key={category.id}
                    type="button"
                    className={chip(activeId === category.id)}
                    aria-pressed={activeId === category.id}
                    onClick={() => onSelect(category.id)}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}
