import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useCart } from '@/contexts/cart-context';
import { cn } from '@/lib/utils';

/** How long the confirmation stays up before it takes itself away. */
const DISMISS_AFTER_MS = 2600;

/**
 * The "added" confirmation, riding just above the checkout button.
 *
 * Opening the whole order on every add would interrupt someone building a
 * larger one, so an add says so in passing and leaves them where they were.
 * There is a way through on it for the moment they are done.
 */
export function CartToast() {
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
            DISMISS_AFTER_MS,
        );

        return () => window.clearTimeout(timeout);
    }, [lastAdded]);

    const handleView = (): void => {
        if (lastAdded !== null) {
            setDismissedNonce(lastAdded.nonce);
        }

        setOpen(true);
    };

    return (
        // `aria-live` rather than a role, so a reader hears the add without the
        // focus being taken off whatever was just pressed.
        <div
            aria-live="polite"
            className={cn(
                'pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4',
                'transition-all duration-300 ease-out motion-reduce:transition-none',
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

                <span className="max-w-[42vw] truncate text-sm sm:max-w-xs">
                    Added {name}
                </span>

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
