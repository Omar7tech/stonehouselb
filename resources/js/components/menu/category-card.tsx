import { ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/** The mark's own proportions, taken from the artwork's viewBox. */
const LOGO_ASPECT = '291.18 / 118.35';

/**
 * The wordmark painted in the box's own foreground colour.
 *
 * The file is brand orange, which is the box, so it cannot be dropped in as an
 * image here. Masking a white sheet with it keeps the artwork exactly and lets
 * the colour come from the page — the same trick the footer's knockout uses,
 * the other way round.
 */
const LOGO_MASK = {
    maskImage: "url('/logos/logo.svg')",
    WebkitMaskImage: "url('/logos/logo.svg')",
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
} satisfies CSSProperties;

/**
 * A dome of light over the top of the slab, so the orange reads as a lit object
 * standing on the panel rather than as a flat swatch cut out of it.
 *
 * Kept faint on purpose: the brand orange is the whole point of these boxes, and
 * a gradient strong enough to notice would be a second colour.
 */
const SLAB_SHEEN =
    'bg-[radial-gradient(120%_85%_at_50%_-15%,rgb(255_255_255/0.3),transparent_62%)]';

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
            <span aria-hidden className={cn('absolute inset-0', SLAB_SHEEN)} />

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
                {category.image === null ? (
                    /* No art yet, so the box carries the house mark instead of a
                       hole. It keeps the logo's own ratio rather than the square
                       the photos get — stretched, the wordmark stops being it. */
                    <span
                        aria-hidden
                        style={{ ...LOGO_MASK, aspectRatio: LOGO_ASPECT }}
                        className="max-h-full w-3/4 bg-primary-foreground transition-[scale] duration-300 ease-out group-hover:scale-105 motion-reduce:scale-100"
                    />
                ) : (
                    /* Category art is cut out on a transparent background, so it
                       sits whole inside its box rather than being cropped. */
                    <img
                        src={category.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="aspect-square max-h-full w-[68%] max-w-32 object-contain drop-shadow-[0_3px_6px_rgb(0_0_0/0.14)] transition-[scale] duration-300 ease-out group-hover:scale-105 motion-reduce:scale-100"
                    />
                )}
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
