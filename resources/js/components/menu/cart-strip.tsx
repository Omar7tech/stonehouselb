import useEmblaCarousel from 'embla-carousel-react';

import { ProductImage } from '@/components/menu/product-image';
import { StretchText } from '@/components/stretch';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * What's in the cart so far, across the top of the menu.
 *
 * It runs the full width of the page and drags sideways — a half-cut tile at
 * the right edge is what tells you there is more in there, so a long cart needs
 * no arrows and no second screen to look at.
 */

/**
 * How far the card's white carries on below the tiles, for the products panel
 * to sit on top of. It is drawn out of flow, so this is a purely visual number:
 * raising it slides more white behind the panel and cannot move anything on the
 * page, whatever the rest of the layout is doing.
 */
const SHEET_BLEED = '-12rem';

export function CartStrip({
    lines,
}: {
    lines: readonly { product: Product; quantity: number }[];
}) {
    const [emblaRef] = useEmblaCarousel({
        dragFree: true,
        align: 'start',
        containScroll: 'trimSnaps',
    });

    return (
        <section aria-label="Your cart" className="relative">
            {/* The card itself, behind its own contents. Everything below is
                laid out from the tiles alone, so this can reach as far down as
                the design wants without any sibling having to know. */}
            <div
                aria-hidden
                style={{ bottom: SHEET_BLEED }}
                className="absolute inset-x-0 top-0 rounded-3xl bg-card shadow-lg"
            />

            {/* The vertical padding is what keeps the corner badges out of the
                viewport's clipping. */}
            <div
                ref={emblaRef}
                className="relative overflow-hidden py-4 select-none"
            >
                <ul className="flex pl-4">
                    {lines.map(({ product, quantity }, index) => (
                        <li
                            key={product.id}
                            className={cn(
                                'shrink-0 pr-3',
                                // The trailing gutter has to sit inside the
                                // last tile: Embla measures its scroll limit
                                // from the slides, so padding on the track
                                // would never be reachable.
                                index === lines.length - 1 && 'pr-4',
                            )}
                        >
                            <div className="relative w-24 rounded-lg bg-muted/60 px-2 pt-3 pb-2">
                                {/* Centred on the corner itself — half on the
                                    tile, half off it — not tucked inside. */}
                                <span className="absolute top-0 left-0 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground tabular-nums">
                                    {quantity}
                                    <span className="sr-only"> in cart</span>
                                </span>

                                <ProductImage
                                    product={product}
                                    className="mx-auto aspect-square w-full"
                                />

                                {/* Ligatures off, as on the product cards: a
                                    doubled letter would widen itself. */}
                                <StretchText
                                    as="p"
                                    className="mt-1.5 truncate text-center font-display text-xs uppercase"
                                >
                                    {product.name}
                                </StretchText>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
