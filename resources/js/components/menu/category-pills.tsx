import useEmblaCarousel from 'embla-carousel-react';

import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * Category filter. Every pill carries the brand orange, as in the design, so
 * the selected one is marked by a ring and a lift rather than by colour — the
 * row keeps its stripe of orange either way.
 *
 * The row is an Embla carousel in free-drag mode, so it can be dragged with a
 * mouse as well as a finger and comes to rest wherever it is let go.
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
    const [emblaRef] = useEmblaCarousel({
        dragFree: true,
        align: 'start',
        containScroll: 'trimSnaps',
    });

    return (
        // The row bleeds into the panel's gutter so the active pill's ring and
        // its offset — 4px beyond the pill — aren't cut off by the viewport's
        // own clipping at either end.
        <div
            ref={emblaRef}
            className="-mx-2 overflow-hidden px-2 py-2 select-none"
        >
            <ul className="-ml-2 flex">
                {categories.map((category, index) => {
                    const isActive = category.id === activeId;

                    return (
                        <li
                            key={category.id}
                            className={cn(
                                'shrink-0 pl-2',
                                // The trailing gutter has to sit inside the
                                // last pill: Embla measures its scroll limit
                                // from the slides, so padding on the track
                                // would never be reachable.
                                index === categories.length - 1 && 'pr-2',
                            )}
                        >
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
                                {category.name}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
