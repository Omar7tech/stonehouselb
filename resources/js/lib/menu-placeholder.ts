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

/**
 * A stand-in photo so the cards can be judged with something in them.
 *
 * TEMPORARY. It is hot-linked from a stock library, watermark and all, and must
 * not reach production: it is someone else's bandwidth, it is unlicensed, and
 * the host can pull or block it at any time. Replace with real photography in
 * `public/`, then this constant goes away and each product carries its own.
 */
const PLACEHOLDER_IMAGE =
    'https://thumbs.dreamstime.com/b/beef-burger-isolated-white-background-30569226.jpg';

export const PRODUCTS: readonly Product[] = [
    { id: 1, name: 'Name', categoryId: 1, image: PLACEHOLDER_IMAGE },
    { id: 2, name: 'Name', categoryId: 1, image: PLACEHOLDER_IMAGE },
    { id: 3, name: 'Name', categoryId: 1, image: PLACEHOLDER_IMAGE },
    { id: 4, name: 'Name', categoryId: 2, image: PLACEHOLDER_IMAGE },
    { id: 5, name: 'Name', categoryId: 2, image: PLACEHOLDER_IMAGE },
    { id: 6, name: 'Name', categoryId: 2, image: PLACEHOLDER_IMAGE },
    { id: 7, name: 'Name', categoryId: 3, image: PLACEHOLDER_IMAGE },
    { id: 8, name: 'Name', categoryId: 3, image: PLACEHOLDER_IMAGE },
    { id: 9, name: 'Name', categoryId: 3, image: PLACEHOLDER_IMAGE },
];

/** A cart with something already in it, so the strip on top has content. */
export const INITIAL_CART: readonly CartLine[] = [
    { productId: 1, quantity: 1 },
    { productId: 4, quantity: 1 },
    { productId: 7, quantity: 1 },
    { productId: 8, quantity: 1 },
];
