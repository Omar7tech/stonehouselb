/** Mirrors `App\Enums\OrderType` — which menu the page is rendering. */
export type OrderType = 'dine_in' | 'delivery';

/** Which currency the menu prices are rendered in. */
export type PriceDisplay = 'usd' | 'lbp' | 'both';

/** Mirrors `App\Enums\CategoryLayout` — how the landing view draws categories. */
export type CategoryLayout = 'grid' | 'rows' | 'mosaic' | 'tickets';

/** Mirrors `App\Enums\ProductCardStyle` — how one product is drawn. */
export type ProductCardStyle = 'row' | 'card' | 'minimal';

/** Mirrors `App\Enums\VariantStyle` — how a product's sizes are offered. */
export type VariantStyle = 'cards' | 'chips' | 'rows';

export type Pricing = {
    display: PriceDisplay;
    /** LBP per 1 USD, or null when LBP pricing is unavailable. */
    lbpRate: number | null;
    /** Delivery charge in USD added to an order, or null when none applies. */
    deliveryFeeUsd: number | null;
};

/** What the customer must provide before an order can be sent. */
export type Checkout = {
    requireFullName: boolean;
    requirePhoneNumber: boolean;
    getClientLocation: boolean;
};

/** One row in the footer's list of places to find the shop. */
export type SocialLink = {
    /** The platform's name, as the owner typed it. */
    label: string;
    url: string;
};

/** One size a product is sold in. Mirrors the `variants` JSON column. */
export type Variant = {
    name: string;
    /** In USD. */
    price: number;
    /** Set only while this size is on offer; `price` stays the full one. */
    discountPrice: number | null;
};

/** One optional extra offered across a category. Mirrors the `addons` column. */
export type Addon = {
    name: string;
    /** Unit price in USD. */
    price: number;
};

/** Mirrors `App\Http\Resources\ProductResource`. */
export type Product = {
    id: number;
    name: string;
    subtitle: string | null;
    description: string | null;
    /** In USD. LBP is derived from it at the configured rate, never stored. */
    price: number;
    /** Set only while the product is on offer; `price` stays the full one. */
    discountPrice: number | null;
    /**
     * Photo for the card. Products without one fall back to `ProductImage`'s
     * house mark rather than leaving a hole in the row.
     */
    image: string | null;
    /**
     * The same photo at 400px. What the card, the cart and the toast draw —
     * only the sheet is large enough to want `image`.
     */
    thumbnail: string | null;
    /** Roughly how long the item takes, in minutes. */
    preparationTime: number | null;
    /** Energy in kcal, or null when the kitchen has not counted this one. */
    calories: number | null;
    isFeatured: boolean;
    isSpicy: boolean;
    isVegan: boolean;
    /** Empty when the product is sold in one size only. */
    variants: Variant[];
    /**
     * What is in the dish, in the kitchen's order. Every one is in by default;
     * the customer takes out what they don't want, and what they took out
     * travels with the cart line. Empty when the kitchen has listed nothing,
     * which leaves the picker out entirely.
     */
    ingredients: string[];
};

/**
 * One card in the carousel above the menu. Mirrors
 * `App\Http\Resources\SlideResource`.
 */
export type Slide = {
    id: number;
    /** A line laid over the picture, or null when the picture says it all. */
    text: string | null;
    /**
     * The slide's own artwork, falling back to the linked dish's photo. Null
     * only when there is neither, which leaves a plain lettered card.
     */
    image: string | null;
    /**
     * The dish the slide opens. Null for a picture that only advertises —
     * and for one whose dish is not sold on the menu being shown, which the
     * server settles before the slide ever gets here.
     */
    product: Product | null;
    /**
     * Extras from the dish's own category, carried along because the sheet a
     * slide opens may be for a dish in a category the customer never entered.
     */
    addons: Addon[];
};

/** Mirrors `App\Http\Resources\CategoryResource`. */
export type Category = {
    id: number;
    /** Used in `?category=` so an open category survives a refresh. */
    slug: string;
    name: string;
    /** Art for the category box, or null while none has been uploaded. */
    image: string | null;
    /** The same art at 600px, which is every size the storefront draws it at. */
    thumbnail: string | null;
    /** Extras offered on every product in this category. */
    addons: Addon[];
    /**
     * Products hang off their category rather than sitting in one flat list,
     * so opening a category is a lookup instead of a scan.
     */
    products: Product[];
};
