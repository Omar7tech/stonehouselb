import { Sandwich } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * A product's photo, or a marked placeholder while there isn't one.
 *
 * The placeholder is deliberately plain rather than a stock burger: it reads as
 * "no photo yet" at a glance, so an unshot product can't quietly ship looking
 * finished.
 */
export function ProductImage({
    product,
    className,
}: {
    product: Product;
    className?: string;
}) {
    if (product.image === undefined) {
        return (
            <div
                aria-hidden
                className={cn(
                    'flex items-center justify-center rounded-2xl bg-muted text-muted-foreground/40',
                    className,
                )}
            >
                <Sandwich className="size-1/2" strokeWidth={1.5} />
            </div>
        );
    }

    return (
        <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className={cn('rounded-2xl object-cover', className)}
        />
    );
}
