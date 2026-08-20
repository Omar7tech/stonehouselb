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
                        className="text-center font-display text-2xl uppercase sm:text-3xl"
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
