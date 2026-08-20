/** Mirrors `App\Enums\OrderType` — which menu the page is rendering. */
export type OrderType = 'dine_in' | 'delivery';

export type Product = {
    id: number;
    name: string;
    description?: string;
    /**
     * In cents, not dollars. Money held as a float rounds badly the moment it
     * is summed — and this will be summed, once the cart totals for real.
     */
    price: number;
    /**
     * Photo for the card. Products without one fall back to `ProductImage`'s
     * placeholder rather than leaving a hole in the row.
     */
    image?: string;
};

export type Category = {
    id: number;
    /** Used in `?category=` so an open category survives a refresh. */
    slug: string;
    name: string;
    /**
     * Products hang off their category rather than sitting in one flat list,
     * so opening a category is a lookup instead of a scan.
     */
    products: Product[];
};

/** One line of the cart: a product and how many of it were added. */
export type CartLine = {
    productId: number;
    quantity: number;
};
