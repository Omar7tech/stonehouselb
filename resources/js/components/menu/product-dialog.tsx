import {
    Clock,
    Flame,
    Leaf,
    Minus,
    Plus,
    ShoppingBag,
    Star,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ProductImage } from '@/components/menu/product-image';
import { ProductPrice } from '@/components/menu/product-price';
import { VariantSelector } from '@/components/menu/variant-selector';
import { StretchText } from '@/components/stretch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { CartAddon } from '@/contexts/cart-context';
import { usePricing } from '@/lib/use-pricing';
import { cn } from '@/lib/utils';
import type { Addon, Product } from '@/types';

/**
 * Everything about one product, in a sheet: the photo, the full copy, the size
 * picker, the category's extras with steppers, and how many of it to add.
 *
 * `onAdd` is what separates the two menus, as on the card — delivery passes a
 * handler and gets the add button, dine-in passes nothing and the sheet is
 * there to read.
 */
export function ProductDialog({
    product,
    addons,
    initialVariantIndex,
    open,
    onOpenChange,
    onAdd,
}: {
    product: Product | null;
    /** Extras from the product's category; empty when none are configured. */
    addons: readonly Addon[];
    /** The size chosen on the card, so the sheet opens on the same one. */
    initialVariantIndex: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd?: (input: {
        variantIndex: number | null;
        addons: CartAddon[];
        quantity: number;
    }) => void;
}) {
    const pricing = usePricing();

    const [variantIndex, setVariantIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    // Quantity chosen per add-on, indexed alongside `addons`.
    const [addonQuantities, setAddonQuantities] = useState<number[]>([]);

    // Start clean each time the sheet opens. Tracked during render via the
    // previous open state, so no effect fires a synchronous update.
    const [wasOpen, setWasOpen] = useState(open);

    if (open !== wasOpen) {
        setWasOpen(open);

        if (open) {
            setVariantIndex(initialVariantIndex ?? 0);
            setQuantity(1);
            setAddonQuantities(addons.map(() => 0));
        }
    }

    const selectedAddons = useMemo<CartAddon[]>(
        () =>
            addons
                .map((addon, index) => ({
                    name: addon.name,
                    price: addon.price,
                    quantity: addonQuantities[index] ?? 0,
                }))
                .filter((addon) => addon.quantity > 0),
        [addons, addonQuantities],
    );

    // The dialog is always mounted so it can animate out; there is simply
    // nothing to draw until a product has been picked.
    if (product === null) {
        return <Dialog open={open} onOpenChange={onOpenChange} />;
    }

    const variants = product.variants;
    const hasVariants = variants.length > 0;
    const selectedVariant = hasVariants ? variants[variantIndex] : null;
    const basePrice = selectedVariant?.price ?? product.price;
    const discountPrice =
        selectedVariant?.discountPrice ??
        (hasVariants ? null : product.discountPrice);

    const extrasUsd = selectedAddons.reduce(
        (total, addon) => total + addon.price * addon.quantity,
        0,
    );

    const setAddonQuantity = (index: number, next: number): void => {
        setAddonQuantities((previous) => {
            const updated = [...previous];
            updated[index] = Math.max(0, next);

            return updated;
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* The panel itself doesn't scroll: the photo and the price footer
                stay put, and only the middle column travels. */}
            <DialogContent className="gap-0 overflow-y-hidden p-0">
                <div className="shrink-0 p-3 pt-1 sm:pt-3">
                    {/* The one place worth the whole photo: this runs the width
                        of the sheet, where the 400px cut would show its
                        pixels. */}
                    <ProductImage
                        product={product}
                        full
                        className="aspect-video w-full"
                    />
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="pr-8">
                            {product.name}
                        </DialogTitle>

                        {product.subtitle !== null && (
                            <DialogDescription>
                                {product.subtitle}
                            </DialogDescription>
                        )}

                        {/* Read before they are read: heat and diet are the two
                            things a customer scans a dish for, so they are
                            spelled out and coloured rather than left as three
                            identical marks tucked beside the name.

                            Wraps, so a dish that is all four doesn't push the
                            last tag off the edge of the sheet. */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 empty:hidden">
                            {product.isFeatured && (
                                <Tag
                                    icon={Star}
                                    label="Featured"
                                    className="bg-primary/10 text-primary"
                                    iconClassName="fill-current"
                                />
                            )}
                            {product.isSpicy && (
                                <Tag
                                    icon={Flame}
                                    label="Spicy"
                                    className="bg-spicy/10 text-spicy"
                                />
                            )}
                            {product.isVegan && (
                                <Tag
                                    icon={Leaf}
                                    label="Vegan"
                                    className="bg-vegan/10 text-vegan"
                                />
                            )}
                            {product.preparationTime !== null &&
                                product.preparationTime > 0 && (
                                    <Tag
                                        icon={Clock}
                                        label={`Ready in ~${product.preparationTime} min`}
                                        className="bg-primary/10 text-primary"
                                    />
                                )}
                            {/* Only ever on the sheet, never the card: it is a
                                figure you look up once you are already reading
                                the dish, not one you scan a row of them by.

                                Zero is a real count for a black coffee, so this
                                asks only whether the kitchen filled it in. */}
                            {product.calories !== null && (
                                <Tag
                                    icon={Zap}
                                    label={`${product.calories} kcal`}
                                    className="bg-primary/10 text-primary"
                                />
                            )}
                        </div>
                    </DialogHeader>

                    {product.description !== null && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {product.description}
                        </p>
                    )}

                    {hasVariants && (
                        <VariantSelector
                            variants={variants}
                            selectedIndex={variantIndex}
                            onSelect={setVariantIndex}
                        />
                    )}

                    {addons.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">
                                Extras
                            </span>

                            <ul className="flex flex-col gap-1.5">
                                {addons.map((addon, index) => {
                                    const addonQuantity =
                                        addonQuantities[index] ?? 0;

                                    return (
                                        <li
                                            key={addon.name}
                                            className="flex items-center justify-between gap-3 rounded-2xl bg-card py-2 pr-2 pl-3.5"
                                        >
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm">
                                                    {addon.name}
                                                </span>
                                                <span className="text-xs text-primary">
                                                    {pricing.primary(
                                                        addon.price,
                                                    )}
                                                </span>
                                            </div>

                                            {/* Steppers only make sense when
                                                the extras can be ordered. */}
                                            {onAdd && (
                                                <Stepper
                                                    value={addonQuantity}
                                                    min={0}
                                                    label={addon.name}
                                                    onChange={(next) =>
                                                        setAddonQuantity(
                                                            index,
                                                            next,
                                                        )
                                                    }
                                                />
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Fixed footer: the price and the action stay in view however
                    long the copy runs. */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-foreground/10 bg-card px-4 py-3.5">
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <ProductPrice
                            price={basePrice}
                            discountPrice={discountPrice}
                        />

                        {onAdd && (
                            <Stepper
                                value={quantity}
                                min={1}
                                label={product.name}
                                onChange={setQuantity}
                            />
                        )}
                    </div>

                    {onAdd && (
                        <button
                            type="button"
                            onClick={() =>
                                onAdd({
                                    variantIndex: hasVariants
                                        ? variantIndex
                                        : null,
                                    addons: selectedAddons,
                                    quantity,
                                })
                            }
                            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-3 font-display text-sm text-primary-foreground uppercase transition-transform duration-200 ease-out hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
                        >
                            <ShoppingBag className="size-4" />
                            {/* Ligatures off, or Stretch Pro reads the `DD` of
                                "ADD" as one double-width D. */}
                            <StretchText>Add</StretchText>
                            {extrasUsd > 0 && (
                                <span className="text-primary-foreground/70">
                                    +{pricing.primary(extrasUsd)}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * One fact about the dish, said in a word and a mark.
 *
 * The colour lives on the caller rather than in a variant map here: there are
 * only ever a handful of these, and a `bg-x/10 text-x` pair at the call site is
 * plainer to read than a lookup a name has to be resolved through.
 */
function Tag({
    icon: Icon,
    label,
    className,
    iconClassName,
}: {
    icon: LucideIcon;
    label: string;
    className: string;
    iconClassName?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] font-medium tracking-wide uppercase',
                className,
            )}
        >
            <Icon aria-hidden className={cn('size-3.5', iconClassName)} />
            {label}
        </span>
    );
}

/** A minus/count/plus control, used for both the extras and the quantity. */
function Stepper({
    value,
    min,
    label,
    onChange,
}: {
    value: number;
    min: number;
    label: string;
    onChange: (next: number) => void;
}) {
    return (
        <div className="flex w-fit shrink-0 items-center gap-0.5 rounded-full bg-surface p-0.5">
            <button
                type="button"
                onClick={() => onChange(value - 1)}
                disabled={value <= min}
                aria-label={`Less ${label}`}
                className="flex size-8 items-center justify-center rounded-full text-primary transition-colors duration-200 ease-out hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:text-primary/30 disabled:hover:bg-transparent"
            >
                <Minus className="size-3.5" />
            </button>

            <span className="w-6 text-center text-sm tabular-nums">
                {value}
            </span>

            <button
                type="button"
                onClick={() => onChange(value + 1)}
                aria-label={`More ${label}`}
                className="flex size-8 items-center justify-center rounded-full text-primary transition-colors duration-200 ease-out hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <Plus className="size-3.5" />
            </button>
        </div>
    );
}
