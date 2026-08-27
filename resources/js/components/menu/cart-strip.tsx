import useEmblaCarousel from 'embla-carousel-react';

import { ProductImage } from '@/components/menu/product-image';
import { useCart } from '@/contexts/cart-context';
import { cn } from '@/lib/utils';

/**
 * What's in the order so far, across the top of the menu.
 *
 * It runs the full width of the page and drags sideways — a half-cut tile at
 * the right edge is what tells you there is more in there, so a long order
 * needs no arrows and no second screen to look at. Pressing it opens the
 * checkout.
 */

/**
 * How far the card's white carries on below the tiles, for the products panel
 * to sit on top of. It is drawn out of flow, so this is a purely visual number:
 * raising it slides more white behind the panel and cannot move anything on the
 * page, whatever the rest of the layout is doing.
 */
const SHEET_BLEED = '-12rem';

export function CartStrip() {
    const { items, setOpen } = useCart();

    const [emblaRef] = useEmblaCarousel({
        dragFree: true,
        align: 'start',
        containScroll: 'trimSnaps',
    });

    return (
        <section aria-label="Your order" className="relative">
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
                    {items.map((item, index) => (
                        <li
                            key={item.key}
                            className={cn(
                                'shrink-0 pr-3',
                                // The trailing gutter has to sit inside the
                                // last tile: Embla measures its scroll limit
                                // from the slides, so padding on the track
                                // would never be reachable.
                                index === items.length - 1 && 'pr-4',
                            )}
                        >
                            <button
                                type="button"
                                onClick={() => setOpen(true)}
                                aria-label={`${item.name}, ${item.quantity} in your order. Open checkout.`}
                                className="relative w-24 rounded-lg bg-muted/60 px-2 pt-3 pb-2 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transform-none"
                            >
                                {/* Centred on the corner itself — half on the
                                    tile, half off it — not tucked inside. */}
                                <span
                                    aria-hidden
                                    className="absolute top-0 left-0 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground tabular-nums"
                                >
                                    {item.quantity}
                                </span>

                                <ProductImage
                                    product={item}
                                    className="mx-auto aspect-square w-full"
                                />

                                {/* Body face, as on the product cards. */}
                                <p className="mt-1.5 truncate text-center text-[0.7rem] font-medium uppercase">
                                    {item.name}
                                </p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
