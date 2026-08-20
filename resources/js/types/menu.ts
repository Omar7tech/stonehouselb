/** Mirrors `App\Enums\OrderType` — which menu the page is rendering. */
export type OrderType = 'dine_in' | 'delivery';

export type Category = {
    id: number;
    name: string;
};

export type Product = {
    id: number;
    name: string;
    categoryId: number;
    /**
     * Photo for the card. Nothing has been shot yet, so every product falls
     * back to `ProductImage`'s placeholder until real URLs land here.
     */
    image?: string;
};

/** One line of the cart: a product and how many of it were added. */
export type CartLine = {
    productId: number;
    quantity: number;
};
