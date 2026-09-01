import { ArrowUpRight } from 'lucide-react';

import { CategoryArt } from '@/components/menu/category-art';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * One category as a full-width band: the name large on the left, the art large
 * on the right, half of it hanging off the edge of the slab.
 *
 * The opposite trade from the grid. A band gives a name the whole width of the
 * page, so "Burgers & Sandwiches" is read at a glance rather than wrapped to
 * two lines at a third the size — and there is room left over to say how many
 * dishes are inside, which a square box has nowhere to put.
 *
 * The cost is that fewer fit on a screen, so a long menu is a scroll rather
 * than a wall. That is the choice the setting exists to make.
 */
export function CategoryRow({
    category,
    onSelect,
}: {
    category: Category;
    onSelect: (id: number) => void;
}) {
    const count = category.products.length;

    return (
        <button
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
                'group relative flex h-28 w-full items-center overflow-hidden rounded-3xl bg-primary pl-5 text-left text-primary-foreground sm:h-32 sm:pl-7',
                'shadow-[0_2px_8px_rgb(249_159_62/0.3)] hover:shadow-[0_12px_24px_rgb(249_159_62/0.42)]',
                // Slides toward the reader rather than lifting: a wide band that
                // rises reads as peeling off the page, where a short one reads
                // as picked up.
                'transition-[translate,scale,box-shadow] duration-300 ease-out hover:translate-x-1 active:translate-x-0 active:scale-[0.99] motion-reduce:translate-none motion-reduce:scale-100',
                'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
            )}
        >
            {/* `min-w-0` so the name clips inside its own column rather than
                shoving the art off the end of the band. */}
            <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-1 py-4">
                <span className="line-clamp-2 text-lg leading-tight font-semibold tracking-wide text-balance uppercase sm:text-2xl">
                    {category.name}
                </span>

                {/* The one thing a band can say that a box cannot. Held back to
                    a tint of the slab's own white so it reads as a note under
                    the name rather than a second heading. */}
                <span className="inline-flex items-center gap-1.5 text-[0.7rem] tracking-wide text-primary-foreground/70 uppercase">
                    {count === 1 ? '1 dish' : `${count} dishes`}
                    <ArrowUpRight
                        aria-hidden
                        className="size-3.5 transition-[translate] duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:translate-none"
                        strokeWidth={2.5}
                    />
                </span>
            </span>

            {/* Deliberately wider than the room left for it and pushed past the
                right edge: the art is cropped by the band rather than fitted
                into it, which is what makes the row read as a strip cut from
                something larger. `-mr` rather than `translate` so the crop is
                the layout's, and nothing has to be reserved for it. */}
            <span
                aria-hidden
                className="relative -mr-6 flex h-full w-32 shrink-0 items-center justify-center sm:-mr-4 sm:w-44"
            >
                <CategoryArt
                    category={category}
                    className="max-h-[85%]"
                    logoClassName="w-full"
                    imageClassName="aspect-square w-full"
                />
            </span>
        </button>
    );
}
