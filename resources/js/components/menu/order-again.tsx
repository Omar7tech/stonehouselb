import { RotateCcw } from 'lucide-react';

import { ProductImage } from '@/components/menu/product-image';
import { cartItemUnitUsd } from '@/contexts/cart-context';
import type { CartItem } from '@/contexts/cart-context';
import { usePricing } from '@/lib/use-pricing';

/** How many dishes get a photo before the rest become a count. */
const FACES_SHOWN = 3;

/**
 * The last order, offered back.
 *
 * A snack shop lives on the same people ordering the same thing, and the fastest
 * menu in the world is still slower than not using it. So the order that was
 * sent last is kept, read back against today's menu, and put at the top of the
 * page as one button.
 *
 * What it shows is the rebuilt order rather than the remembered one — today's
 * prices, today's names, and only the dishes still being sold — because the
 * figure on this card is what the basket will actually come to.
 */
export function OrderAgain({
    items,
    sentAt,
    usual,
    dropped,
    onReorder,
}: {
    /** The past order as it stands on today's menu. Never empty. */
    items: readonly CartItem[];
    /** When it was sent, in epoch milliseconds. */
    sentAt: number;
    /** Whether this same order has been sent more than once. */
    usual: boolean;
    /** How many lines the menu can no longer honour. */
    dropped: number;
    onReorder: () => void;
}) {
    const pricing = usePricing();

    const count = items.reduce((total, item) => total + item.quantity, 0);
    const totalUsd = items.reduce(
        (total, item) => total + cartItemUnitUsd(item) * item.quantity,
        0,
    );

    const faces = items.slice(0, FACES_SHOWN);
    const rest = items.length - faces.length;

    return (
        <section
            aria-label="Order again"
            className="flex flex-col gap-3 rounded-2xl bg-card p-3"
        >
            <div className="flex items-baseline justify-between gap-3">
                {/* An order sent more than once is a habit, and calling it one
                    is the difference between a feature and a shortcut the
                    customer recognises as theirs. */}
                <span className="text-[0.65rem] tracking-[0.18em] text-primary uppercase">
                    {usual ? 'Your usual' : 'Last order'}
                </span>
                <span className="shrink-0 text-[0.65rem] tracking-wide text-muted-foreground uppercase">
                    {whenLabel(sentAt)}
                </span>
            </div>

            <div className="flex items-center gap-3">
                {/* Overlapped, so three dishes take the room of two and the row
                    reads as one order rather than a list of them. */}
                <div className="flex shrink-0 -space-x-3">
                    {faces.map((item) => (
                        <ProductImage
                            key={item.key}
                            product={{ name: item.name, image: item.image }}
                            className="size-11 rounded-full ring-2 ring-card"
                            markClassName="w-8"
                        />
                    ))}

                    {rest > 0 && (
                        <span className="flex size-11 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted-foreground tabular-nums ring-2 ring-card">
                            +{rest}
                        </span>
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold uppercase">
                        {items.map((item) => item.name).join(', ')}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                        {count === 1 ? '1 item' : `${count} items`}
                        {' · '}
                        <span className="tabular-nums">
                            {pricing.primary(totalUsd)}
                        </span>
                    </span>
                </div>
            </div>

            {/* Its own row, so a long price in pounds has the width it needs
                rather than fighting the summary beside it. */}
            <button
                type="button"
                onClick={onReorder}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2.5 text-xs font-semibold tracking-wide text-primary uppercase transition-colors duration-200 ease-out hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <RotateCcw aria-hidden className="size-3.5" />
                Order again
            </button>

            {/* Said here rather than after the fact: the customer should know
                what they are about to get before they press, not find a
                shorter basket afterwards and wonder what happened. */}
            {dropped > 0 && (
                <p className="text-center text-[0.7rem] text-muted-foreground">
                    {dropped === 1
                        ? 'One dish from that order is no longer on the menu.'
                        : `${dropped} dishes from that order are no longer on the menu.`}
                </p>
            )}
        </section>
    );
}

/**
 * Roughly how long ago, in the words people use. Precision is not the point —
 * "3 days ago" tells the customer whether this is the order they are thinking
 * of, and a timestamp would not.
 */
function whenLabel(sentAt: number): string {
    const days = Math.floor((Date.now() - sentAt) / 86_400_000);

    if (days <= 0) {
        return 'Today';
    }

    if (days === 1) {
        return 'Yesterday';
    }

    if (days < 7) {
        return `${days} days ago`;
    }

    if (days < 14) {
        return 'Last week';
    }

    if (days < 60) {
        return `${Math.floor(days / 7)} weeks ago`;
    }

    return 'A while ago';
}
