import { usePricing } from '@/lib/use-pricing';
import { cn } from '@/lib/utils';

/**
 * A product price rendered for the active display mode (USD, LBP, or both).
 *
 * In "both" mode the currencies stack, with the pre-discount price struck
 * through beside the leading row only — repeating it on both rows reads as two
 * separate offers rather than one price in two currencies.
 */
export function ProductPrice({
    price,
    discountPrice,
    className,
}: {
    price: number;
    discountPrice?: number | null;
    className?: string;
}) {
    const pricing = usePricing();
    const hasDiscount = discountPrice !== null && discountPrice !== undefined;
    const effectivePrice = hasDiscount ? discountPrice : price;
    const both = pricing.showUsd && pricing.showLbp;

    if (both) {
        return (
            <span
                className={cn(
                    'inline-flex flex-col items-start leading-tight',
                    className,
                )}
            >
                <span className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-primary tabular-nums">
                        {pricing.usd(effectivePrice)}
                    </span>
                    {hasDiscount && (
                        <span className="text-[0.8rem] text-muted-foreground tabular-nums line-through">
                            {pricing.usd(price)}
                        </span>
                    )}
                </span>
                <span className="text-[0.8rem] tracking-wide text-primary/60 tabular-nums">
                    {pricing.lbp(effectivePrice)}
                </span>
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5',
                className,
            )}
        >
            <span className="text-lg font-semibold text-primary tabular-nums">
                {pricing.primary(effectivePrice)}
            </span>
            {hasDiscount && (
                <span className="text-[0.8rem] text-muted-foreground tabular-nums line-through">
                    {pricing.primary(price)}
                </span>
            )}
        </span>
    );
}
