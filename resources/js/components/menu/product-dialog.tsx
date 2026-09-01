import {
    Clock,
    Flame,
    Leaf,
    Minus,
    Plus,
    ShoppingBag,
    Star,
} from 'lucide-react';
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
                    <ProductImage
                        product={product}
                        className="aspect-video w-full"
                    />
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-start gap-2 pr-8">
                            <span className="flex-1">{product.name}</span>

                            {product.isFeatured && (
                                <Star
                                    aria-label="Featured"
                                    className="mt-0.5 size-4 shrink-0 fill-current text-primary"
                                />
                            )}
                            {product.isSpicy && (
                                <Flame
                                    aria-label="Spicy"
                                    className="mt-0.5 size-4 shrink-0 text-primary"
                                />
                            )}
                            {product.isVegan && (
                                <Leaf
                                    aria-label="Vegan"
                                    className="mt-0.5 size-4 shrink-0 text-primary"
                                />
                            )}
                        </DialogTitle>

                        {product.subtitle !== null && (
                            <DialogDescription>
                                {product.subtitle}
                            </DialogDescription>
                        )}

                        {product.preparationTime !== null &&
                            product.preparationTime > 0 && (
                                <span className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[0.65rem] tracking-wide text-primary uppercase">
                                    <Clock className="size-3.5" />
                                    Ready in ~{product.preparationTime} min
                                </span>
                            )}
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
