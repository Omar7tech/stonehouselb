import type { CartItem } from '@/contexts/cart-context';
import type { OrderLine } from '@/lib/order-history';

/** Where a shared basket rides in the URL. */
const PARAM = 'order';

/**
 * Caps on what a link may carry. The payload comes off the address bar, so it
 * is a stranger's data whatever it claims to be: a link is allowed to fill a
 * basket, never to fill it with ten thousand of something or to smuggle a page
 * of text into the order message.
 */
const MAX_LINES = 50;
const MAX_QUANTITY = 99;
const MAX_NOTE = 200;

/**
 * A basket in a link.
 *
 * Only the choices travel — which dish, which size, how many, which extras,
 * what was left out, and anything written on the line. Names, prices and photos
 * are deliberately left behind: the person opening the link reads them off
 * their own copy of the menu, so a link shared on Monday cannot quote Monday's
 * price at them on Friday. It also keeps the thing short enough to send.
 *
 * The shape is positional rather than an object per line, and trailing empties
 * are dropped, because every character here is a character in a WhatsApp
 * message somebody has to look at.
 */
export function encodeOrder(items: readonly CartItem[]): string {
    const lines = items.slice(0, MAX_LINES).map((item) => {
        const line: unknown[] = [
            item.productId,
            item.variantIndex,
            item.quantity,
        ];

        const addons = item.addons
            .filter((addon) => addon.quantity > 0)
            .map((addon) => [addon.name, addon.quantity]);
        const excluded = item.excludedIngredients;
        const note = item.note?.trim().slice(0, MAX_NOTE) ?? '';

        if (note !== '') {
            line.push(addons, excluded, note);
        } else if (excluded.length > 0) {
            line.push(addons, excluded);
        } else if (addons.length > 0) {
            line.push(addons);
        }

        return line;
    });

    return toBase64Url(JSON.stringify(lines));
}

/**
 * Read a basket back out of a link, or null when there is nothing readable in
 * it. Every field is checked rather than trusted, and a line that fails a check
 * is skipped instead of taking the whole basket down with it — a link mangled
 * by a chat app should cost the customer one dish at worst.
 */
export function decodeOrder(value: string): OrderLine[] | null {
    let parsed: unknown;

    try {
        parsed = JSON.parse(fromBase64Url(value));
    } catch {
        return null;
    }

    if (!Array.isArray(parsed)) {
        return null;
    }

    const lines: OrderLine[] = [];

    parsed.slice(0, MAX_LINES).forEach((raw: unknown) => {
        if (!Array.isArray(raw)) {
            return;
        }

        const [productId, variantIndex, quantity, addons, excluded, note] =
            raw as unknown[];

        if (!Number.isInteger(productId)) {
            return;
        }

        if (variantIndex !== null && !Number.isInteger(variantIndex)) {
            return;
        }

        if (!Number.isInteger(quantity)) {
            return;
        }

        lines.push({
            productId: productId as number,
            variantIndex: variantIndex as number | null,
            quantity: Math.min(Math.max(quantity as number, 1), MAX_QUANTITY),
            addons: readAddons(addons),
            excludedIngredients: readNames(excluded),
            note:
                typeof note === 'string' && note.trim() !== ''
                    ? note.slice(0, MAX_NOTE)
                    : undefined,
        });
    });

    return lines.length > 0 ? lines : null;
}

/** The link to send: this menu, carrying this basket and nothing else. */
export function shareOrderUrl(items: readonly CartItem[]): string {
    const url = new URL(window.location.href);

    // Cleared first, so an open category or a link that was itself shared
    // doesn't ride along inside the next one.
    url.search = '';
    url.searchParams.set(PARAM, encodeOrder(items));

    return url.toString();
}

/** The basket carried by the current URL, if it carries one. */
export function readSharedOrder(): OrderLine[] | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const value = new URLSearchParams(window.location.search).get(PARAM);

    return value === null ? null : decodeOrder(value);
}

/**
 * Take the basket back out of the address bar once it has been read.
 *
 * A link that keeps its payload is a link that refills the basket every time
 * the page is reloaded or shared onwards, and it is a long ugly thing to leave
 * in front of somebody who is about to bookmark the menu.
 */
export function forgetSharedOrder(): void {
    const url = new URL(window.location.href);

    if (!url.searchParams.has(PARAM)) {
        return;
    }

    url.searchParams.delete(PARAM);
    window.history.replaceState(window.history.state, '', url);
}

/** `[["Extra cheese", 2], …]`, keeping only the pairs that are actually pairs. */
function readAddons(value: unknown): { name: string; quantity: number }[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const addons: { name: string; quantity: number }[] = [];

    value.forEach((raw: unknown) => {
        if (!Array.isArray(raw)) {
            return;
        }

        const [name, quantity] = raw as unknown[];

        if (typeof name !== 'string' || !Number.isInteger(quantity)) {
            return;
        }

        addons.push({
            name,
            quantity: Math.min(Math.max(quantity as number, 1), MAX_QUANTITY),
        });
    });

    return addons;
}

/** A list of names, with anything that isn't one dropped. */
function readNames(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter(
              (name: unknown): name is string => typeof name === 'string',
          )
        : [];
}

/**
 * Base64, in the alphabet a URL can carry and without the padding a chat app
 * might eat. Through UTF-8 first, because a note or an ingredient may well be
 * written in Arabic and `btoa` only speaks bytes.
 */
function toBase64Url(text: string): string {
    const bytes = new TextEncoder().encode(text);
    let binary = '';

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/** The way back. Throws on anything that isn't base64, which the caller catches. */
function fromBase64Url(value: string): string {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (character) =>
        character.charCodeAt(0),
    );

    return new TextDecoder().decode(bytes);
}
