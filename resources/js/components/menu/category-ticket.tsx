import type { CSSProperties } from 'react';

import { CategoryArt } from '@/components/menu/category-art';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * The bars on the stub. Two gradients of different periods laid over each
 * other, so the widths fall irregularly the way a real code's do — one repeat
 * on its own comes out as even hatching, which reads as a texture rather than
 * as printing.
 *
 * `currentColor`, so it inherits whatever the stub's text is set to and there
 * is no second place holding the slab's foreground colour.
 */
const BARCODE = {
    backgroundImage:
        'repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 4px), repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 9px)',
} satisfies CSSProperties;

/**
 * One category as a kitchen ticket: the dish printed on the body, the name on
 * the stub below the tear.
 *
 * The shape does the work here rather than the colour. A grid of squares is
 * read as a grid; the same slab with two notches bitten out of its sides and a
 * dashed line between them is read as a thing you tear off and hand over, which
 * is exactly what choosing a category does.
 *
 * The notches are circles of the panel's own colour sitting half outside the
 * ticket, so the slab's `overflow-hidden` crops each to the semicircle that
 * lands inside it. They are a hole in the paper, not a mark printed on it —
 * which means they hold up against whatever the panel behind them is.
 */
export function CategoryTicket({
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
                'group relative flex aspect-[4/5] flex-col overflow-hidden rounded-2xl bg-primary text-primary-foreground',
                'shadow-[0_2px_8px_rgb(249_159_62/0.3)] hover:shadow-[0_12px_24px_rgb(249_159_62/0.42)]',
                // Lifts and tilts, the way a slip of paper comes off a spike.
                // `rotate` is named in the transition because Tailwind v4 sets
                // it as its own property rather than folding it into a
                // transform, so a list that says `transform` animates nothing.
                'transition-[translate,rotate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:-rotate-2 active:translate-y-0 active:rotate-0 motion-reduce:translate-none motion-reduce:rotate-none',
                'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
            )}
        >
            {/* `min-h-0` so the art gives its height up to a two-line name
                rather than pushing the stub off the foot of the ticket. */}
            <span className="relative flex min-h-0 flex-1 items-center justify-center p-3">
                <CategoryArt
                    category={category}
                    className="max-h-full"
                    logoClassName="w-4/5"
                    imageClassName="aspect-square w-[76%] max-w-28"
                />
            </span>

            {/* The tear. The rule is inset from both ends so it runs between
                the notches instead of into them. */}
            <span aria-hidden className="relative block">
                <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-surface" />
                <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-surface" />
                <span className="mx-3.5 block border-t border-dashed border-primary-foreground/45" />
            </span>

            <span className="relative flex shrink-0 flex-col items-center gap-1.5 px-3 pt-2.5 pb-3">
                <span className="line-clamp-2 text-center text-xs leading-tight font-semibold tracking-wide text-balance uppercase sm:text-sm">
                    {category.name}
                </span>

                {/* Decorative, and the detail that settles what the shape is:
                    a notched slab could be a label, but a notched slab with a
                    code on the stub is a ticket. */}
                <span
                    aria-hidden
                    style={BARCODE}
                    className="h-2.5 w-3/5 opacity-35"
                />
            </span>
        </button>
    );
}
