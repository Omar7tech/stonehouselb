import {
    ArrowLeft,
    LoaderCircle,
    MapPin,
    Minus,
    Plus,
    Trash2,
} from 'lucide-react';

import { ProductImage } from '@/components/menu/product-image';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cartItemUnitUsd, useCart } from '@/contexts/cart-context';

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
export function CartSheet() {
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
                    {checkout.step === 'cart' && <CartLines />}

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

/** Every line in the basket, with its own quantity and note. */
function CartLines() {
    const { items, increment, decrement, removeItem, setNote } = useCart();
    const pricing = usePricing();

    if (items.length === 0) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                Nothing in your order yet.
            </p>
        );
    }

    return (
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

                            <span className="mt-1 text-sm font-semibold text-primary tabular-nums">
                                {pricing.primary(
                                    cartItemUnitUsd(item) * item.quantity,
                                )}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            aria-label={`Remove ${item.name}`}
                            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 ease-out hover:bg-surface hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                            <Trash2 className="size-4" />
                        </button>
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
