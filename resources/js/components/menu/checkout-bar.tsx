/**
 * The checkout call-to-action, riding along the bottom of the menu.
 *
 * It is sticky rather than fixed so it comes to rest inside the white panel at
 * the end of the list instead of hovering over the last product forever. The
 * gradient beneath it keeps the cards legible as they pass under.
 */
export function CheckoutBar({ itemCount }: { itemCount: number }) {
    return (
        <div className="sticky bottom-0 -mx-1 bg-gradient-to-t from-surface via-surface/95 to-transparent px-1 pt-6 pb-4">
            <button
                type="button"
                disabled={itemCount === 0}
                className="h-16 w-full rounded-full bg-primary font-display text-2xl text-primary-foreground uppercase shadow-lg transition-all duration-300 ease-out hover:shadow-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-px disabled:opacity-50 sm:text-3xl"
            >
                Check out
            </button>
        </div>
    );
}
