import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * Category filter. Every pill carries the brand orange, as in the design, so
 * the selected one is marked by a ring and a lift rather than by colour — the
 * row keeps its stripe of orange either way.
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
    return (
        <ul className="-mx-1 flex [scrollbar-width:none] gap-2 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
                const isActive = category.id === activeId;

                return (
                    <li key={category.id} className="shrink-0">
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
    );
}
