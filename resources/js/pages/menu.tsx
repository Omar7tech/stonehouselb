import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { CartStrip } from '@/components/menu/cart-strip';
import { CategoryPills } from '@/components/menu/category-pills';
import { CheckoutBar } from '@/components/menu/checkout-bar';
import { ProductCard } from '@/components/menu/product-card';
import { SiteHeader } from '@/components/menu/site-header';
import { StoneWallBackdrop } from '@/components/stone-wall-backdrop';
import { Stretch, StretchText } from '@/components/stretch';
import { ALL_PRODUCTS, CATEGORIES, INITIAL_CART } from '@/lib/menu-placeholder';
import { cn } from '@/lib/utils';
import type { Category, CartLine, OrderType, Product } from '@/types';

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

/** Categories worth showing: one with nothing in it opens onto an empty list. */
const MENU: readonly Category[] = CATEGORIES.filter(
    (category) => category.products.length > 0,
);

/** The category named in `?category=`, or null when it names nothing known. */
function readCategoryFromUrl(): number | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const slug = new URLSearchParams(window.location.search).get('category');

    if (slug === null) {
        return null;
    }

    return MENU.find((category) => category.slug === slug)?.id ?? null;
}

export default function Menu({ orderType, orderTypeLabel }: MenuProps) {
    // Delivery is the menu you order from; dine-in is the same menu to read.
    const canOrder = orderType === 'delivery';

    const [activeCategoryId, setActiveCategoryId] = useState(
        () => readCategoryFromUrl() ?? MENU[0].id,
    );
    const [cart, setCart] = useState<CartLine[]>(
        canOrder ? [...INITIAL_CART] : [],
    );

    const activeCategory =
        MENU.find((category) => category.id === activeCategoryId) ?? MENU[0];
    const products = activeCategory.products;

    // Mirror the open category into the URL so the view survives a refresh and
    // can be shared, without a server round-trip.
    useEffect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('category', activeCategory.slug);
        window.history.replaceState(window.history.state, '', url);
    }, [activeCategory]);

    const selectCategory = (id: number): void => {
        setActiveCategoryId(id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // The cart is kept as a list rather than keyed by id so the strip shows
    // items in the order they were added instead of in id order.
    const cartLines = useMemo(
        () =>
            cart.flatMap((line) => {
                const product = ALL_PRODUCTS.find(
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

            {/* Room after the last section, so the page scrolls on past the
                menu onto bare wall. It is also what lets the checkout button
                let go: sticky only releases once its panel's bottom edge has
                travelled up past the foot of the screen, which cannot happen
                while that panel is the last thing in the document. Whatever
                goes under the menu later replaces this padding. */}
            <div className="mx-auto flex min-h-screen max-w-2xl flex-col pb-32">
                <SiteHeader />

                {hasCart && <CartStrip lines={cartLines} />}

                {/* The menu proper: one panel the stone runs alongside, sized
                    to its own contents so it closes on the last product rather
                    than running on to the foot of the window. Both ends are
                    rounded, since the bottom one is now on show.

                    Its position is the same with a cart or without one — the
                    cart's surplus white passes behind it rather than moving
                    it, so nothing here has to reach up to meet it. */}
                <main
                    className={cn(
                        // `isolate` so the pattern below can sit on a negative
                        // layer: it puts it above the panel's own background
                        // but under the cards, without every card needing a
                        // stacking order of its own.
                        'relative isolate mx-2 mt-3 flex flex-col gap-5 rounded-[2rem] bg-surface px-4 pt-7',
                        // Thrown upwards, onto the cart sheet this panel
                        // overlaps. The stock shadows all fall downwards,
                        // where there is nothing to catch them.
                        'shadow-[0_-6px_20px_rgb(0_0_0/0.11)]',
                        // Delivery closes on the checkout bar, which brings its
                        // own spacing; dine-in ends on the last product.
                        canOrder || 'pb-6',
                    )}
                >
                    {/* Texture at the foot of the section, so the panel closes
                        on something rather than just stopping. A dot grid in
                        `currentColor` at very low opacity, masked so it fades
                        out as it rises — the bottom corners are rounded to
                        match the panel, which keeps it inside the card without
                        an `overflow-hidden` that would break the sticky
                        button. Decorative, so it is hidden from readers. */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 rounded-b-[2rem] bg-[radial-gradient(currentColor_1px,transparent_1px)] [mask-image:linear-gradient(to_top,#000_20%,transparent)] [background-size:14px_14px] opacity-[0.07] [-webkit-mask-image:linear-gradient(to_top,#000_20%,transparent)]"
                    />

                    <StretchText
                        as="h1"
                        aria-label="Choose your craving."
                        style={{ fontSize: HEADING_SIZE }}
                        className="text-center font-display whitespace-nowrap uppercase"
                    >
                        C<Stretch level={2}>H</Stretch>OOSE YOUR CRAVING.
                    </StretchText>

                    <CategoryPills
                        categories={MENU}
                        activeId={activeCategory.id}
                        onSelect={selectCategory}
                    />

                    <ul className="flex flex-col gap-3">
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
