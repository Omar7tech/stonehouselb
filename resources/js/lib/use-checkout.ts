import { usePage } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';

import type { CartItem } from '@/contexts/cart-context';
import { getBestLocation, isPermissionDenied } from '@/lib/geolocation';
import type { LocationResult } from '@/lib/geolocation';
import { rememberOrder } from '@/lib/order-history';
import { useShopOpen } from '@/lib/shop';
import type { PriceParts } from '@/lib/use-pricing';
import { buildOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp';

/**
 * Where the customer is in the checkout flow.
 *
 * `cart` → (`details`) → `note` → (`locating` → `location-error`) → `sending`.
 * The bracketed steps only appear when the shop asks for those things.
 */
export type CheckoutStep =
    'cart' | 'details' | 'note' | 'locating' | 'location-error' | 'sending';

const NAME_STORAGE_KEY = 'stone-house-customer-name';
const PHONE_STORAGE_KEY = 'stone-house-customer-phone';

/** Minimum number of digits a phone number must contain to be accepted. */
const PHONE_MIN_DIGITS = 8;

/** Count the digits in a phone number, ignoring spaces, dashes and symbols. */
export function phoneDigitCount(value: string): number {
    return value.replace(/\D/g, '').length;
}

/** Read a value remembered from a previous order, if any. */
function readStored(key: string): string {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        return window.localStorage.getItem(key) ?? '';
    } catch {
        return '';
    }
}

/** Remember a value so it can be pre-filled on the next order. */
function store(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Ignore storage failures (e.g. private mode quota).
    }
}

type CheckoutInput = {
    items: CartItem[];
    pricing: PriceParts;
    subtotalUsd: number;
    deliveryFeeUsd: number | null;
    totalUsd: number;
};

/**
 * Drives the checkout: which step is showing, the details the shop asks for,
 * the location lookup, and the hand-off to WhatsApp.
 */
