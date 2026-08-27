/** Mirrors `App\Enums\OrderType` — which menu the page is rendering. */
export type OrderType = 'dine_in' | 'delivery';

/** Which currency the menu prices are rendered in. */
export type PriceDisplay = 'usd' | 'lbp' | 'both';

export type Pricing = {
    display: PriceDisplay;
    /** LBP per 1 USD, or null when LBP pricing is unavailable. */
    lbpRate: number | null;
};

/** Mirrors `App\Http\Resources\ProductResource`. */
export type Product = {
    id: number;
    name: string;
    description: string | null;
    /** In USD. LBP is derived from it at the configured rate, never stored. */
    price: number;
    /** Set only while the product is on offer; `price` stays the full one. */
    discountPrice: number | null;
    /**
     * Photo for the card. Products without one fall back to `ProductImage`'s
     * placeholder rather than leaving a hole in the row.
     */
    image: string | null;
};

/** Mirrors `App\Http\Resources\CategoryResource`. */
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
