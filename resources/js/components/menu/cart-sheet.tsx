import {
    ArrowLeft,
    Check,
    LoaderCircle,
    MapPin,
    Minus,
    Pencil,
    Plus,
    RotateCcw,
    Share2,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { withoutLabel } from '@/components/menu/ingredient-picker';
import { ProductImage } from '@/components/menu/product-image';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cartItemUnitUsd, useCart } from '@/contexts/cart-context';
import type { CartItem } from '@/contexts/cart-context';

import { shareOrderUrl } from '@/lib/share-order';
import { nextOpeningLabel, useShop } from '@/lib/shop';
import { useCheckout } from '@/lib/use-checkout';
import { usePricing } from '@/lib/use-pricing';
import { cn } from '@/lib/utils';

/**
 * The checkout, from the basket to the hand-off.
 *
 * One sheet walks the whole flow — the lines, then only the steps the shop
 * actually asks for (details, a note, a location) — so the customer never
 * leaves the menu to place an order.
 */
export function CartSheet({
    onEditItem,
    notice,
}: {
    /**
     * Reopen a line in the product sheet. Absent for lines whose product has
     * since left the menu — there is nothing left to open them on.
     */
    onEditItem?: (item: CartItem) => void;
    /** A line about where this basket came from, e.g. a shared link. */
    notice?: string | null;
}) {
    const { items, open, setOpen, subtotalUsd } = useCart();
    const pricing = usePricing();
    // Only read when the shop is shut, but a hook cannot be called by halves.
    const opensLabel = nextOpeningLabel(useShop());

    const deliveryFeeUsd = pricing.deliveryFeeUsd;
    const totalUsd = subtotalUsd + (deliveryFeeUsd ?? 0);

    const checkout = useCheckout({
        items,
        pricing,
        subtotalUsd,
        deliveryFeeUsd,
        totalUsd,
    });

    const handleOpenChange = (next: boolean): void => {
        setOpen(next);

        if (!next) {
            checkout.reset();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="gap-0 overflow-y-hidden p-0">
                <DialogHeader className="shrink-0 px-4 pt-4 pb-3">
                    <DialogTitle className="pr-10">
                        {checkout.step === 'cart' ? 'Your order' : 'Checkout'}
                    </DialogTitle>
                    <DialogDescription>
                        {checkout.step === 'cart'
                            ? 'Sent to the shop on WhatsApp once you confirm.'
                            : 'A couple of details, then we hand you over.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                    {checkout.step === 'cart' && notice && (
                        <SharedNotice text={notice} />
                    )}

                    {checkout.step === 'cart' && (
                        <CartLines onEditItem={onEditItem} />
                    )}

                    {checkout.step === 'details' && (
                        <DetailsPanel checkout={checkout} />
                    )}

                    {checkout.step === 'note' && (
                        <NotePanel checkout={checkout} />
                    )}

                    {checkout.step === 'locating' && (
                        <StatusPanel
                            icon={
                                <LoaderCircle className="size-6 animate-spin" />
                            }
                            title="Finding your location"
                            body="Your browser may ask for permission. This takes a few seconds."
                        />
                    )}

                    {checkout.step === 'location-error' && (
                        <LocationErrorPanel checkout={checkout} />
                    )}

                    {checkout.step === 'sending' && (
                        <StatusPanel
                            icon={
                                <LoaderCircle className="size-6 animate-spin" />
                            }
                            title="Opening WhatsApp"
                            body="Your order is ready to send. Press send in the chat to place it."
                            action={
                                checkout.whatsappUrl === null ? undefined : (
                                    <a
                                        href={checkout.whatsappUrl}
                                        className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 font-display text-sm text-primary-foreground uppercase"
                                    >
                                        Open it manually
                                    </a>
                                )
                            }
                        />
                    )}
                </div>

                {checkout.step === 'cart' && items.length > 0 && (
                    <div className="shrink-0 border-t border-foreground/10 bg-card px-4 py-3.5">
                        <Totals
                            subtotalUsd={subtotalUsd}
                            deliveryFeeUsd={deliveryFeeUsd}
                            totalUsd={totalUsd}
                        />

                        <button
                            type="button"
                            onClick={checkout.startCheckout}
                            disabled={!checkout.canSend}
                            className="mt-3 h-14 w-full rounded-full bg-primary font-display text-xl text-primary-foreground uppercase transition-transform duration-200 ease-out hover:scale-[1.01] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99] disabled:scale-100 disabled:opacity-50 motion-reduce:transform-none"
                        >
                            Send order
                        </button>

                        {/* Two different closures, and the difference matters:
                            a shut shop reopens at a time we can name, while a
                            shop with nowhere to send an order does not. */}
                        {!checkout.shopOpen ? (
                            <p className="mt-2 text-center text-xs text-muted-foreground">
                                We&rsquo;re closed right now, so orders
                                can&rsquo;t be sent. Your basket keeps.
                                {opensLabel && ` ${opensLabel}.`}
                            </p>
                        ) : (
                            !checkout.canSend && (
                                <p className="mt-2 text-center text-xs text-muted-foreground">
                                    Ordering is closed right now.
                                </p>
                            )
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * How long the confirm stays armed before it disarms itself. Long enough to
 * read and answer, short enough that a basket left open on a counter is not
 * one tap from empty ten minutes later.
 */
const CONFIRM_HOLDS_MS = 8000;

/** How long the way back stays on offer after a basket is emptied. */
const UNDO_HOLDS_MS = 15000;

/** Every line in the basket, with its own quantity and note. */
function CartLines({ onEditItem }: { onEditItem?: (item: CartItem) => void }) {
    const {
        items,
        count,
        open,
        increment,
        decrement,
        removeItem,
        setNote,
        clear,
        restore,
    } = useCart();
    const pricing = usePricing();

    // Whether the clear has been asked and is waiting on an answer.
    const [confirming, setConfirming] = useState(false);
    // The basket as it was at the moment it was emptied, held so it can be put
    // back. This is what makes the whole thing safe: the confirm stops the
    // accident, and this undoes the one that gets through anyway.
    const [cleared, setCleared] = useState<CartItem[] | null>(null);

    useEffect(() => {
        if (!confirming) {
            return;
        }

        const timer = window.setTimeout(
            () => setConfirming(false),
            CONFIRM_HOLDS_MS,
        );

        return () => window.clearTimeout(timer);
    }, [confirming]);

    useEffect(() => {
        if (cleared === null) {
            return;
        }

        const timer = window.setTimeout(() => setCleared(null), UNDO_HOLDS_MS);

        return () => window.clearTimeout(timer);
    }, [cleared]);

    // Closing the sheet puts both away. A confirm still armed when the customer
    // comes back is a question they have forgotten answering, and an undo that
    // survives the trip is an offer to restore a basket they had moved on from.
    //
    // Tracked against the previous open state during render, as the product
    // sheet does, rather than in an effect that would fire a second pass.
    const [wasOpen, setWasOpen] = useState(open);

    if (open !== wasOpen) {
        setWasOpen(open);

        if (!open) {
            setConfirming(false);
            setCleared(null);
        }
    }

    const clearBasket = (): void => {
        setCleared(items);
        setConfirming(false);
        clear();
    };

    const undoClear = (): void => {
        if (cleared === null) {
            return;
        }

        restore(cleared);
        setCleared(null);
    };

    if (items.length === 0) {
        return (
            <div
                role="status"
                className="flex flex-col items-center gap-3 py-10 text-center"
            >
                <p className="text-sm text-muted-foreground">
                    {cleared === null
                        ? 'Nothing in your order yet.'
                        : 'Basket cleared.'}
                </p>

                {/* Offered for a good while, and worth more than the confirm
                    that came before it: a customer who has just watched their
                    order vanish needs a way back, not an explanation. */}
                {cleared !== null && (
                    <button
                        type="button"
                        onClick={undoClear}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold tracking-wide text-primary uppercase transition-colors duration-200 ease-out hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        <RotateCcw aria-hidden className="size-3.5" />
                        Undo
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
            <ul className="flex flex-col gap-2">
                {items.map((item) => (
                    <li
                        key={item.key}
                        className="flex flex-col gap-2 rounded-2xl bg-card p-2.5"
                    >
                        <div className="flex items-start gap-3">
                            <ProductImage
                                product={{ name: item.name, image: item.image }}
                                className="size-16 shrink-0"
                            />

                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-semibold uppercase">
                                    {item.name}
                                </span>

                                {item.variantName !== null && (
                                    <span className="text-xs text-muted-foreground uppercase">
                                        {item.variantName}
                                    </span>
                                )}

                                {item.addons.map((addon) => (
                                    <span
                                        key={addon.name}
                                        className="truncate text-xs text-muted-foreground"
                                    >
                                        + {addon.quantity}× {addon.name}
                                    </span>
                                ))}

                                {/* Said in full rather than truncated: this is the
                                one line on the row the kitchen has to get
                                right, and half of "no garlic, no onion" is
                                worse than none of it. */}
                                {item.excludedIngredients.length > 0 && (
                                    <span className="text-xs font-medium text-spicy">
                                        {withoutLabel(item.excludedIngredients)}
                                    </span>
                                )}

                                <span className="mt-1 text-sm font-semibold text-primary tabular-nums">
                                    {pricing.primary(
                                        cartItemUnitUsd(item) * item.quantity,
                                    )}
                                </span>
                            </div>

                            {/* Stacked rather than side by side, so the one that
                            throws the line away is never the one under a thumb
                            reaching for the one that changes it. */}
                            <div className="flex shrink-0 flex-col items-center gap-1">
                                {onEditItem && (
                                    <button
                                        type="button"
                                        onClick={() => onEditItem(item)}
                                        aria-label={`Change ${item.name}`}
                                        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 ease-out hover:bg-surface hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                    >
                                        <Pencil className="size-4" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => removeItem(item.key)}
                                    aria-label={`Remove ${item.name}`}
                                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 ease-out hover:bg-surface hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-surface p-0.5">
                                <button
                                    type="button"
                                    onClick={() => decrement(item.key)}
                                    aria-label={`Less ${item.name}`}
                                    className="flex size-8 items-center justify-center rounded-full text-primary transition-colors duration-200 ease-out hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                >
                                    <Minus className="size-3.5" />
                                </button>
                                <span className="w-6 text-center text-sm tabular-nums">
                                    {item.quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => increment(item.key)}
                                    aria-label={`More ${item.name}`}
                                    className="flex size-8 items-center justify-center rounded-full text-primary transition-colors duration-200 ease-out hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                >
                                    <Plus className="size-3.5" />
                                </button>
                            </div>

                            <input
                                type="text"
                                value={item.note ?? ''}
                                onChange={(event) =>
                                    setNote(item.key, event.target.value)
                                }
                                placeholder="Note, e.g. no onions"
                                aria-label={`Note for ${item.name}`}
                                className="min-w-0 flex-1 rounded-full bg-surface px-3.5 py-2 text-xs placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                            />
                        </div>
                    </li>
                ))}
            </ul>

            {/* At the foot of the list, which is the far side of every line the
                customer would lose — you have to scroll past the whole order to
                reach it. Quiet by default, and nowhere near the send button in
                the bar below.

                It asks in place rather than opening a second sheet on top of
                this one: a dialog over a dialog on a phone is a trap, and the
                question is one line long. */}
            <div className="flex items-center justify-between gap-3 pb-1">
                {confirming ? (
                    <div className="mx-auto flex items-center gap-1.5 rounded-full bg-surface p-1 pl-3.5">
                        <span className="pr-1 text-xs text-muted-foreground">
                            Clear{' '}
                            {count === 1
                                ? 'the one item'
                                : `all ${count} items`}
                            ?
                        </span>

                        {/* Keeping comes first and reads as the button; the one
                            that empties the basket is the plain word beside it.
                            The safe answer should be the easy one to hit. */}
                        <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors duration-200 ease-out hover:bg-card/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                            Keep
                        </button>

                        <button
                            type="button"
                            onClick={clearBasket}
                            className="rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide text-spicy uppercase transition-colors duration-200 ease-out hover:bg-spicy/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                            Clear
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Opposite ends of the row on purpose: the one that
                            sends the basket to a friend and the one that throws
                            it away should never be neighbours. */}
                        <ShareBasket />

                        <button
                            type="button"
                            onClick={() => setConfirming(true)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-200 ease-out hover:bg-surface hover:text-spicy focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                            <Trash2 aria-hidden className="size-3.5" />
                            Clear basket
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

/** How long "Link copied" stands before the button goes back to offering. */
const COPIED_HOLDS_MS = 2500;

/**
 * Send this basket to somebody else.
 *
 * The whole basket travels in the link, so the person who opens it gets the
 * order already built and only has to add their own to it — which is how a
 * table of six orders lunch without six people each filling in a menu, and how
 * one of them ends up sending the lot.
 *
 * The share sheet is offered first where the phone has one, since the link is
 * almost always going straight into a chat and that is one tap rather than
 * three. Everywhere else it goes to the clipboard and says so.
 */
function ShareBasket() {
    const { items } = useCart();
    const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

    useEffect(() => {
        if (state === 'idle') {
            return;
        }

        const timer = window.setTimeout(
            () => setState('idle'),
            COPIED_HOLDS_MS,
        );

        return () => window.clearTimeout(timer);
    }, [state]);

    const share = async (): Promise<void> => {
        const url = shareOrderUrl(items);

        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: 'My Stone House order', url });
            } catch {
                // Cancelling the share sheet lands here, and a customer who
                // changed their mind does not need to be told they did.
            }

            return;
        }

        try {
            await navigator.clipboard.writeText(url);
            setState('copied');
        } catch {
            setState('failed');
        }
    };

    return (
        <button
            type="button"
            onClick={() => void share()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-200 ease-out hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
            {state === 'copied' ? (
                <Check aria-hidden className="size-3.5" />
            ) : (
                <Share2 aria-hidden className="size-3.5" />
            )}
            {state === 'copied' && 'Link copied'}
            {state === 'failed' && 'Copy failed'}
            {state === 'idle' && 'Share basket'}
        </button>
    );
}

/**
 * Where this basket came from, said once at the top of it. Dismissible, because
 * it has done its job the moment it has been read.
 */
function SharedNotice({ text }: { text: string }) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) {
        return null;
    }

    return (
        <div className="flex items-start gap-2 rounded-2xl bg-primary/10 p-3 text-xs text-primary">
            <Users aria-hidden className="mt-px size-4 shrink-0" />
            <p className="flex-1">{text}</p>
            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
                className="-my-1 -mr-1 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ease-out hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}

function Totals({
    subtotalUsd,
    deliveryFeeUsd,
    totalUsd,
}: {
    subtotalUsd: number;
    deliveryFeeUsd: number | null;
    totalUsd: number;
}) {
    const pricing = usePricing();

    return (
        <dl className="flex flex-col gap-1 text-sm">
            {deliveryFeeUsd !== null && (
                <>
                    <Row
                        label="Subtotal"
                        value={pricing.primary(subtotalUsd)}
                    />
                    <Row
                        label="Delivery"
                        value={pricing.primary(deliveryFeeUsd)}
                    />
                </>
            )}

            <div className="flex items-baseline justify-between gap-3 font-semibold">
                <dt className="uppercase">Total</dt>
                <dd className="text-primary tabular-nums">
                    {pricing.primary(totalUsd)}
                </dd>
            </div>

            {pricing.showUsd && pricing.showLbp && (
                <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
                    <dt className="sr-only">Total in Lebanese Pounds</dt>
                    <dd className="ml-auto tabular-nums">
                        {pricing.lbp(totalUsd)}
                    </dd>
                </div>
            )}
        </dl>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3 text-muted-foreground">
            <dt>{label}</dt>
            <dd className="tabular-nums">{value}</dd>
        </div>
    );
}

type Checkout = ReturnType<typeof useCheckout>;

/** Name and phone, whichever of them the shop asks for. */
function DetailsPanel({ checkout }: { checkout: Checkout }) {
    return (
        <div className="flex flex-col gap-3">
            {checkout.requireFullName && (
                <Field
                    label="Your name"
                    value={checkout.name}
                    onChange={checkout.setName}
                    autoComplete="name"
                    placeholder="Full name"
                />
            )}

            {checkout.requirePhoneNumber && (
                <Field
                    label="Phone number"
                    value={checkout.phone}
                    onChange={checkout.setPhone}
                    autoComplete="tel"
                    type="tel"
                    placeholder="e.g. 71 123 456"
                />
            )}

            <StepButtons
                onBack={checkout.backToCart}
                onNext={checkout.confirmDetails}
                nextLabel="Continue"
                nextDisabled={!checkout.detailsValid}
            />
        </div>
    );
}

/** Anything to say about the order as a whole. Always optional. */
function NotePanel({ checkout }: { checkout: Checkout }) {
    return (
        <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
                <span className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                    Anything else? (optional)
                </span>
                <textarea
                    value={checkout.orderNote}
                    onChange={(event) =>
                        checkout.setOrderNote(event.target.value)
                    }
                    rows={3}
                    placeholder="Directions, allergies, anything the kitchen should know."
                    className="resize-none rounded-2xl bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                />
            </label>

            <StepButtons
                onBack={checkout.noteBack}
                onNext={checkout.confirmNote}
                nextLabel="Send on WhatsApp"
            />
        </div>
    );
}

/** The location lookup failed, so the customer chooses how to proceed. */
function LocationErrorPanel({ checkout }: { checkout: Checkout }) {
    return (
        <StatusPanel
            icon={<MapPin className="size-6" />}
            title={
                checkout.locationDenied
                    ? 'Location is blocked'
                    : "Couldn't pin you down"
            }
            body={
                checkout.locationDenied
                    ? 'Allow location for this site in your browser settings, or send the order and share a pin in the chat instead.'
                    : 'We could not get an accurate reading. Try again, or send the order and share a pin in the chat instead.'
            }
            action={
                <div className="flex w-full flex-col gap-2">
                    <button
                        type="button"
                        onClick={checkout.retryLocation}
                        className="h-12 w-full rounded-full bg-primary font-display text-sm text-primary-foreground uppercase focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        Try again
                    </button>
                    <button
                        type="button"
                        onClick={checkout.sendWithoutLocation}
                        className="h-12 w-full rounded-full bg-primary/10 text-sm font-semibold text-primary uppercase focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        Send without it
                    </button>
                </div>
            }
        />
    );
}

function StatusPanel({
    icon,
    title,
    body,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                {icon}
            </span>
            <span className="text-base font-semibold uppercase">{title}</span>
            <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
            {action}
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
    ...props
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    autoComplete?: string;
    placeholder?: string;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                {label}
            </span>
            <input
                {...props}
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="rounded-2xl bg-card px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            />
        </label>
    );
}

function StepButtons({
    onBack,
    onNext,
    nextLabel,
    nextDisabled = false,
}: {
    onBack: () => void;
    onNext: () => void;
    nextLabel: string;
    nextDisabled?: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 ease-out hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <ArrowLeft className="size-4" />
            </button>

            <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                className={cn(
                    'h-12 flex-1 rounded-full bg-primary font-display text-sm text-primary-foreground uppercase',
                    'transition-transform duration-200 ease-out hover:scale-[1.01] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.99]',
                    'disabled:scale-100 disabled:opacity-50 motion-reduce:transform-none',
                )}
            >
                {nextLabel}
            </button>
        </div>
    );
}