export function useCheckout({
    items,
    pricing,
    subtotalUsd,
    deliveryFeeUsd,
    totalUsd,
}: CheckoutInput) {
    const { whatsappNumber, checkout } = usePage().props;
    const { requireFullName, requirePhoneNumber, getClientLocation } = checkout;
    // A closed shop still shows its menu and still fills a cart; it just has
    // nobody to hand the order to, so the send is what closes.
    const shopOpen = useShopOpen();

    const [step, setStep] = useState<CheckoutStep>('cart');
    const [name, setName] = useState(() => readStored(NAME_STORAGE_KEY));
    const [phone, setPhone] = useState(() => readStored(PHONE_STORAGE_KEY));
    const [orderNote, setOrderNote] = useState('');
    // True when the location failure was an explicit denial rather than a
    // timeout, so the panel can show the right instructions.
    const [locationDenied, setLocationDenied] = useState(false);
    // The built link, surfaced as a manual button in case the automatic
    // redirect is swallowed by the browser.
    const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

    // Guards against opening WhatsApp twice — e.g. if the location promise
    // resolves just after the customer chose to send without it.
    const sentRef = useRef(false);

    const canSend = whatsappNumber !== null && items.length > 0 && shopOpen;
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const detailsValid =
        (!requireFullName || trimmedName !== '') &&
        (!requirePhoneNumber ||
            phoneDigitCount(trimmedPhone) >= PHONE_MIN_DIGITS);

    /** Reset the flow back to the item list, e.g. when the sheet is closed. */
    const reset = useCallback((): void => {
        setStep('cart');
        setLocationDenied(false);
        setWhatsappUrl(null);
        // Block any in-flight location lookup from sending after the fact.
        sentRef.current = true;
    }, []);

    const sendOrder = useCallback(
        (location: LocationResult | null, locationPending: boolean): void => {
            if (
                sentRef.current ||
                whatsappNumber === null ||
                items.length === 0
            ) {
                return;
            }

            // Closing time can land mid-checkout. Rather than a button that
            // quietly does nothing, walk back to the item list, which is where
            // the "we're closed" line is.
            if (!shopOpen) {
                setStep('cart');

                return;
            }

            sentRef.current = true;

            const message = buildOrderMessage({
                items,
                pricing,
                subtotalUsd,
                deliveryFeeUsd,
                totalUsd,
                customerName: requireFullName ? name.trim() : null,
                customerPhone: requirePhoneNumber ? phone.trim() : null,
                location,
                locationPending,
                orderNote,
            });

            const url = buildWhatsAppUrl(whatsappNumber, message);

            // Kept as it was sent, so the customer can send it again without
            // building it a second time. Written here rather than on the way
            // back, because there is no way back — the send hands the browser
            // to WhatsApp and this page is gone.
            rememberOrder(items);

            setWhatsappUrl(url);
            setStep('sending');

            // Let the "Opening WhatsApp…" state paint before handing off. A
            // same-tab navigation (rather than window.open) is never blocked as
            // a popup — notably on iOS Safari — and deep-links into the app.
            window.setTimeout(() => {
                window.location.href = url;
            }, 600);
        },
        [
            whatsappNumber,
            shopOpen,
            items,
            pricing,
            subtotalUsd,
            deliveryFeeUsd,
            totalUsd,
            requireFullName,
            requirePhoneNumber,
            name,
            phone,
            orderNote,
        ],
    );

    /**
     * Resolve the location when the shop asks for one, then send. A failure
     * holds the order on the error step rather than sending a bad pin.
     */
    const beginSend = useCallback((): void => {
        sentRef.current = false;

        if (!getClientLocation) {
            sendOrder(null, false);

            return;
        }

        if (!('geolocation' in navigator)) {
            setLocationDenied(false);
            setStep('location-error');

            return;
        }

        setLocationDenied(false);
        setStep('locating');

        getBestLocation({ timeoutMs: 8000 })
            .then((location) => sendOrder(location, false))
            .catch((error: unknown) => {
                setLocationDenied(isPermissionDenied(error));
                setStep('location-error');
            });
    }, [getClientLocation, sendOrder]);

    /** Leave the item list for the first step the shop actually asks for. */
    const startCheckout = useCallback((): void => {
        if (!canSend) {
            return;
        }

        setStep(requireFullName || requirePhoneNumber ? 'details' : 'note');
    }, [canSend, requireFullName, requirePhoneNumber]);

    const confirmDetails = useCallback((): void => {
        if (!detailsValid) {
            return;
        }

        if (requireFullName) {
            store(NAME_STORAGE_KEY, trimmedName);
            setName(trimmedName);
        }

        if (requirePhoneNumber) {
            store(PHONE_STORAGE_KEY, trimmedPhone);
            setPhone(trimmedPhone);
        }

        setStep('note');
    }, [
        detailsValid,
        requireFullName,
        requirePhoneNumber,
        trimmedName,
        trimmedPhone,
    ]);

    const confirmNote = useCallback((): void => beginSend(), [beginSend]);

    /** Step back from the note step to details, or to the item list. */
    const noteBack = useCallback((): void => {
        setStep(requireFullName || requirePhoneNumber ? 'details' : 'cart');
    }, [requireFullName, requirePhoneNumber]);

    /** Send anyway, flagging that the customer will share a pin in the chat. */
    const sendWithoutLocation = useCallback((): void => {
        sentRef.current = false;
        sendOrder(null, true);
    }, [sendOrder]);

    return {
        step,
        requireFullName,
        requirePhoneNumber,
        canSend,
        shopOpen,
        detailsValid,
        locationDenied,
        whatsappUrl,
        name,
        setName,
        phone,
        setPhone,
        orderNote,
        setOrderNote,
        reset,
        startCheckout,
        confirmDetails,
        confirmNote,
        noteBack,
        retryLocation: beginSend,
        sendWithoutLocation,
        backToCart: useCallback((): void => setStep('cart'), []),
    };
}
