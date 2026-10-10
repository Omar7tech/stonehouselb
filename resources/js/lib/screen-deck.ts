import type { Category, Product, Slide } from '@/types';
import type { DeckLayout, ScreenOrientation } from '@/types/screen';

/**
 * One page a screen holds for its rotation: either a slice of a category, or a
 * promotion dealt in between two of them.
 */
export type ScreenPage =
    | {
          kind: 'menu';
          key: string;
          category: Category;
          /** The dishes on this page — a slice of the category, in its order. */
          products: Product[];
          /** The whole category, for the layouts that queue up what is next. */
          siblings: Product[];
          /** Which page of the category this is, and how many there are. */
          page: number;
          pages: number;
      }
    | { kind: 'slide'; key: string; slide: Slide };

/**
 * How many dishes one page holds, per layout and orientation.
 *
 * These are read from across a room, so the numbers are lower than a web page
 * would use: a board crammed with sixteen lines is a board nobody reads. The
 * portrait figures are not simply smaller — a tall screen fits more rows in one
 * column than a wide one fits in two, because it is not spending its height on
 * a heading and a photograph side by side.
 */
const PER_PAGE: Record<DeckLayout, Record<ScreenOrientation, number>> = {
    board: { landscape: 8, portrait: 9 },
    // One dish, its photograph behind it. The page is the dish.
    spotlight: { landscape: 1, portrait: 1 },
    // A slanted photograph takes half the screen; the list has the rest.
    split: { landscape: 5, portrait: 6 },
    // A feature tile of four cells, and small ones filling the wall around it.
    showcase: { landscape: 5, portrait: 5 },
    // The strip does not page at all: it takes the category and travels
    // through it. Capped so a category of eighty does not build a track a
    // hundred screens wide for a set with no memory to spare.
    strip: { landscape: 14, portrait: 14 },
};

/**
 * Break the menu into the pages a screen turns over, and deal the promotions
 * in among them.
 *
 * A category longer than one page becomes several, so nothing is ever cut off
 * the bottom of a board — the rest simply comes round again a page later. The
 * slides are spread evenly through the deck rather than run at the end,
 * because a screen that shows the whole menu and then four adverts is a screen
 * customers learn to stop reading.
 */
export function buildDeck({
    categories,
    slides,
    layout,
    orientation,
}: {
    categories: Category[];
    slides: Slide[];
    layout: DeckLayout;
    orientation: ScreenOrientation;
}): ScreenPage[] {
    const perPage = PER_PAGE[layout][orientation];
    const menu: ScreenPage[] = [];

    for (const category of categories) {
        const products = category.products;
        const pages = Math.max(Math.ceil(products.length / perPage), 1);

        for (let page = 0; page < pages; page++) {
            menu.push({
                kind: 'menu',
                key: `c${category.id}p${page}`,
                category,
                products: products.slice(page * perPage, (page + 1) * perPage),
                siblings: products,
                page,
                pages,
            });
        }
    }

    if (slides.length === 0) {
        return menu;
    }

    if (menu.length === 0) {
        return slides.map((slide) => ({
            kind: 'slide',
            key: `s${slide.id}`,
            slide,
        }));
    }

    // One slide every `gap` menu pages, so a short menu with several slides
    // still alternates and a long one with a single slide is not interrupted
    // twice in a row.
    const gap = Math.max(Math.round(menu.length / slides.length), 1);
    const deck: ScreenPage[] = [];
    let dealt = 0;

    menu.forEach((page, index) => {
        deck.push(page);

        const due = (index + 1) % gap === 0;

        if (due && dealt < slides.length) {
            const slide = slides[dealt];
            dealt += 1;

            deck.push({ kind: 'slide', key: `s${slide.id}`, slide });
        }
    });

    // Anything left over goes at the end rather than being dropped: a shop that
    // put four slides up expects to see four of them.
    for (; dealt < slides.length; dealt++) {
        const slide = slides[dealt];

        deck.push({ kind: 'slide', key: `s${slide.id}`, slide });
    }

    return deck;
}

/**
 * The price a dish leads with, and the price it was.
 *
 * A dish sold in sizes quotes its cheapest, which is the figure a board should
 * carry: the customer reads "from $4" and asks about the large at the counter.
 */
export function leadPrice(product: Product): {
    price: number;
    was: number | null;
    from: boolean;
} {
    if (product.variants.length === 0) {
        return {
            price: product.discountPrice ?? product.price,
            was: product.discountPrice === null ? null : product.price,
            from: false,
        };
    }

    const cheapest = product.variants.reduce((low, variant) =>
        (variant.discountPrice ?? variant.price) <
        (low.discountPrice ?? low.price)
            ? variant
            : low,
    );

    return {
        price: cheapest.discountPrice ?? cheapest.price,
        was: cheapest.discountPrice === null ? null : cheapest.price,
        from: product.variants.length > 1,
    };
}
