import { usePage } from '@inertiajs/react';

/**
 * Whether the storefront shouts the names the shop typed.
 *
 * Two questions rather than one: a menu whose categories are set in capitals
 * and whose dishes are not is a real house style, and the shop is the one who
 * knows which it keeps.
 *
 * Both default to true, which is how every title was drawn before this was a
 * choice — including on a page rendered before the setting existed.
 */
export function useUppercaseCategoryTitles(): boolean {
    return usePage().props.uppercaseCategoryTitles ?? true;
}

export function useUppercaseProductTitles(): boolean {
    return usePage().props.uppercaseProductTitles ?? true;
}
