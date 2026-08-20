import { Plus } from 'lucide-react';

import { ProductImage } from '@/components/menu/product-image';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * One row of the menu: photo, name, and the two bars standing in for the
 * description and price that aren't written yet.
 *
 * `onAdd` is what separates the two menus. Delivery passes a handler and gets
 * the add button; dine-in passes nothing, so the card is the same card with
 * nothing to press — the menu is there to read, not to order from.
 */
export function ProductCard({
    product,
    quantity,
    onAdd,
}: {
    product: Product;
    quantity: number;
    onAdd?: (product: Product) => void;
}) {
    return (
        <article className="relative flex items-center gap-4 rounded-3xl bg-card p-3 shadow-md">
            <ProductImage
                product={product}
                className="size-20 shrink-0 sm:size-24"
            />

            {/* The gutter is only kept clear when there is an add button to
                keep clear of; on dine-in the name uses the full width. */}
            <div className={cn('min-w-0 flex-1', onAdd && 'pr-10')}>
                <h3 className="truncate font-display text-2xl uppercase sm:text-3xl">
                    {product.name}
                </h3>

                {/* Description and price, still to come. */}
                <div aria-hidden className="mt-3 flex gap-2">
                    <span className="h-3 w-24 rounded-full bg-muted" />
                    <span className="h-3 w-20 rounded-full bg-muted" />
                </div>
            </div>

            {onAdd && (
                <button
                    type="button"
                    onClick={() => onAdd(product)}
                    aria-label={`Add ${product.name} to cart`}
                    className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 ease-out hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
                >
                    <Plus className="size-5" strokeWidth={3} />
                    {quantity > 0 && (
                        <span className="sr-only">
                            {quantity} already in cart
                        </span>
                    )}
                </button>
            )}
        </article>
    );
}
