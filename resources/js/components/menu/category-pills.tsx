import { LayoutGrid } from 'lucide-react';

import { StretchText } from '@/components/stretch';
import { useDragScroll } from '@/lib/use-drag-scroll';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * Category filter, shown once a category is open: a button back to the boxes,
 * then one pill per category. Every pill carries the brand orange, as in the
 * design, so the selected one is marked by a ring and a lift rather than by
 * colour — the row keeps its stripe of orange either way.
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
    onClear,
}: {
    categories: readonly Category[];
    activeId: number;
    onSelect: (id: number) => void;
    /** Returns to the category boxes. */
    onClear: () => void;
}) {
    const { ref, dragHandlers } = useDragScroll<HTMLDivElement>();

    return (
        // The way back sits outside the scroller, so it stays put while the
        // pills travel under it rather than scrolling away with them.
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onClear}
                aria-label="Back to all categories"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 ease-out hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <LayoutGrid className="size-4" />
            </button>

            {/* Pulled out through the panel's padding on the trailing side, so
                the pills run to the panel's edge and fade out there instead of
                stopping short inside it. The padding puts that distance back,
                so the last pill is still reachable at the end of the scroll.
                The leading edge stays put — the button is already standing
                there. */}
            <div
                ref={ref}
                {...dragHandlers}
                // `scroll-fade-4` pins the fade to 16px. Left alone it is 12% of
                // the row's width, which on a phone eats most of a pill.
                className="-mr-3 no-scrollbar min-w-0 flex-1 scroll-fade-x cursor-grab overflow-x-auto py-2 pr-3 select-none scroll-fade-4 active:cursor-grabbing"
            >
                {/* `w-max` so the row is as wide as its pills, which is what
                    makes the trailing padding reachable at the end of the
                    scroll. */}
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
                                        'rounded-full px-4 py-2 font-display text-xs whitespace-nowrap uppercase',
                                        'transition-colors duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                                        // The selected one is the only pill
                                        // filled with the brand orange; the
                                        // rest are the same orange held back to
                                        // a tint. Weight carries the state, not
                                        // a ring around it, so which category is
                                        // open reads at a glance from across the
                                        // row.
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-primary/10 text-primary hover:bg-primary/20',
                                    )}
                                >
                                    {/* Ligatures off: a category named Grills
                                        or Coffee would otherwise widen its own
                                        doubled letter. */}
                                    <StretchText>{category.name}</StretchText>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
