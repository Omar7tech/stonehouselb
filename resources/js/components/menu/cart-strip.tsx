import { ProductImage } from '@/components/menu/product-image';
import type { Product } from '@/types';

/**
 * What's in the cart so far, across the top of the menu.
 *
 * It runs the full width of the page and scrolls sideways — a half-cut tile at
 * the right edge is what tells you there is more in there, so a long cart needs
 * no arrows and no second screen to look at.
 */
export function CartStrip({
    lines,
}: {
    lines: readonly { product: Product; quantity: number }[];
}) {
    return (
        <section
            aria-label="Your cart"
            className="rounded-3xl bg-card p-4 shadow-lg"
        >
            <ul className="flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {lines.map(({ product, quantity }) => (
                    <li
                        key={product.id}
                        className="relative w-32 shrink-0 snap-start rounded-2xl bg-muted/60 px-3 pt-4 pb-3"
                    >
                        <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground tabular-nums">
                            {quantity}
                            <span className="sr-only"> in cart</span>
                        </span>

                        <ProductImage
                            product={product}
                            className="mx-auto aspect-square w-full"
                        />

                        <p className="mt-2 truncate text-center font-display text-sm uppercase">
                            {product.name}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
