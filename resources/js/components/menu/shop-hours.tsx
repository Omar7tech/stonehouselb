import {
    formatTime,
    hasPublishedHours,
    useShop,
    useShopOpen,
    weeklyHours,
} from '@/lib/shop';
import { cn } from '@/lib/utils';

/**
 * The week's opening hours, for the foot of the menu.
 *
 * Only drawn while the shop runs on the automatic schedule: in manual mode
 * there are no hours to publish, only a switch, and printing the untouched
 * nine-to-five default would be a promise the shop never made.
 *
 * Days sharing the same hours are run together into one line, today's is picked
 * out, and a live marker at the top says whether the door is open right now.
 * The marker is a filled dot against a hollow one rather than a second colour —
 * the slab is already the brand's one loud surface.
 */
export function ShopHours() {
    const shop = useShop();
    const open = useShopOpen();

    if (!hasPublishedHours(shop)) {
        return null;
    }

    const rows = weeklyHours(shop);

    return (
        <section
            aria-labelledby="footer-hours"
            className="relative mt-9 border-t border-slab-ink/20 pt-5"
        >
            <h2
                id="footer-hours"
                className="flex items-center gap-2 text-[0.65rem] tracking-[0.2em] uppercase"
            >
                <span className="opacity-70">Hours</span>

                <span className="flex items-center gap-1.5">
                    <span
                        aria-hidden
                        className={cn(
                            'size-1.5 rounded-full border border-slab-ink',
                            open ? 'bg-slab-ink' : 'bg-transparent',
                        )}
                    />
                    {open ? 'Open now' : 'Closed'}
                </span>
            </h2>

            <ul className="mt-3 flex flex-col gap-1.5">
                {rows.map((row) => (
                    <li
                        key={row.label}
                        className={cn(
                            'flex items-baseline justify-between gap-6 text-sm uppercase',
                            // Today is simply the one line at full strength;
                            // the rest of the week steps back behind it.
                            row.isToday ? 'opacity-100' : 'opacity-60',
                        )}
                    >
                        <span>{row.label}</span>

                        {row.isClosed ? (
                            <span className="opacity-70">Closed</span>
                        ) : (
                            <span className="tabular-nums">
                                {formatTime(row.opensAt)} –{' '}
                                {formatTime(row.closesAt)}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
