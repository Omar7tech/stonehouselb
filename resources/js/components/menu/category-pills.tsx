import { StretchText } from '@/components/stretch';
import { useDragScroll } from '@/lib/use-drag-scroll';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * Category filter. Every pill carries the brand orange, as in the design, so
 * the selected one is marked by a ring and a lift rather than by colour — the
 * row keeps its stripe of orange either way.
 *
 * The row is a plain scroll container rather than a carousel, because
 * `scroll-fade-x` is driven by the element's own scroll position: it needs
 * something that actually scrolls, which a transform-based carousel is not.
 * The fade tracks that position, so the edge with more pills behind it is the
 * edge that softens.
 */
export function CategoryPills({
    categories,
    activeId,
    onSelect,
}: {
    categories: readonly Category[];
    activeId: number;
    onSelect: (id: number) => void;
}) {
    const { ref, dragHandlers } = useDragScroll<HTMLDivElement>();

    return (
        // Pulled out through the panel's padding so the row owns the full width
        // of its section: pills run to the panel's edges and fade out there,
        // instead of stopping short inside it. The padding puts the same
        // distance back at either end, so the first pill still lines up with
        // the products below.
        <div
            ref={ref}
            {...dragHandlers}
            // `scroll-fade-4` pins the fade to 16px. Left alone it is 12% of
            // the row's width, which on a phone eats most of a pill.
            className="-mx-4 no-scrollbar scroll-fade-x cursor-grab overflow-x-auto px-4 py-2 select-none scroll-fade-4 active:cursor-grabbing"
        >
            {/* `w-max` so the row is as wide as its pills, which is what makes
                the trailing padding reachable at the end of the scroll. */}
            <ul className="flex w-max gap-2">
                {categories.map((category) => {
                    const isActive = category.id === activeId;

                    return (
                        <li key={category.id}>
                            <button
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => onSelect(category.id)}
                                className={cn(
                                    'rounded-full bg-primary px-4 py-2 font-display text-xs whitespace-nowrap text-primary-foreground uppercase',
                                    'transition-shadow duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                                    isActive
                                        ? 'shadow-md ring-2 ring-primary/35 ring-offset-2 ring-offset-surface'
                                        : 'opacity-90 hover:opacity-100',
                                )}
                            >
                                {/* Ligatures off: a category named Grills or
                                    Coffee would otherwise widen its own
                                    doubled letter. */}
                                <StretchText>{category.name}</StretchText>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
