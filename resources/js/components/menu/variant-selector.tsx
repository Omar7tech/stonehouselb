import { Check } from 'lucide-react';
import { useRef } from 'react';

import { usePricing } from '@/lib/use-pricing';
import { cn } from '@/lib/utils';
import type { Variant } from '@/types';

/** Arrow keys that move the selection forward through the option list. */
const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];
/** Arrow keys that move the selection backward through the option list. */
const PREVIOUS_KEYS = ['ArrowLeft', 'ArrowUp'];

/**
 * The sizes a product is sold in, as a wrapping list of options.
 *
 * Not a segmented control: the options never share one row's width, so a long
 * name is shown in full instead of being truncated, and each one carries its
 * own price — the difference between the sizes is visible before choosing.
 *
 * It behaves as a radio group: one tab stop, arrow keys move between options,
 * Home and End jump to the ends.
 *
 * The same picker serves the card and the sheet, so choosing on one and opening
 * the other never disagree.
 */
export function VariantSelector({
    variants,
    selectedIndex,
    onSelect,
}: {
    variants: readonly Variant[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}) {
    const pricing = usePricing();
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

    /** Selects an option and keeps the roving focus on it. */
    const move = (index: number): void => {
        const wrapped = (index + variants.length) % variants.length;

        onSelect(wrapped);
        optionRefs.current[wrapped]?.focus();
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>,
    ): void => {
        if (NEXT_KEYS.includes(event.key)) {
            event.preventDefault();
            move(selectedIndex + 1);

            return;
        }

        if (PREVIOUS_KEYS.includes(event.key)) {
            event.preventDefault();
            move(selectedIndex - 1);

            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            move(0);

            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            move(variants.length - 1);
        }
    };

    return (
        // Named for readers but not on screen: each option already carries its
        // own name and price, so a heading over them only says again what the
        // row is plainly showing.
        <div
            role="radiogroup"
            aria-label="Choose an option"
            onKeyDown={handleKeyDown}
            className="flex flex-wrap gap-2"
        >
            {variants.map((variant, index) => {
                const selected = index === selectedIndex;
                const effectivePrice = variant.discountPrice ?? variant.price;

                return (
                    <button
                        key={variant.name}
                        ref={(element) => {
                            optionRefs.current[index] = element;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        // Only the selected option stays in the tab order;
                        // arrow keys reach the rest.
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onSelect(index)}
                        className={cn(
                            'flex min-w-32 flex-1 basis-[calc(50%-0.25rem)] items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left',
                            'transition-colors duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                            selected
                                ? 'bg-primary/10 ring-2 ring-primary'
                                : 'bg-primary/5 hover:bg-primary/10',
                        )}
                    >
                        <span
                            aria-hidden
                            className={cn(
                                'grid size-4 shrink-0 place-items-center rounded-full transition-colors duration-200 ease-out',
                                selected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'ring-2 ring-foreground/20 ring-inset',
                            )}
                        >
                            {selected && (
                                <Check className="size-2.5" strokeWidth={3} />
                            )}
                        </span>

                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span
                                className={cn(
                                    'text-sm leading-snug tracking-wide break-words uppercase',
                                    selected
                                        ? 'font-semibold text-primary'
                                        : 'text-primary/70',
                                )}
                            >
                                {variant.name}
                            </span>

                            <span className="flex flex-wrap items-baseline gap-x-1.5 text-[0.8rem] leading-none">
                                <span
                                    className={cn(
                                        'font-semibold tabular-nums',
                                        selected
                                            ? 'text-primary'
                                            : 'text-primary/60',
                                    )}
                                >
                                    {pricing.primary(effectivePrice)}
                                </span>

                                {variant.discountPrice !== null && (
                                    <span className="text-[0.7rem] text-muted-foreground tabular-nums line-through">
                                        {pricing.primary(variant.price)}
                                    </span>
                                )}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
