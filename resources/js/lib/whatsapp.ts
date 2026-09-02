import { withoutLabel } from '@/components/menu/ingredient-picker';
import { cartItemUnitUsd } from '@/contexts/cart-context';
import type { CartItem } from '@/contexts/cart-context';
import type { LocationResult } from '@/lib/geolocation';
import type { PriceParts } from '@/lib/use-pricing';

/**
 * Build a WhatsApp deep link for a number, with a message pre-filled when one
 * is given and an empty chat when it isn't. The number is reduced to digits
 * because wa.me rejects spaces, dashes and a leading `+`.
 */
export function buildWhatsAppUrl(number: string, message?: string): string {
    const digits = number.replace(/\D/g, '');
    const url = `https://wa.me/${digits}`;

    return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

type OrderSummary = {
    items: CartItem[];
    pricing: PriceParts;
    subtotalUsd: number;
    /** Delivery charge in USD, or null when none applies. */
    deliveryFeeUsd: number | null;
    totalUsd: number;
    /** The customer's name, included when a full name is required. */
    customerName?: string | null;
    /** The customer's phone number, included when one is required. */
    customerPhone?: string | null;
    /** The customer's coordinates, included when location sharing succeeded. */
    location?: LocationResult | null;
    /**
     * True when a location was wanted but couldn't be captured, so the customer
     * will share it by hand. Tells the shop to expect a pin to follow.
     */
    locationPending?: boolean;
    /** A free-text note for the whole order. */
    orderNote?: string | null;
};

/**
 * Format a USD amount in every currency the storefront displays, so the order
 * message matches what the customer saw on screen (e.g. "$6.00 / 540,000 LBP").
 */
function money(pricing: PriceParts, usd: number): string {
    const parts: string[] = [];

    if (pricing.showUsd) {
        parts.push(pricing.usd(usd));
    }

    if (pricing.showLbp) {
        parts.push(pricing.lbp(usd));
    }

    // Always fall back to USD so a line never renders empty.
    return parts.length > 0 ? parts.join(' / ') : pricing.usd(usd);
}

/**
 * Build the human-readable WhatsApp order message, using WhatsApp's `*bold*`
 * markup and a numbered list so the shop can read the order at a glance.
 */
export function buildOrderMessage({
    items,
    pricing,
    subtotalUsd,
    deliveryFeeUsd,
    totalUsd,
    customerName,
    customerPhone,
    location,
    locationPending,
    orderNote,
}: OrderSummary): string {
    const divider = '———————————————';
    const lines: string[] = ['🪨 *New order — Stone House*', ''];

    const name = customerName?.trim() ?? '';
    const phone = customerPhone?.trim() ?? '';

    if (name !== '') {
        lines.push(`👤 *Name:* ${name}`);
    }

    if (phone !== '') {
        lines.push(`📱 *Phone:* ${phone}`);
    }

    if (location) {
        const accuracy = Math.round(location.accuracy);
        // Flag coarse fixes so the shop knows the pin may be approximate.
        const precision =
            accuracy > 100 ? ` (approx. ±${accuracy}m)` : ` (±${accuracy}m)`;

        lines.push(
            `📍 *Location:* https://maps.google.com/?q=${location.latitude},${location.longitude}${precision}`,
        );
    } else if (locationPending) {
        lines.push('📍 *Location:* will be shared in this chat 👇');
    }

    if (name !== '' || phone !== '' || location || locationPending) {
        lines.push('');
    }

    items.forEach((item, index) => {
        const lineTotalUsd = cartItemUnitUsd(item) * item.quantity;
        const title = item.variantName
            ? `${item.name} — ${item.variantName}`
            : item.name;

        lines.push(`*${index + 1}. ${title}*`);
        lines.push(
            `   ${item.quantity} × ${money(pricing, item.unitUsd)} = ${money(pricing, item.unitUsd * item.quantity)}`,
        );

        // Before the extras, and marked with its own sign: what to leave out is
        // the instruction most easily missed on a busy pass, and reading it
        // after a list of things to add is exactly when it gets missed.
        if (item.excludedIngredients.length > 0) {
            lines.push(`   ❌ ${withoutLabel(item.excludedIngredients)}`);
        }

        item.addons.forEach((addon) => {
            const addonTotalUsd = addon.price * addon.quantity * item.quantity;

            lines.push(
                `   ➕ ${addon.quantity * item.quantity}× ${addon.name} (+${money(pricing, addonTotalUsd)})`,
            );
        });

        if (item.addons.length > 0) {
            lines.push(`   = ${money(pricing, lineTotalUsd)}`);
        }

        const note = item.note?.trim() ?? '';

        if (note !== '') {
            lines.push(`   📝 _${note}_`);
        }

        lines.push('');
    });

    lines.push(divider);

    if (deliveryFeeUsd !== null) {
        lines.push(`Subtotal: ${money(pricing, subtotalUsd)}`);
        lines.push(`Delivery: ${money(pricing, deliveryFeeUsd)}`);
    }

    lines.push(`*TOTAL: ${money(pricing, totalUsd)}*`);

    const note = orderNote?.trim() ?? '';

    if (note !== '') {
        lines.push('', divider, `📝 *Order note:* ${note}`);
    }

    return lines.join('\n');
}
