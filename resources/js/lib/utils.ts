import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Built once: constructing a formatter per price is needlessly expensive. */
const priceFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

/** Renders a price held in cents, e.g. `950` as `$9.50`. */
export function formatPrice(cents: number): string {
    return priceFormatter.format(cents / 100);
}
