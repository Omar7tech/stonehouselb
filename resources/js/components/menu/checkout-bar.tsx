import { useCart } from '@/contexts/cart-context';

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
 *
 * It says only where it goes. The count and the running total are the cart
 * strip's job, at the top of the page where the order itself is — splitting
 * them across both would have the page quoting its own total twice.
 */
export function CheckoutBar() {
    const { setOpen } = useCart();

    return (
        <div className="pointer-events-none sticky bottom-0 pt-2 pb-4">
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="pointer-events-auto h-16 w-full rounded-full bg-primary font-display text-2xl text-primary-foreground uppercase shadow-lg transition-all duration-300 ease-out hover:shadow-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px sm:text-3xl"
            >
                Check out
            </button>
        </div>
    );
}
