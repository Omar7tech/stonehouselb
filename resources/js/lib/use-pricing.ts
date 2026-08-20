import { convertUsdToLbp, formatLbp, formatUsd } from '@/lib/currency';
import type { PriceDisplay, Pricing } from '@/types';

/**
 * TEMPORARY. In pinelb this comes from settings, shared on every Inertia
 * response and read with `usePage().props.pricing`. There is no settings table
 * here yet, so it is pinned — swapping to shared props later is a change to
 * this constant alone, since the shape below already matches.
 */
const PRICING: Pricing = {
    display: 'both',
    lbpRate: 89000,
};

export type PriceParts = {
    /** Whether the USD price should be shown. */
    showUsd: boolean;
    /** Whether the LBP price should be shown. */
    showLbp: boolean;
    usd: (usd: number) => string;
    lbp: (usd: number) => string;
    /** Formats an amount in whichever single currency leads the display. */
    primary: (usd: number) => string;
};

/**
 * Helpers that format a USD amount for the active display mode. Falls back to
 * USD-only when no LBP rate is configured, so a missing rate quietly shows one
 * currency rather than an empty price.
 */
export function usePricing(): PriceParts {
    const rate = PRICING.lbpRate;
    const display: PriceDisplay = rate === null ? 'usd' : PRICING.display;

    const showUsd = display === 'usd' || display === 'both';
    const showLbp = (display === 'lbp' || display === 'both') && rate !== null;

    const usd = (value: number): string => formatUsd(value);
    const lbp = (value: number): string =>
        rate === null ? '' : formatLbp(convertUsdToLbp(value, rate));

    return {
        showUsd,
        showLbp,
        usd,
        lbp,
        primary: (value: number) => (showUsd ? usd(value) : lbp(value)),
    };
}
