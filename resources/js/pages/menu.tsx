import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { CartStrip } from '@/components/menu/cart-strip';
import { CategoryPills } from '@/components/menu/category-pills';
import { CheckoutBar } from '@/components/menu/checkout-bar';
import { ProductCard } from '@/components/menu/product-card';
import { SiteHeader } from '@/components/menu/site-header';
import { StoneWallBackdrop } from '@/components/stone-wall-backdrop';
import { Stretch, StretchText } from '@/components/stretch';
import { CATEGORIES, INITIAL_CART, PRODUCTS } from '@/lib/menu-placeholder';
import { cn } from '@/lib/utils';
import type { CartLine, OrderType, Product } from '@/types';

interface MenuProps {
    orderType: OrderType;
    orderTypeLabel: string;
}

/**
 * Width of "CHOOSE YOUR CRAVING." set in StretchPro, measured from the font's
 * own advance widths with the wide H counted as the single ligature glyph it
 * renders as. Dividing the space the line has by this gives the size at which
 * it spans that space exactly.
 */
const HEADING_EM = 20.565;

/**
 * So the heading is sized from the page rather than from a type scale: it grows
 * with the viewport and always fills the line instead of wrapping.
 *
 * `100vw` less the panel's own margins and padding is what the line actually
 * has, with a little taken off so a desktop scrollbar can't tip it into an
 * overflow. The ceiling is where the panel stops widening at `max-w-2xl`.
 */
const HEADING_SIZE = `clamp(0.8rem, calc((100vw - 3.5rem) / ${HEADING_EM}), 1.85rem)`;

export default function Menu({ orderType, orderTypeLabel }: MenuProps) {
    // Delivery is the menu you order from; dine-in is the same menu to read.
    const canOrder = orderType === 'delivery';

    const [activeCategoryId, setActiveCategoryId] = useState(CATEGORIES[0].id);
    const [cart, setCart] = useState<CartLine[]>(
        canOrder ? [...INITIAL_CART] : [],
    );

    const products = useMemo(
        () =>
            PRODUCTS.filter(
                (product) => product.categoryId === activeCategoryId,
            ),
        [activeCategoryId],
    );

    // The cart is kept as a list rather than keyed by id so the strip shows
    // items in the order they were added instead of in id order.
    const cartLines = useMemo(
        () =>
            cart.flatMap((line) => {
                const product = PRODUCTS.find(
                    (candidate) => candidate.id === line.productId,
                );

                return product ? [{ product, quantity: line.quantity }] : [];
            }),
        [cart],
    );

    const itemCount = useMemo(
        () => cart.reduce((total, line) => total + line.quantity, 0),
        [cart],
    );

    const hasCart = cartLines.length > 0;

    const addToCart = (product: Product): void => {
        setCart((current) =>
            current.some((line) => line.productId === product.id)
                ? current.map((line) =>
                      line.productId === product.id
                          ? { ...line, quantity: line.quantity + 1 }
                          : line,
                  )
                : [...current, { productId: product.id, quantity: 1 }],
        );
    };

    const quantityOf = (product: Product): number =>
        cart.find((line) => line.productId === product.id)?.quantity ?? 0;

    return (
        <>
            <Head title={`${orderTypeLabel} Menu`} />
            <StoneWallBackdrop />

            <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
                <SiteHeader />

                {hasCart && <CartStrip lines={cartLines} />}

                {/* The menu proper: one white panel the stone runs alongside,
                    reaching the bottom of the page however short the list is.
                    Its position is the same with a cart or without one — the
                    cart's surplus white passes behind it rather than moving
                    it, so nothing here has to reach up to meet it. */}
                <main
                    className={cn(
                        'relative mx-2 mt-6 flex flex-1 flex-col gap-5 rounded-t-[2rem] bg-surface px-4 pt-7 shadow-lg',
                        // Delivery closes on the checkout bar, which brings its
                        // own spacing; dine-in ends on the last product.
                        canOrder || 'pb-6',
                    )}
                >
                    <StretchText
                        as="h1"
                        aria-label="Choose your craving."
                        style={{ fontSize: HEADING_SIZE }}
                        className="text-center font-display whitespace-nowrap uppercase"
                    >
                        C<Stretch level={2}>H</Stretch>OOSE YOUR CRAVING.
                    </StretchText>

                    <CategoryPills
                        categories={CATEGORIES}
                        activeId={activeCategoryId}
                        onSelect={setActiveCategoryId}
                    />

                    <ul className="flex flex-col gap-4">
                        {products.map((product) => (
                            <li key={product.id}>
                                <ProductCard
                                    product={product}
                                    quantity={quantityOf(product)}
                                    onAdd={canOrder ? addToCart : undefined}
                                />
                            </li>
                        ))}
                    </ul>

                    {canOrder && <CheckoutBar itemCount={itemCount} />}
                </main>
            </div>
        </>
    );
}
