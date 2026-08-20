import type { CartLine, Category, Product } from '@/types';

/**
 * Stand-in menu, here only so the design can be looked at. Every product is
 * called NAME and carries no description or price on purpose — that is what
 * the mockup shows, and it keeps the layout honest about which parts are still
 * waiting on real content.
 *
 * Swapping this for the database later means replacing this file with props
 * from `MenuController`; the components already take the shapes below.
 */

export const CATEGORIES: readonly Category[] = [
    { id: 1, name: 'Sefiha' },
    { id: 2, name: 'Fried Chicken' },
    { id: 3, name: 'Burgers' },
];

export const PRODUCTS: readonly Product[] = [
    { id: 1, name: 'Name', categoryId: 1 },
    { id: 2, name: 'Name', categoryId: 1 },
    { id: 3, name: 'Name', categoryId: 1 },
    { id: 4, name: 'Name', categoryId: 2 },
    { id: 5, name: 'Name', categoryId: 2 },
    { id: 6, name: 'Name', categoryId: 2 },
    { id: 7, name: 'Name', categoryId: 3 },
    { id: 8, name: 'Name', categoryId: 3 },
    { id: 9, name: 'Name', categoryId: 3 },
];

/** A cart with something already in it, so the strip on top has content. */
export const INITIAL_CART: readonly CartLine[] = [
    { productId: 1, quantity: 1 },
    { productId: 4, quantity: 1 },
    { productId: 7, quantity: 1 },
    { productId: 8, quantity: 1 },
];
