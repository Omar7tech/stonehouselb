import { Flame, Leaf, Plus, Star } from 'lucide-react';
import { useState } from 'react';

import { ProductImage } from '@/components/menu/product-image';
import { ProductPrice } from '@/components/menu/product-price';
import { VariantSelector } from '@/components/menu/variant-selector';
import type { Product } from '@/types';

/**
 * One product as a full-width card: the photo across the top, the name, copy
 * and price beneath it. The shape an online shop uses for a product.
 *
 * Named a showcase rather than a card because {@see ProductCard} is already the
 * other style — the row — and renaming that would touch the default everyone is
 * on to make room for the alternative.
 *
 * The opposite trade from the row. A row fits the most dishes on a screen and is
 * read fastest; this gives the photograph the whole width and sells the dish
 * rather than listing it. That only pays off if every dish has a good picture —
 * a category of house marks laid out this way is a page of holes, which is the
 * judgement the setting leaves to the owner.
 *
 * The quick add sits on the photo rather than beside the name. There is no line
 * for it to share here, and on the picture's bottom corner it lands where the
 * thumb already is.
 */
export function ProductShowcase({
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

    // Which size is chosen on the card. It is what the quick add adds, and the
    // sheet opens on it, so the card and the sheet never disagree.
    const [variantIndex, setVariantIndex] = useState(0);
    const chosen = hasVariants ? variantIndex : null;

    const selectedVariant = hasVariants ? product.variants[variantIndex] : null;
    const price = selectedVariant?.price ?? product.price;
    const discountPrice =
        selectedVariant?.discountPrice ??
        (hasVariants ? null : product.discountPrice);

    return (
        <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-card">
            {/* Covers the card, under everything else, so the heading and copy
                stay real block elements outside a button. */}
            <button
                type="button"
                onClick={() => onOpen(product, chosen)}
                className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <span className="sr-only">View {product.name}</span>
            </button>

            <div className="pointer-events-none relative">
                {/* 16:9 rather than square: at one card to a row this photo is
                    as wide as the phone, and a square crop at that width is
                    most of a screen for one dish. */}
                <ProductImage
                    product={product}
                    className="aspect-[16/9] w-full"
                />

                {/* On the photo, bottom-right, so it clears the marks riding at
                    the top of it. Raised over the card's own tap target, or the
                    press would fall through to the sheet. */}
                {onAdd && (
                    <button
                        type="button"
                        onClick={() => onAdd(product, chosen)}
                        aria-label={`Add ${product.name} to your order`}
                        className="pointer-events-auto absolute right-3 bottom-3 z-10 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-[scale] duration-200 ease-out hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:scale-100"
                    >
                        <Plus className="size-4" strokeWidth={3} />
                        {quantity > 0 && (
                            <span className="sr-only">
                                {quantity} already in your order
                            </span>
                        )}
                    </button>
                )}

                {/* Top-left of the photo, on a plate of the card's own white:
                    laid straight on a photograph they would land on whatever
                    colour the food happens to be there. */}
                {(product.isFeatured || product.isSpicy || product.isVegan) && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-card/90 px-2 py-1">
                        {product.isFeatured && (
                            <Star
                                aria-label="Featured"
                                className="size-3.5 fill-current text-primary"
                            />
                        )}
                        {product.isSpicy && (
                            <Flame
                                aria-label="Spicy"
                                className="size-3.5 text-spicy"
                            />
                        )}
                        {product.isVegan && (
                            <Leaf
                                aria-label="Vegan"
                                className="size-3.5 text-vegan"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* `flex-1` so the price is pushed to the foot of the card whatever
                the copy above it runs to, which is what keeps a row of cards
                quoting their prices along one line. */}
            <div className="pointer-events-none relative flex flex-1 flex-col p-3.5">
                <h3 className="text-base leading-tight font-semibold uppercase sm:text-lg">
                    {product.name}
                </h3>

                {product.description !== null && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {product.description}
                    </p>
                )}

                <ProductPrice
                    price={price}
                    discountPrice={discountPrice}
                    className="mt-2 pt-0.5"
                />
            </div>

            {/* Raised over the card's own tap target, or the options would be
                pressed through to the sheet instead of switching. */}
            {hasVariants && (
                <div className="relative z-10 px-3.5 pb-3.5">
                    <VariantSelector
                        variants={product.variants}
                        selectedIndex={variantIndex}
                        onSelect={setVariantIndex}
                    />
                </div>
            )}
        </article>
    );
}
