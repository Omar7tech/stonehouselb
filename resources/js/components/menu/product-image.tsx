import { cn } from '@/lib/utils';
import type { Product } from '@/types';

/**
 * A product's photo, or the Stone House mark while there isn't one.
 *
 * The file is used rather than `StoneHouseLogo`: that one is the animated
 * wordmark built for the header, and a menu full of products would set every
 * copy of it running at once. Here it only has to fill a gap.
 */
export function ProductImage({
    product,
    className,
}: {
    product: Product;
    className?: string;
}) {
    if (product.image === null) {
        return (
            <div
                aria-hidden
                className={cn(
                    'flex items-center justify-center rounded-2xl bg-muted p-3',
                    className,
                )}
            >
                {/* The mark is far wider than it is tall, so it sets its own
                    height off the width it is given rather than stretching to
                    the square it sits in. */}
                <img
                    src="/logos/logo.svg"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full"
                />
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
