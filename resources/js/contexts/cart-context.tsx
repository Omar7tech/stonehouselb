import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';

export type CartAddon = {
    name: string;
    /** Unit price of the add-on in USD. */
    price: number;
    quantity: number;
};

export type CartItem = {
    /** Unique per product + variant + add-ons + ingredients left out. */
    key: string;
    productId: number;
    name: string;
    /**
     * Which size was chosen, kept alongside its name so the sheet can be
     * reopened on the same one. Null when the product is sold in one size.
     */
    variantIndex: number | null;
    variantName: string | null;
    /** Effective (discounted) base unit price in USD, excluding add-ons. */
    unitUsd: number;
    /** Chosen optional extras; their prices are added on top of `unitUsd`. */
    addons: CartAddon[];
    /**
     * Ingredients the customer asked to leave out, in the kitchen's own order.
     * Taking something out never changes the price — it is the same dish, made
     * without one thing — so this carries no money, only instructions.
     */
    excludedIngredients: string[];
    image: string | null;
    quantity: number;
    /** Optional free-text note for this line, e.g. "extra crispy". */
    note?: string;
};

export type AddToCartInput = {
    productId: number;
    variantIndex: number | null;
    name: string;
    variantName: string | null;
    unitUsd: number;
    image: string | null;
    addons?: CartAddon[];
    excludedIngredients?: string[];
    quantity?: number;
};

/** The per-unit price of a cart line including its add-ons. */
export function cartItemUnitUsd(item: CartItem): number {
    return item.addons.reduce(
        (total, addon) => total + addon.price * addon.quantity,
        item.unitUsd,
    );
}

/** A stable signature for a set of add-ons, so identical picks share a key. */
function addonsSignature(addons: CartAddon[]): string {
    return addons
        .filter((addon) => addon.quantity > 0)
        .map((addon) => `${addon.name}x${addon.quantity}`)
        .sort()
        .join(',');
}

/**
 * The same, for what was left out. Sorted rather than kept in the kitchen's
 * order so a burger without onion and one without onion are one line however
 * the two were picked — the order only matters when it is read back.
 */
function exclusionsSignature(excluded: string[]): string {
    return [...excluded].sort().join(',');
}

/**
 * One cart line from an add. The line's identity is everything that makes the
 * kitchen do something different — size, extras, and what was left out — so two
 * dishes made apart are two lines, and two made the same way are one.
 */
function toCartItem(input: AddToCartInput): CartItem {
    const addons = (input.addons ?? []).filter((addon) => addon.quantity > 0);
    const excludedIngredients = input.excludedIngredients ?? [];
    const signature = addonsSignature(addons);
    const without = exclusionsSignature(excludedIngredients);

    return {
        key: `${input.productId}:${input.variantIndex ?? 'base'}${
            signature ? `:${signature}` : ''
        }${without ? `:no(${without})` : ''}`,
        productId: input.productId,
        name: input.name,
        variantIndex: input.variantIndex,
        variantName: input.variantName,
        unitUsd: input.unitUsd,
        addons,
        excludedIngredients,
        image: input.image,
        quantity: Math.max(1, input.quantity ?? 1),
    };
}

type CartState = {
    items: CartItem[];
    count: number;
    subtotalUsd: number;
    /** Whether the checkout sheet is showing. */
    open: boolean;
    /**
     * The most recently added item. The `nonce` changes on every add — even
     * when the same product is re-added — so a toast can react to each one.
     * The key names the line it landed on, so the confirmation can offer a way
     * straight back into it.
     */
    lastAdded: {
        nonce: number;
        name: string;
        key: string;
        productId: number;
    } | null;
};

type CartActions = {
    setOpen: (open: boolean) => void;
    addItem: (input: AddToCartInput) => void;
    /** Rebuild the line at `key` from a fresh set of choices. */
    replaceItem: (key: string, input: AddToCartInput) => void;
    increment: (key: string) => void;
    decrement: (key: string) => void;
    removeItem: (key: string) => void;
    setNote: (key: string, note: string) => void;
    clear: () => void;
    /**
     * Put a basket back exactly as it was, which is what undoing a clear does.
     * Whole rather than line by line: half a restored order is worse than none,
     * and the customer asked for the basket they had.
     */
    restore: (items: CartItem[]) => void;
};

// State and actions live in separate contexts, so components that only fire
// actions (a product card's "add") don't re-render when the cart changes.
const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

const STORAGE_KEY = 'stone-house-cart';

/**
 * The cart as it was left. Anything unreadable is treated as an empty cart
 * rather than thrown — a stale or corrupt entry should cost the customer their
 * basket, not the whole menu.
 */
