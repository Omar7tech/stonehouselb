import { ProductImage } from '@/components/menu/product-image';
import type { Product } from '@/types';

/**
 * What's in the cart so far, across the top of the menu.
 *
 * It runs the full width of the page and scrolls sideways — a half-cut tile at
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

            {/* Free scrolling, deliberately not snapped: snapping never lets
                the row rest part-way, and a half-cut tile at the edge is the
                whole cue that there is more of the cart to see. */}
            <ul className="relative flex [scrollbar-width:none] gap-3 overflow-x-auto p-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {lines.map(({ product, quantity }) => (
                    <li
                        key={product.id}
                        className="relative w-24 shrink-0 rounded-lg bg-muted/60 px-2 pt-3 pb-2"
                    >
                        <span className="absolute top-1 left-1 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground tabular-nums">
                            {quantity}
                            <span className="sr-only"> in cart</span>
                        </span>

                        <ProductImage
                            product={product}
                            className="mx-auto aspect-square w-full"
                        />

                        <p className="mt-1.5 truncate text-center font-display text-xs uppercase">
                            {product.name}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
