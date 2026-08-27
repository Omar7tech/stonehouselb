import { ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';

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
 * One category box: its art above its name on a slab of the brand orange.
 *
 * Square, so a row of them reads as a grid of equals however long the names
 * are. Hovering lifts the box and pushes the art a little further — the colours
 * stay put, since the orange is the point.
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
            className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary p-2.5 text-primary-foreground transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transform-none sm:gap-2.5 sm:p-3"
        >
            <ArrowUpRight
                aria-hidden
                className="absolute top-2 right-2 size-3.5 text-primary-foreground/50 sm:size-4"
            />

            {category.image === null ? (
                /* No art yet, so the box carries the house mark instead of a
                   hole. It keeps the logo's own ratio rather than the square
                   the photos get — stretched, the wordmark stops being it. */
                <span
                    aria-hidden
                    style={{ ...LOGO_MASK, aspectRatio: LOGO_ASPECT }}
                    className="w-3/4 bg-primary-foreground transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none"
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
                    className="aspect-square w-3/5 max-w-28 object-contain transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none"
                />
            )}

            {/* Body face, not the display one: category names are read at a
                third of the row's width, and StretchPro is too wide to hold
                "Burgers & Sandwiches" anywhere near legibly. */}
            <span className="line-clamp-2 text-center text-[0.7rem] leading-tight font-semibold uppercase sm:text-sm">
                {category.name}
            </span>
        </button>
    );
}
