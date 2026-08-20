import type { CartLine, Category, Product } from '@/types';

/**
 * Stand-in menu, here only so the design can be looked at with real copy in it.
 *
 * The shape matches what `MenuController` will send once the menu is in the
 * database — categories carrying their own products, as pinelb does — so
 * swapping this file for props is a substitution rather than a rewrite.
 */

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

/** Everything gets the same stand-in until the shoot happens. */
function withPhoto(products: Omit<Product, 'image'>[]): Product[] {
    return products.map((product) => ({
        ...product,
        image: PLACEHOLDER_IMAGE,
    }));
}

export const CATEGORIES: readonly Category[] = [
    {
        id: 1,
        slug: 'sefiha',
        name: 'Sefiha',
        products: withPhoto([
            {
                id: 101,
                name: 'Baalbek Sefiha',
                description:
                    'Open-faced minced beef with tomato, onion and a squeeze of lemon.',
            },
            {
                id: 102,
                name: 'Cheese Sefiha',
                description: 'Akkawi and mozzarella melted over thin dough.',
            },
            {
                id: 103,
                name: 'Lahm Bi Ajin',
                description: 'Spiced lamb, pine nuts and pomegranate molasses.',
            },
            {
                id: 104,
                name: 'Zaatar Manoushe',
                description:
                    'Wild thyme, sesame and olive oil, baked until the edges crisp.',
            },
        ]),
    },
    {
        id: 2,
        slug: 'fried-chicken',
        name: 'Fried Chicken',
        products: withPhoto([
            {
                id: 201,
                name: 'Crunch Bucket',
                description: 'Eight pieces, double-dredged and fried to order.',
            },
            {
                id: 202,
                name: 'Hot Honey Tenders',
                description: 'Buttermilk tenders finished with chilli honey.',
            },
            {
                id: 203,
                name: 'Chicken Zinger',
                description:
                    'Fillet, lettuce and garlic mayo in a toasted bun.',
            },
            {
                id: 204,
                name: 'Popcorn Chicken',
                description: 'Bite-sized, seasoned with our house seven-spice.',
            },
        ]),
    },
    {
        id: 3,
        slug: 'burgers',
        name: 'Burgers',
        products: withPhoto([
            {
                id: 301,
                name: 'Stone House Double',
                description:
                    'Two smashed patties, cheddar, pickles and house sauce.',
            },
            {
                id: 302,
                name: 'Classic Smash',
                description: 'Single patty, onion, tomato and melted cheese.',
            },
            {
                id: 303,
                name: 'Mushroom Swiss',
                description: 'Sauteed mushrooms and swiss over a beef patty.',
            },
            {
                id: 304,
                name: 'Spicy Angus',
                description:
                    'Angus patty, jalapeno, pepper jack, chipotle mayo.',
            },
        ]),
    },
    {
        id: 4,
        slug: 'wraps',
        name: 'Wraps',
        products: withPhoto([
            {
                id: 401,
                name: 'Shish Taouk',
                description: 'Grilled chicken, garlic toum, pickles and fries.',
            },
            {
                id: 402,
                name: 'Beef Shawarma',
                description: 'Thin-shaved beef, tahini, tomato and parsley.',
            },
            {
                id: 403,
                name: 'Falafel Wrap',
                description: 'Fried chickpea patties, turnips and tarator.',
            },
            {
                id: 404,
                name: 'Halloumi Wrap',
                description: 'Grilled halloumi, mint and roasted red pepper.',
            },
        ]),
    },
    {
        id: 5,
        slug: 'sides',
        name: 'Sides',
        products: withPhoto([
            {
                id: 501,
                name: 'House Fries',
                description: 'Skin-on, salted the moment they leave the fryer.',
            },
            {
                id: 502,
                name: 'Onion Rings',
                description: 'Beer-battered, stacked, and gone in a minute.',
            },
            {
                id: 503,
                name: 'Garlic Toum',
                description: 'Whipped garlic, lemon and oil. Order two.',
            },
            {
                id: 504,
                name: 'Coleslaw',
                description: 'Cabbage and carrot in a light lemon dressing.',
            },
        ]),
    },
    {
        id: 6,
        slug: 'drinks',
        name: 'Drinks',
        products: withPhoto([
            {
                id: 601,
                name: 'Fresh Lemonade',
                description: 'Lemon, mint and just enough sugar.',
            },
            {
                id: 602,
                name: 'Ayran',
                description: 'Salted yoghurt, served properly cold.',
            },
            {
                id: 603,
                name: 'Soft Drinks',
                description: "Chilled cans, whatever's in the fridge.",
            },
            {
                id: 604,
                name: 'Turkish Coffee',
                description: 'Ground fine, served with the foam on top.',
            },
        ]),
    },
];

/** Flattened once, for resolving the cart's product ids. */
export const ALL_PRODUCTS: readonly Product[] = CATEGORIES.flatMap(
    (category) => category.products,
);

/** A cart with something already in it, so the strip on top has content. */
export const INITIAL_CART: readonly CartLine[] = [
    { productId: 301, quantity: 1 },
    { productId: 201, quantity: 1 },
    { productId: 501, quantity: 2 },
    { productId: 401, quantity: 1 },
];
