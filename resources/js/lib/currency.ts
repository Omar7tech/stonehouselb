/** LBP amounts are rounded to the nearest multiple of this so prices stay clean. */
const LBP_ROUNDING_STEP = 5000;

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const lbpFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
});

/**
 * Convert a USD amount to LBP, rounded to the nearest 5,000 so prices read
 * cleanly (e.g. 2.88 × 90,000 = 259,200 → 260,000).
 */
export function convertUsdToLbp(usd: number, rate: number): number {
    return Math.round((usd * rate) / LBP_ROUNDING_STEP) * LBP_ROUNDING_STEP;
}

export function formatUsd(value: number): string {
    return usdFormatter.format(value);
}

export function formatLbp(value: number): string {
    return `${lbpFormatter.format(value)} LBP`;
}
