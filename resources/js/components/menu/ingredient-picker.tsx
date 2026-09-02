import { Check, RotateCcw, X } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * What is in the dish, and what the customer wants left out.
 *
 * Everything starts in, because that is how the dish is made — this asks the
 * customer to take something away, never to build the plate up from nothing.
 * A tapped ingredient reads as struck out rather than as merely unlit: "off"
 * and "not chosen yet" look alike, and only one of them is true here.
 *
 * Taking something out never changes the price. The kitchen makes the same dish
 * without one thing, so there is no money on these rows and none implied by
 * them — an ingredient that did change the price would be an extra, and extras
 * already have their own steppers with their own prices under them.
 *
 * Read-only on the dine-in menu, where there is no order to attach a choice to:
 * the list is still worth reading, so it is drawn plainly instead of being
 * offered as a control that leads nowhere.
 */
export function IngredientPicker({
    ingredients,
    excluded,
    onToggle,
    onReset,
}: {
    ingredients: readonly string[];
    /** The names currently left out. */
    excluded: readonly string[];
    /** Absent on the dine-in menu, which turns the list read-only. */
    onToggle?: (name: string) => void;
    onReset?: () => void;
}) {
    const removedCount = excluded.length;
    const isEditable = onToggle !== undefined;
    const isEmptied =
        ingredients.length > 0 && removedCount >= ingredients.length;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                    Ingredients
                </span>

                {/* Only once there is something to undo, and it says how much
                    it would undo — a customer three taps in wants to know the
                    button puts all three back, not just the last one. */}
                {isEditable && removedCount > 0 && onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[0.65rem] tracking-wide text-primary uppercase transition-colors duration-200 ease-out hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        <RotateCcw aria-hidden className="size-3" />
                        Put {removedCount} back
                    </button>
                )}
            </div>

            {isEditable &&
                (isEmptied ? (
                    /* Allowed, not blocked: a customer who wants the bread and
                       nothing else is entitled to ask, and a shop that can't do
                       it will say so when the order reaches them. What is not
                       allowed is doing it by accident — three taps down a list
                       and everything is gone without a word said about it. */
                    <p className="text-xs font-medium text-spicy">
                        That&rsquo;s everything out. The kitchen may check with
                        you before making it.
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        All in by default — tap anything you&rsquo;d rather
                        leave out.
                    </p>
                ))}

            <ul className="flex flex-wrap gap-1.5">
                {ingredients.map((ingredient) => {
                    const isOut = excluded.includes(ingredient);

                    if (!isEditable) {
                        return (
                            <li
                                key={ingredient}
                                className="rounded-full bg-card px-3 py-1.5 text-xs"
                            >
                                {ingredient}
                            </li>
                        );
                    }

                    return (
                        <li key={ingredient}>
                            <button
                                type="button"
                                onClick={() => onToggle(ingredient)}
                                aria-pressed={!isOut}
                                // The label says what the button will do, not
                                // what it shows: a screen reader lands on
                                // "Remove garlic", presses it, and hears
                                // "Add garlic back" — which is the state
                                // change, spoken.
                                aria-label={
                                    isOut
                                        ? `Add ${ingredient} back`
                                        : `Remove ${ingredient}`
                                }
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full py-1.5 pr-3 pl-2.5 text-xs',
                                    'transition-colors duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                                    isOut
                                        ? 'bg-surface text-muted-foreground line-through'
                                        : 'bg-primary/10 text-primary hover:bg-primary/20',
                                )}
                            >
                                {isOut ? (
                                    <X aria-hidden className="size-3.5" />
                                ) : (
                                    <Check aria-hidden className="size-3.5" />
                                )}
                                {ingredient}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

/**
 * What was left out, said the way the kitchen needs to read it: one line
 * wherever a cart line is drawn, and the same wording in the order message.
 *
 * The "no" is repeated per ingredient — "No garlic, no onion" rather than "No
 * garlic, onion" — because the short form is one comma away from reading as a
 * list of what to put in, and the pass reading it is busy.
 */
export function withoutLabel(excluded: readonly string[]): string {
    return excluded
        .map((ingredient) => `No ${ingredient.toLowerCase()}`)
        .join(', ');
}
