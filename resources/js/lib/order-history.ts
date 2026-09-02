import { toCartItem } from '@/contexts/cart-context';
import type { CartAddon, CartItem } from '@/contexts/cart-context';
import type { Addon, Product } from '@/types';

/** One order the customer has sent, kept so it can be sent again. */
export type PastOrder = {
    /** When it was handed to WhatsApp, in epoch milliseconds. */
    sentAt: number;
    items: CartItem[];
};

const STORAGE_KEY = 'stone-house-orders';

/**
 * How many sent orders are remembered. Enough to tell a habit from a one-off —
 * an order that shows up twice in five is a usual — without turning the
 * customer's phone into a filing cabinet.
 */
const REMEMBERED_ORDERS = 5;

/**
 * The orders this browser has sent, newest first. Anything unreadable reads as
 * no history at all: a stale entry should cost the customer a shortcut, never
 * the menu.
 */
export function readOrders(): PastOrder[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw) as PastOrder[];

        return parsed.filter(
            (order) => Array.isArray(order.items) && order.items.length > 0,
        );
    } catch {
        return [];
    }
}

/** Remember an order that has just been sent. */
export function rememberOrder(items: readonly CartItem[]): void {
    if (items.length === 0) {
        return;
    }

    try {
        const orders: PastOrder[] = [
            { sentAt: Date.now(), items: [...items] },
            ...readOrders(),
        ].slice(0, REMEMBERED_ORDERS);

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
        // Ignore storage failures (e.g. private mode quota).
    }
}

/**
 * A stable fingerprint for a whole order, so two sends of the same thing can be
 * recognised as the same thing. Sorted, because the order lines were added in
 * is not part of what was ordered.
 */
function orderSignature(items: readonly CartItem[]): string {
    return items
        .map((item) => `${item.key}x${item.quantity}`)
        .sort()
        .join('|');
}

/** Whether this exact order has been sent more than once — a habit, not a one-off. */
export function isUsualOrder(
    orders: readonly PastOrder[],
    order: PastOrder,
): boolean {
    const signature = orderSignature(order.items);

    return (
        orders.filter((past) => orderSignature(past.items) === signature)
            .length > 1
    );
}

/**
 * A past order read against the menu as it stands today.
 *
 * A remembered order is a snapshot, and kitchens change: prices move, sizes are
 * dropped, dishes come off the menu entirely. Sending that snapshot back into
 * the basket would quietly order a dish at last month's price, so every line is
 * rebuilt from the live product instead — the customer's own choices (how many,
 * which extras, what to leave out, any note) are what carries over, and the
 * prices and names come from the menu.
 *
 * A line the menu can no longer honour is dropped and counted rather than
 * fudged into something near enough. Being told two dishes are gone is fair;
 * being sold a different size than the one ordered is not.
 */
export function rebuildOrder(
    items: readonly CartItem[],
    menu: ReadonlyMap<number, { product: Product; addons: Addon[] }>,
): { items: CartItem[]; dropped: number } {
    const rebuilt: CartItem[] = [];
    let dropped = 0;

    items.forEach((item) => {
        const entry = menu.get(item.productId);

        if (entry === undefined) {
            dropped += 1;

            return;
        }

        const { product, addons } = entry;
        const variant =
            item.variantIndex === null
                ? null
                : (product.variants[item.variantIndex] ?? null);

        // The dish is still sold, but not in the shape it was ordered in: the
        // size is gone, or it has since been split into sizes and there is no
        // longer a plain one to order.
        if (item.variantIndex === null && product.variants.length > 0) {
            dropped += 1;

            return;
        }

        if (item.variantIndex !== null && variant === null) {
            dropped += 1;

            return;
        }

        // Extras the category has since dropped simply aren't ordered again;
        // the ones that remain are re-priced, because the price on the line is
        // last month's.
        const keptAddons = item.addons.flatMap<CartAddon>((chosen) => {
            const offered = addons.find((addon) => addon.name === chosen.name);

            return offered === undefined
                ? []
                : [
                      {
                          name: offered.name,
                          price: offered.price,
                          quantity: chosen.quantity,
                      },
                  ];
        });

        const fresh = toCartItem({
            productId: product.id,
            variantIndex: item.variantIndex,
            name: product.name,
            variantName: variant?.name ?? null,
            unitUsd:
                variant === null
                    ? (product.discountPrice ?? product.price)
                    : (variant.discountPrice ?? variant.price),
            image: product.thumbnail ?? product.image,
            addons: keptAddons,
            // Only what the dish still contains, as the product sheet does: an
            // ingredient the kitchen has since removed is not something the
            // customer can ask to have left out.
            excludedIngredients: item.excludedIngredients.filter((name) =>
                product.ingredients.includes(name),
            ),
            quantity: item.quantity,
        });

        const line =
            item.note === undefined ? fresh : { ...fresh, note: item.note };

        // Two lines can rebuild into one — both had the same extra dropped, say
        // — and the kitchen has no way to tell the results apart.
        const twin = rebuilt.findIndex((existing) => existing.key === line.key);

        if (twin === -1) {
            rebuilt.push(line);

            return;
        }

        rebuilt[twin] = {
            ...rebuilt[twin],
            quantity: rebuilt[twin].quantity + line.quantity,
        };
    });

    return { items: rebuilt, dropped };
}
