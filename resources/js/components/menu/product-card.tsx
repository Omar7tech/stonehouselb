import { Plus } from 'lucide-react';

import { ProductImage } from '@/components/menu/product-image';
import { ProductPrice } from '@/components/menu/product-price';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * One row of the menu: photo, name, description and price.
 *
 * The whole card opens the product's sheet — the row is the target, so there is
 * no small "details" link to find. `onAdd` is what separates the two menus:
 * delivery passes a handler and gets the quick-add button in the corner,
 * dine-in passes nothing and the card is there to read.
 */
export function ProductCard({
    product,
    quantity,
    onOpen,
    onAdd,
}: {
    product: Product;
    quantity: number;
    onOpen: (product: Product) => void;
    onAdd?: (product: Product) => void;
}) {
    return (
        <article className="relative">
            {/* The card's own button covers the row and sits underneath the add
                button, which stands above it in the corner. Nesting the two
                would be invalid, so they are siblings on one grid cell. */}
            <button
                type="button"
                onClick={() => onOpen(product)}
                aria-label={`View ${product.name}`}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-2.5 text-left transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transform-none"
            >
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
                        price={product.price}
                        discountPrice={product.discountPrice}
                        className="mt-1.5"
                    />
                </div>
            </button>

            {onAdd && (
                <button
                    type="button"
                    onClick={() => onAdd(product)}
                    aria-label={`Add ${product.name} to your order`}
                    className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 ease-out hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
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