function readStoredItems(): CartItem[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        // Both lists are defaulted: a basket written before either existed is
        // still a basket, and reading it back as one is cheaper than asking the
        // customer to build it again.
        return (JSON.parse(raw) as CartItem[]).map((item) => ({
            ...item,
            addons: item.addons ?? [],
            excludedIngredients: item.excludedIngredients ?? [],
            variantIndex: item.variantIndex ?? null,
        }));
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>(readStoredItems);
    const [open, setOpen] = useState(false);
    const [lastAdded, setLastAdded] = useState<CartState['lastAdded']>(null);
    // Monotonic counter, so re-adding the same product still fires the toast.
    const addNonceRef = useRef(0);

    // Persist the cart so it survives navigations and reloads.
    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Ignore storage failures (e.g. private mode quota).
        }
    }, [items]);

    const addItem = useCallback((input: AddToCartInput): void => {
        const incoming = toCartItem(input);

        setItems((previous) => {
            const existing = previous.find((item) => item.key === incoming.key);

            // Re-adding moves the line to the end rather than topping it up
            // where it sits, so the list stays in the order things were last
            // added — which is what the strip reads to lead with the newest.
            // Only adding does this; the +/- in the basket leave order alone.
            if (existing) {
                return [
                    ...previous.filter((item) => item.key !== incoming.key),
                    {
                        ...existing,
                        quantity: existing.quantity + incoming.quantity,
                    },
                ];
            }

            return [...previous, incoming];
        });

        // Signal a toast rather than opening the whole cart, so adding several
        // things in a row doesn't keep interrupting the customer.
        addNonceRef.current += 1;
        setLastAdded({
            nonce: addNonceRef.current,
            name: incoming.name,
            key: incoming.key,
            productId: incoming.productId,
        });
    }, []);

    /**
     * Rebuild one line from a fresh set of choices — what the sheet does when
     * it is opened on a line already in the basket.
     *
     * The line keeps its place in the list rather than jumping to the end: the
     * customer is editing where they are looking, and a row that moved under
     * them while they saved would read as a different row. Its note is kept for
     * the same reason — nothing they wrote is thrown away by a change to what
     * is in the dish.
     *
     * Editing a line into one the basket already holds merges the two, since
     * the kitchen has no way to tell the results apart.
     */
    const replaceItem = useCallback(
        (key: string, input: AddToCartInput): void => {
            setItems((previous) => {
                const original = previous.find((item) => item.key === key);

                if (original === undefined) {
                    return previous;
                }

                const updated: CartItem = {
                    ...toCartItem(input),
                    note: original.note,
                };

                const twin = previous.find(
                    (item) => item.key === updated.key && item.key !== key,
                );

                if (twin === undefined) {
                    return previous.map((item) =>
                        item.key === key ? updated : item,
                    );
                }

                return previous
                    .filter((item) => item.key !== key)
                    .map((item) =>
                        item.key === twin.key
                            ? {
                                  ...twin,
                                  quantity: twin.quantity + updated.quantity,
                              }
                            : item,
                    );
            });
        },
        [],
    );

    const increment = useCallback((key: string): void => {
        setItems((previous) =>
            previous.map((item) =>
                item.key === key
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
            ),
        );
    }, []);

    // A line taken down to zero leaves the cart rather than sitting there empty.
    const decrement = useCallback((key: string): void => {
        setItems((previous) =>
            previous
                .map((item) =>
                    item.key === key
                        ? { ...item, quantity: item.quantity - 1 }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    }, []);

    const removeItem = useCallback((key: string): void => {
        setItems((previous) => previous.filter((item) => item.key !== key));
    }, []);

    const setNote = useCallback((key: string, note: string): void => {
        setItems((previous) =>
            previous.map((item) =>
                item.key === key ? { ...item, note } : item,
            ),
        );
    }, []);

    const clear = useCallback((): void => setItems([]), []);

    const restore = useCallback((restored: CartItem[]): void => {
        // Anything added since the clear is kept and the restored lines are
        // topped up into it, so an undo can never take something away.
        setItems((previous) => {
            if (previous.length === 0) {
                return restored;
            }

            const merged = [...previous];

            restored.forEach((item) => {
                const index = merged.findIndex(
                    (existing) => existing.key === item.key,
                );

                if (index === -1) {
                    merged.push(item);

                    return;
                }

                merged[index] = {
                    ...merged[index],
                    quantity: merged[index].quantity + item.quantity,
                };
            });

            return merged;
        });
    }, []);

    const actions = useMemo<CartActions>(
        () => ({
            setOpen,
            addItem,
            replaceItem,
            increment,
            decrement,
            removeItem,
            setNote,
            clear,
            restore,
        }),
        [
            addItem,
            replaceItem,
            increment,
            decrement,
            removeItem,
            setNote,
            clear,
            restore,
        ],
    );

    const state = useMemo<CartState>(
        () => ({
            items,
            count: items.reduce((total, item) => total + item.quantity, 0),
            subtotalUsd: items.reduce(
                (total, item) => total + cartItemUnitUsd(item) * item.quantity,
                0,
            ),
            open,
            lastAdded,
        }),
        [items, open, lastAdded],
    );

    return (
        <CartActionsContext value={actions}>
            <CartStateContext value={state}>{children}</CartStateContext>
        </CartActionsContext>
    );
}

/** Cart mutators only; identity is stable so consumers don't re-render. */
export function useCartActions(): CartActions {
    const context = useContext(CartActionsContext);

    if (context === null) {
        throw new Error('useCartActions must be used within a CartProvider.');
    }

    return context;
}

/** Cart state plus actions; re-renders when the cart contents change. */
export function useCart(): CartState & CartActions {
    const state = useContext(CartStateContext);
    const actions = useContext(CartActionsContext);

    if (state === null || actions === null) {
        throw new Error('useCart must be used within a CartProvider.');
    }

    return { ...state, ...actions };
}
