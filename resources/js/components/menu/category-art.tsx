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
 * A category's picture, or the house mark when it has none.
 *
 * Shared by all three layouts: the fallback is the same decision every time —
 * a category with no art yet carries the wordmark rather than a hole — and the
 * mask trick behind it is not worth writing out three times.
 *
 * Sizing belongs to the caller, since a square box, a full-width band and a
 * bento tile all want the art at different scales. Only the swell on hover is
 * fixed here, so every layout answers the pointer the same way.
 */
export function CategoryArt({
    category,
    className,
    logoClassName,
    imageClassName,
}: {
    category: Category;
    /** Applied whichever of the two is drawn. */
    className?: string;
    /** Extra classes for the wordmark fallback only. */
    logoClassName?: string;
    /** Extra classes for a real photo only. */
    imageClassName?: string;
}) {
    const swell =
        'transition-[scale] duration-300 ease-out group-hover:scale-105 motion-reduce:scale-100';

    if (category.image === null) {
        /* It keeps the logo's own ratio rather than the square the photos get —
           stretched, the wordmark stops being it. */
        return (
            <span
                aria-hidden
                style={{ ...LOGO_MASK, aspectRatio: LOGO_ASPECT }}
                className={cn(
                    'bg-primary-foreground',
                    swell,
                    className,
                    logoClassName,
                )}
            />
        );
    }

    /* Category art is cut out on a transparent background, so it sits whole
       inside its box rather than being cropped. */
    return (
        <img
            src={category.image}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className={cn(
                'object-contain drop-shadow-[0_3px_6px_rgb(0_0_0/0.14)]',
                swell,
                className,
                imageClassName,
            )}
        />
    );
}
