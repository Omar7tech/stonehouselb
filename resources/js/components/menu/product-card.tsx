import { Plus } from 'lucide-react';
import { useState } from 'react';

import { ProductImage } from '@/components/menu/product-image';
import { ProductPrice } from '@/components/menu/product-price';
import { VariantSelector } from '@/components/menu/variant-selector';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * One row of the menu: photo, name, description and price, with the size picker
 * underneath when the product has sizes.
 *
 * The whole card opens the product's sheet — the row is the target, so there is
 * no small "details" link to find. That target is an overlay rather than a
 * wrapper, so the size chips and the quick add can be real buttons standing on
 * top of it instead of buttons nested inside one.
 *
 * `onAdd` is what separates the two menus: delivery passes a handler and gets
 * the quick-add button in the corner, dine-in passes nothing and the card is
 * there to read.
 */
export function ProductCard({
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

    // The price shown is the chosen size's, so the figure on the card is always
    // one the customer can actually pay.
    const selectedVariant = hasVariants ? product.variants[variantIndex] : null;
    const price = selectedVariant?.price ?? product.price;
    const discountPrice =
        selectedVariant?.discountPrice ??
        (hasVariants ? null : product.discountPrice);

    return (
        <article className="relative flex flex-col rounded-2xl bg-card p-2.5 transition-transform duration-200 ease-out hover:-translate-y-0.5 motion-reduce:transform-none">
            {/* Covers the card, under everything else, so the heading and copy
                stay real block elements outside a button. */}
            <button
                type="button"
                onClick={() => onOpen(product, chosen)}
                className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <span className="sr-only">View {product.name}</span>
            </button>

            <div className="pointer-events-none flex items-center gap-3">
                <ProductImage
                    product={product}
                    className="size-20 shrink-0 sm:size-22"
                />

                {/* The gutter is only kept clear when there is an add button to
                    keep clear of; on dine-in the name uses the full width. */}
                <div className={cn('min-w-0 flex-1', onAdd && 'pr-8')}>
                    {/* Body face, not the display one: product names are read,
                        not admired, and StretchPro is too wide to hold a full
                        name on one line. It also takes the ligature problem
                        with it — no doubled letter can widen itself here. */}
                    {/* `leading-tight`, or the line's own leading sits under the
                        name as a gap no margin below it can take back. */}
                    <h3 className="truncate text-base leading-tight font-semibold uppercase sm:text-lg">
                        {product.name}
                    </h3>

                    {product.description === null ? (
                        /* Nothing written for this one yet. */
                        <div aria-hidden className="mt-2 flex gap-1.5">
                            <span className="h-2 w-20 rounded-full bg-muted" />
                            <span className="h-2 w-14 rounded-full bg-muted" />
                        </div>
                    ) : (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {product.description}
                        </p>
                    )}

                    <ProductPrice
                        price={price}
                        discountPrice={discountPrice}
                        className="mt-1.5"
                    />
                </div>
            </div>

            {hasVariants && (
                <div className="relative z-10 mt-2.5 border-t border-foreground/10 pt-2.5">
                    <VariantSelector
                        variants={product.variants}
                        selectedIndex={variantIndex}
                        onSelect={setVariantIndex}
                    />
                </div>
            )}

            {onAdd && (
                <button
                    type="button"
                    onClick={() => onAdd(product, chosen)}
                    aria-label={`Add ${product.name} to your order`}
                    className="absolute top-2.5 right-2.5 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 ease-out hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
                >
                    <Plus className="size-3.5" strokeWidth={3} />
                    {quantity > 0 && (
                        <span className="sr-only">
                            {quantity} already in your order
                        </span>
                    )}
                </button>
            )}
        </article>
    );
}
