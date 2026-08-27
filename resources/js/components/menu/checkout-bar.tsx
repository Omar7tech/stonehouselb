import { useCart } from '@/contexts/cart-context';
import { usePricing } from '@/lib/use-pricing';

/**
 * The checkout call-to-action, riding along the bottom of the menu.
 *
 * It is sticky rather than fixed so it comes to rest inside the panel at the
 * end of the list instead of hovering over the last product forever.
 *
 * Nothing is painted behind it: only the button itself covers the list, so the
 * cards stay whole right up to its edge and simply pass behind it. A backdrop
 * here would swallow a band of the list before it ever reached the button.
 *
 * It carries no empty state of its own — the menu only mounts it once the cart
 * has something in it, so there is never a checkout to offer that leads nowhere.
 */
export function CheckoutBar() {
    const { count, subtotalUsd, setOpen } = useCart();
    const pricing = usePricing();

    return (
        <div className="pointer-events-none sticky bottom-0 pt-2 pb-4">
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="pointer-events-auto flex h-16 w-full items-center justify-between gap-3 rounded-full bg-primary px-6 text-primary-foreground shadow-lg transition-all duration-300 ease-out hover:shadow-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px"
            >
                <span className="font-display text-2xl uppercase sm:text-3xl">
                    Check out
                </span>

                {/* The count and the running total, so the button says what is
                    waiting rather than only where it leads. */}
                <span className="flex shrink-0 items-baseline gap-2 text-sm tabular-nums">
                    <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5">
                        {count}
                    </span>
                    {pricing.primary(subtotalUsd)}
                </span>
            </button>
        </div>
    );
}
