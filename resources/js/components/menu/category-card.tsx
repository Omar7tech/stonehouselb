import { ArrowUpRight } from 'lucide-react';

import { CategoryArt } from '@/components/menu/category-art';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * One category box: its art above its name on a slab of the brand orange.
 *
 * Square, so a row of them reads as a grid of equals however long the names
 * are — and the name is pinned to the foot rather than floated under the art,
 * so a two-line name drops a second line instead of shunting its picture up out
 * of line with the boxes either side of it.
 *
 * Hovering lifts the box and deepens the warm shadow under it; pressing sets it
 * back down. The colours stay put, since the orange is the point.
 */
export function CategoryCard({
    category,
    onSelect,
}: {
    category: Category;
    onSelect: (id: number) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
                'group relative flex aspect-square flex-col overflow-hidden rounded-3xl bg-primary p-3 text-primary-foreground sm:p-3.5',
                // Tinted with the slab's own orange rather than black: a grey
                // shadow under a warm colour on a near-white panel reads as
                // grime, where the colour's own shadow reads as light.
                'shadow-[0_2px_8px_rgb(249_159_62/0.3)] hover:shadow-[0_12px_24px_rgb(249_159_62/0.42)]',
                // Tailwind v4 lifts and scales with the standalone `translate`
                // and `scale` properties, not `transform`, so those are what
                // has to be named here or the movement lands in one frame.
                'transition-[translate,scale,box-shadow] duration-300 ease-out hover:-translate-y-1 active:translate-y-0 active:scale-[0.97] motion-reduce:translate-none motion-reduce:scale-100',
                // Offset, or the ring is drawn on the orange it is meant to be
                // distinguishable from.
                'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
            )}
        >
            {/* Leans out of the corner as the box lifts, the same direction the
                footer's arrows travel. */}
            <ArrowUpRight
                aria-hidden
                className="absolute top-2.5 right-2.5 size-4 text-primary-foreground/55 transition-[translate,color] duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-foreground motion-reduce:translate-none"
                strokeWidth={2.5}
            />

            {/* The art takes whatever height the name leaves, and stays centred
                in it. `min-h-0` so it gives that height up rather than pushing
                the name off the bottom of the square. */}
            <span className="relative flex min-h-0 flex-1 items-center justify-center">
                <CategoryArt
                    category={category}
                    className="max-h-full"
                    logoClassName="w-3/4"
                    imageClassName="aspect-square w-[68%] max-w-32"
                />
            </span>

            {/* Body face, not the display one: category names are read at a
                third of the row's width, and StretchPro is too wide to hold
                "Burgers & Sandwiches" anywhere near legibly.

                White on the brand orange is a soft contrast, so the size and the
                letter-spacing are doing legibility work here, not decoration.
                `text-balance` keeps a two-line name from breaking to a single
                orphaned word. */}
            <span className="relative mt-2 line-clamp-2 text-center text-sm leading-tight font-semibold tracking-wide text-balance uppercase sm:text-base">
                {category.name}
            </span>
        </button>
    );
}
