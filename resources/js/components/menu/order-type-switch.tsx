import { Link } from '@inertiajs/react';
import { Bike, UtensilsCrossed } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { OrderType } from '@/types';

const OPTIONS = [
    {
        type: 'dine_in',
        label: 'Dine in',
        href: '/menu/dine-in',
        icon: UtensilsCrossed,
    },
    {
        type: 'delivery',
        label: 'Delivery',
        href: '/menu/delivery',
        icon: Bike,
    },
] as const;

/**
 * Segmented toggle for moving between the dine-in and delivery menus.
 *
 * The two options share an equal-width grid so one orange pill can slide
 * between them, rather than the labels flipping colour on the spot — the
 * movement is what says these are two views of the same menu.
 */
export function OrderTypeSwitch({ current }: { current: OrderType }) {
    const activeIndex = Math.max(
        OPTIONS.findIndex((option) => option.type === current),
        0,
    );

    return (
        <div className="relative grid shrink-0 grid-cols-2 gap-1 rounded-full border border-primary/20 bg-primary/10 p-1">
            {/* The pill tracks the active option. Its width is one grid
                column: half the box, less the padding and half the gap. */}
            <span
                aria-hidden
                style={{
                    transform:
                        activeIndex === 0
                            ? 'translateX(0)'
                            : 'translateX(calc(100% + 0.25rem))',
                }}
                className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.375rem)] rounded-full bg-primary shadow-sm transition-transform duration-400 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
            />

            {OPTIONS.map(({ type, label, href, icon: Icon }) => {
                const isActive = current === type;

                return (
                    <Link
                        key={type}
                        href={href}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                            'relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[0.65rem] tracking-wider uppercase transition-colors duration-300 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:px-4 sm:text-xs',
                            isActive
                                ? 'text-primary-foreground'
                                : 'text-primary/60 hover:text-primary',
                        )}
                    >
                        <Icon
                            className={cn(
                                'size-3.5 transition-transform duration-300',
                                isActive && 'scale-110',
                            )}
                        />
                        <span className="hidden sm:inline">{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
