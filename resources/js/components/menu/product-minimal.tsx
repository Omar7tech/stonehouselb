import { Flame, Leaf, Plus, Star } from 'lucide-react';
import { useState } from 'react';

import { ProductImage } from '@/components/menu/product-image';
import { ProductPrice } from '@/components/menu/product-price';
import type { Product } from '@/types';

/**
 * One product with no card around it: the photograph, the name, the price, and
 * nothing else drawn.
 *
 * The other two styles put the dish on a piece of paper — a white slab with a
 * radius and an edge. This one takes the paper away and lets the photo sit
 * straight on the panel, which is what makes a page of them read as a shop
 * window rather than a stack of receipts. The only surface left is behind the
 * picture itself, and that is there so a cut-out has something to stand on.
 *
 * Two to a row on a phone, which is what the plainness buys: with no card
 * padding and no rule to clear, a dish needs half the width the other styles
 * ask for and still has room for its name.
 *
 * The trade is that there is nowhere to put a size picker. A product sold in
 * sizes quotes its cheapest and sends the press to the sheet instead of adding
 * blind — the one thing this style cannot do inline, handled rather than hidden.
 */
export function ProductMinimal({
    product,
    quantity,
    onOpen,
    onAdd,
}: {
    product: Product;
    quantity: number;
    onOpen: (product: Product, variantIndex: number | null) => void;
    onAdd?: (product: Product, variantIndex: number | null) => void;
}) {
    const hasVariants = product.variants.length > 0;

    // Kept so the sheet opens on the same size the card is quoting, which for
    // this style is always the cheapest one.
    const [cheapestIndex] = useState(() => {
        if (!hasVariants) {
            return null;
        }

        return product.variants.reduce(
            (cheapest, variant, index) =>
                (variant.discountPrice ?? variant.price) <
                (product.variants[cheapest].discountPrice ??
                    product.variants[cheapest].price)
                    ? index
                    : cheapest,
            0,
        );
    });

    const cheapest =
        cheapestIndex === null ? null : product.variants[cheapestIndex];
    const price = cheapest?.price ?? product.price;
    const discountPrice =
        cheapest?.discountPrice ?? (hasVariants ? null : product.discountPrice);

    return (
        <article className="group relative flex flex-col">
            {/* Covers the whole item, under everything else, so the heading
                stays a real block element outside a button. */}
            <button
                type="button"
                onClick={() => onOpen(product, cheapestIndex)}
                className="absolute inset-0 z-0 rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-4 focus-visible:ring-offset-surface focus-visible:outline-none"
            >
                <span className="sr-only">View {product.name}</span>
            </button>

            <div className="pointer-events-none relative">
                <ProductImage
                    product={product}
                    className="aspect-square w-full rounded-xl"
                />

                {/* A tint of the card's white rather than solid orange. The
                    whole point of this style is that nothing shouts, and a
                    filled brand button on every photo would be the loudest
                    thing on the page repeated forty times. */}
                {onAdd && (
                    <button
                        type="button"
                        onClick={() =>
                            // A product sold in sizes has a choice to make, and
                            // there is no picker on this card to make it with —
                            // so the press opens the sheet rather than quietly
                            // adding whichever size happens to be cheapest.
                            hasVariants
                                ? onOpen(product, cheapestIndex)
                                : onAdd(product, null)
                        }
                        aria-label={
                            hasVariants
                                ? `Choose a size for ${product.name}`
                                : `Add ${product.name} to your order`
                        }
                        className="pointer-events-auto absolute right-2 bottom-2 z-10 flex size-7 items-center justify-center rounded-full bg-card/95 text-primary shadow-sm transition-[scale] duration-200 ease-out hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:scale-100"
                    >
                        <Plus className="size-4" strokeWidth={2.75} />
                        {quantity > 0 && (
                            <span className="sr-only">
                                {quantity} already in your order
                            </span>
                        )}
                    </button>
                )}

                {/* On the photo rather than beside the name. This card's name
                    is the narrowest of the three styles — two to a row on a
                    phone — and marks sharing that line come out of the width the
                    title needs to stay whole.

                    On a plate of the card's own white, since laid straight on a
                    photograph they would land on whatever colour the food
                    happens to be there. */}
                {(product.isFeatured || product.isSpicy || product.isVegan) && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-1">
                        {product.isFeatured && (
                            <Star
                                aria-label="Featured"
                                className="size-3 fill-current text-primary"
                            />
                        )}
                        {product.isSpicy && (
                            <Flame
                                aria-label="Spicy"
                                className="size-3 text-spicy"
                            />
                        )}
                        {product.isVegan && (
                            <Leaf
                                aria-label="Vegan"
                                className="size-3 text-vegan"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* The name has the line to itself, which is the whole reason the
                marks moved onto the photo. */}
            <h3 className="pointer-events-none relative mt-2.5 line-clamp-2 text-xs leading-snug font-medium tracking-wide uppercase sm:text-sm">
                {product.name}
            </h3>

            <ProductPrice
                price={price}
                discountPrice={discountPrice}
                className="pointer-events-none relative mt-1"
            />
        </article>
    );
}
