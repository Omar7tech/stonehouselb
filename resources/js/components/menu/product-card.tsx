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
        <article className="relative flex items-center gap-3 rounded-2xl bg-card p-2.5">
            <ProductImage
                product={product}
                className="size-16 shrink-0 sm:size-18"
            />

            {/* The gutter is only kept clear when there is an add button to
                keep clear of; on dine-in the name uses the full width. */}
            <div className={cn('min-w-0 flex-1', onAdd && 'pr-8')}>
                <h3 className="truncate font-display text-lg uppercase sm:text-xl">
                    {product.name}
                </h3>

                {product.description === undefined ? (
                    /* Nothing written for this one yet. */
                    <div aria-hidden className="mt-2 flex gap-1.5">
                        <span className="h-2 w-20 rounded-full bg-muted" />
                        <span className="h-2 w-14 rounded-full bg-muted" />
                    </div>
                ) : (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {product.description}
                    </p>
                )}
            </div>

            {onAdd && (
                <button
                    type="button"
                    onClick={() => onAdd(product)}
                    aria-label={`Add ${product.name} to cart`}
                    className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 ease-out hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
                >
                    <Plus className="size-3.5" strokeWidth={3} />
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
