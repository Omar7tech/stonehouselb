import { Check, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useCart } from '@/contexts/cart-context';
import { cn } from '@/lib/utils';

/** How long the confirmation stays up before it takes itself away. */
const DISMISS_AFTER_MS = 2600;

/**
 * Longer when there is something on it worth reading and acting on. Long enough
 * to notice a second button, read it and reach it — and still short enough that
 * it is gone before it is in the way.
 */
const DISMISS_WITH_ACTION_MS = 5000;

/**
 * The "added" confirmation, riding just above the checkout button.
 *
 * Opening the whole order on every add would interrupt someone building a
 * larger one, so an add says so in passing and leaves them where they were.
 * There is a way through on it for the moment they are done.
 */
export function CartToast({
    onCustomise,
}: {
    /**
     * Reopen the line just added, for a dish there is something to choose
     * about. Absent when the dish is made one way only, which leaves the
     * confirmation as the plain "added" it has always been.
     */
    onCustomise?: (key: string) => void;
}) {
    const { lastAdded, count, setOpen } = useCart();

    // Which add has been dismissed, by timeout or by pressing through. The
    // toast shows while the latest add isn't the dismissed one — deriving
    // visibility keeps the effect free of a synchronous setState.
    const [dismissedNonce, setDismissedNonce] = useState<number | null>(null);

    const visible = lastAdded !== null && lastAdded.nonce !== dismissedNonce;
    // `lastAdded` is never cleared, so the name stays put through the fade-out
    // instead of the toast emptying as it goes.
    const name = lastAdded?.name ?? '';

    // Schedule the auto-dismiss for each new add. The state change happens in
    // the timeout, not in the effect body.
    useEffect(() => {
        if (lastAdded === null) {
            return;
        }

        const { nonce } = lastAdded;
        const timeout = window.setTimeout(
            () => setDismissedNonce(nonce),
            onCustomise ? DISMISS_WITH_ACTION_MS : DISMISS_AFTER_MS,
        );

        return () => window.clearTimeout(timeout);
    }, [lastAdded, onCustomise]);

    const dismiss = (): void => {
        if (lastAdded !== null) {
            setDismissedNonce(lastAdded.nonce);
        }
    };

    const handleView = (): void => {
        dismiss();
        setOpen(true);
    };

    const handleCustomise = (): void => {
        if (lastAdded === null || onCustomise === undefined) {
            return;
        }

        dismiss();
        onCustomise(lastAdded.key);
    };

    return (
        // `aria-live` rather than a role, so a reader hears the add without the
        // focus being taken off whatever was just pressed.
        <div
            aria-live="polite"
            className={cn(
                'pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4',
                // Named rather than `all`: these two are the only properties
                // that change, and both are ones the compositor can animate on
                // its own without the page being painted again. `all` would
                // have the browser watch every property for a change it is
                // never going to see.
                'transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none',
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-3 opacity-0',
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-2.5 rounded-full bg-card py-2 pr-2 pl-3 shadow-[0_16px_36px_-18px_rgb(0_0_0/0.55)]',
                    visible && 'pointer-events-auto',
                )}
            >
                <span
                    aria-hidden
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                    <Check className="size-3.5" strokeWidth={3} />
                </span>

                <span
                    className={cn(
                        'truncate text-sm sm:max-w-xs',
                        onCustomise ? 'max-w-[28vw]' : 'max-w-[42vw]',
                    )}
                >
                    Added {name}
                </span>

                {/* The one moment a customer who used the corner button finds
                    out the dish could have been changed. It is offered rather
                    than forced: the add already happened, this only says it can
                    still be undone, and saying nothing at all is how someone
                    ends up with the onions they didn't want. */}
                {onCustomise && (
                    <button
                        type="button"
                        onClick={handleCustomise}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1.5 text-[0.7rem] font-semibold tracking-wide text-primary uppercase transition-colors duration-200 ease-out hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        <SlidersHorizontal aria-hidden className="size-3" />
                        Change
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleView}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[0.7rem] font-semibold tracking-wide text-primary-foreground uppercase transition-transform duration-200 ease-out hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
                >
                    View
                    <span className="tabular-nums">
                        {count > 99 ? '99+' : count}
                    </span>
                </button>
            </div>
        </div>
    );
}
