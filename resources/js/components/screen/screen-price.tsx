import { leadPrice } from '@/lib/screen-deck';
import { usePricing } from '@/lib/use-pricing';
import { cn } from '@/lib/utils';
import type { Product, Variant } from '@/types';

/**
 * A price as a board quotes it, in whichever currencies the shop shows.
 *
 * Sized in `--u`, the board's own unit, so one component reads correctly on a
 * ten-inch tablet and on a wall-mounted fifty-five. The pounds line sits under
 * the dollars at two-thirds the size: on a board the dollar figure is what is
 * scanned, and the pound figure is what is checked.
 *
 * Everything but the figure itself is drawn in the ink it inherits, so the one
 * component is right on the dark board, on the light board, and in white over a
 * photograph — none of which it needs to be told about.
 */
export function ScreenPrice({
    price,
    was,
    from = false,
    className,
    scale = 1,
}: {
    price: number;
    was?: number | null;
    /** Whether this is the cheapest of several sizes, not the only price. */
    from?: boolean;
    className?: string;
    /** Multiplier on the board's unit, for the layouts that quote big. */
    scale?: number;
}) {
    const pricing = usePricing();

    return (
        <span className={cn('flex flex-col items-end tabular-nums', className)}>
            <span className="flex items-baseline gap-[0.4em]">
                {from && (
                    <span
                        className="font-semibold text-current/45 uppercase"
                        style={{ fontSize: `calc(var(--u) * ${scale * 0.8})` }}
                    >
                        from
                    </span>
                )}

                {was != null && (
                    <span
                        className="text-current/35 line-through"
                        style={{ fontSize: `calc(var(--u) * ${scale * 0.95})` }}
                    >
                        {pricing.primary(was)}
                    </span>
                )}

                <span
                    className="leading-none font-semibold text-primary"
                    style={{ fontSize: `calc(var(--u) * ${scale * 1.55})` }}
                >
                    {pricing.showUsd ? pricing.usd(price) : pricing.lbp(price)}
                </span>
            </span>

            {/* Both currencies stack, so the figures stay in one column down
                the board rather than running along the line as a sentence. */}
            {pricing.showUsd && pricing.showLbp && (
                <span
                    className="leading-none text-primary/55"
                    style={{ fontSize: `calc(var(--u) * ${scale * 0.9})` }}
                >
                    {pricing.lbp(price)}
                </span>
            )}
        </span>
    );
}

/** The price a product leads with, read off the product itself. */
export function ProductLeadPrice({
    product,
    scale = 1,
    className,
}: {
    product: Product;
    scale?: number;
    className?: string;
}) {
    const lead = leadPrice(product);

    return (
        <ScreenPrice
            price={lead.price}
            was={lead.was}
            from={lead.from}
            scale={scale}
            className={className}
        />
    );
}

/**
 * Every size a dish is sold in, listed one per line.
 *
 * The layouts that feature a single dish have the room for this, and a board
 * that quotes "small, medium, large" in full answers the question a customer
 * would otherwise have to ask at the counter.
 */
export function VariantPrices({
    variants,
    scale = 1,
}: {
    variants: Variant[];
    scale?: number;
}) {
    return (
        <ul
            className="flex flex-col gap-[0.35em]"
            style={{ fontSize: `calc(var(--u) * ${scale})` }}
        >
            {variants.map((variant, index) => (
                <li
                    key={index}
                    className="flex items-baseline justify-between gap-[1em] border-b border-current/15 pb-[0.3em]"
                >
                    <span className="font-medium text-current/70 uppercase">
                        {variant.name}
                    </span>

                    <ScreenPrice
                        price={variant.discountPrice ?? variant.price}
                        was={
                            variant.discountPrice === null
                                ? null
                                : variant.price
                        }
                        scale={scale}
                    />
                </li>
            ))}
        </ul>
    );
}
