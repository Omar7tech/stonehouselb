import { SmartImage } from '@/components/smart-image';
import { cn } from '@/lib/utils';

/**
 * Only the fields this needs, so a cart line — which carries a name and a photo
 * but not a whole product — can be drawn by the same component. A cart line has
 * no `thumbnail` because the small photo is the only one it ever stored.
 */
type Pictured = {
    name: string;
    image: string | null;
    thumbnail?: string | null;
};

/**
 * A product's photo, or the Stone House mark while there isn't one.
 *
 * The small cut is the default, since almost everywhere this appears is 88px
 * across or less; `full` is for the one place that is bigger than the cut — the
 * product sheet — and is opt-in so a new caller gets the cheap photo by
 * accident rather than the expensive one.
 *
 * The file is used rather than `StoneHouseLogo`: that one is the animated
 * wordmark built for the header, and a menu full of products would set every
 * copy of it running at once. Here it only has to fill a gap.
 */
export function ProductImage({
    product,
    className,
    markClassName,
    full = false,
}: {
    product: Pictured;
    className?: string;
    /**
     * Sizing for the house mark in the placeholder, when the caller's box wants
     * it smaller than the full width the rest are happy with.
     */
    markClassName?: string;
    /** Draw the photo at its own size rather than the 400px cut. */
    full?: boolean;
}) {
    const src = full ? product.image : (product.thumbnail ?? product.image);

    if (src === null) {
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
                    className={cn('w-full', markClassName)}
                />
            </div>
        );
    }

    return (
        <SmartImage
            src={src}
            alt={product.name}
            className={cn('rounded-2xl', className)}
            imgClassName="object-cover"
        />
    );
}
