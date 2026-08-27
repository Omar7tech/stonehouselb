import { usePage } from '@inertiajs/react';
import { convertUsdToLbp, formatLbp, formatUsd } from '@/lib/currency';
import type { PriceDisplay } from '@/types';

export type PriceParts = {
    /** Whether the USD price should be shown. */
    showUsd: boolean;
    /** Whether the LBP price should be shown. */
    showLbp: boolean;
    /** Delivery charge in USD added to an order, or null when none applies. */
    deliveryFeeUsd: number | null;
    usd: (usd: number) => string;
    lbp: (usd: number) => string;
    /** Formats an amount in whichever single currency leads the display. */
    primary: (usd: number) => string;
};

/**
 * Reads the pricing settings shared on every Inertia response and exposes
 * helpers that format a USD amount for the active display mode. Falls back to
 * USD-only when no LBP rate is configured, so a missing rate quietly shows one
 * currency rather than an empty price.
 */
export function usePricing(): PriceParts {
    const { pricing } = usePage().props;
    const rate = pricing?.lbpRate ?? null;
    const display: PriceDisplay =
        rate === null ? 'usd' : (pricing?.display ?? 'usd');

    const showUsd = display === 'usd' || display === 'both';
    const showLbp = (display === 'lbp' || display === 'both') && rate !== null;

    const usd = (value: number): string => formatUsd(value);
    const lbp = (value: number): string =>
        rate === null ? '' : formatLbp(convertUsdToLbp(value, rate));

    return {
        showUsd,
        showLbp,
        deliveryFeeUsd: pricing?.deliveryFeeUsd ?? null,
        usd,
        lbp,
        primary: (value: number) => (showUsd ? usd(value) : lbp(value)),
    };
}
