import { ProductPrice } from '@/components/menu/product-price';
import { cn } from '@/lib/utils';
import type { Variant } from '@/types';

/**
 * The sizes a product is sold in, one row each with its own price.
 *
 * A radio group rather than a row of pills: the price is what the customer is
 * choosing between, and it needs the width to be read.
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
    return (
        <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                Size
            </legend>

            <div className="flex flex-col gap-1.5">
                {variants.map((variant, index) => {
                    const isSelected = index === selectedIndex;

                    return (
                        <label
                            key={variant.name}
                            className={cn(
                                'flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-card px-3.5 py-2.5 transition-colors duration-200 ease-out',
                                'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                                isSelected
                                    ? 'ring-2 ring-primary'
                                    : 'hover:bg-card/60',
                            )}
                        >
                            <span className="flex min-w-0 items-center gap-2.5">
                                {/* The dot is drawn rather than native, so it
                                    takes the brand orange in every browser. */}
                                <span
                                    aria-hidden
                                    className={cn(
                                        'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ease-out',
                                        isSelected
                                            ? 'border-primary'
                                            : 'border-foreground/25',
                                    )}
                                >
                                    {isSelected && (
                                        <span className="size-2 rounded-full bg-primary" />
                                    )}
                                </span>

                                <input
                                    type="radio"
                                    name="variant"
                                    className="sr-only"
                                    checked={isSelected}
                                    onChange={() => onSelect(index)}
                                />

                                <span className="truncate text-sm font-medium uppercase">
                                    {variant.name}
                                </span>
                            </span>

                            <ProductPrice
                                price={variant.price}
                                discountPrice={variant.discountPrice}
                                className="shrink-0"
                            />
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
