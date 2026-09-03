import { Head, usePage } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { CartSheet } from '@/components/menu/cart-sheet';
import { CartStrip } from '@/components/menu/cart-strip';
import { CartToast } from '@/components/menu/cart-toast';
import { CategoryGrid } from '@/components/menu/category-grid';
import { CategoryPills } from '@/components/menu/category-pills';
import { CheckoutBar } from '@/components/menu/checkout-bar';
import { MenuSlider } from '@/components/menu/menu-slider';
import { OrderAgain } from '@/components/menu/order-again';
import { OrderTypeSwitch } from '@/components/menu/order-type-switch';
import { ProductCard } from '@/components/menu/product-card';
import { ProductDialog } from '@/components/menu/product-dialog';
import { ProductMinimal } from '@/components/menu/product-minimal';
import { ProductShowcase } from '@/components/menu/product-showcase';
import { SiteFooter } from '@/components/menu/site-footer';
import { SiteHeader } from '@/components/menu/site-header';
import { StoneWallBackdrop } from '@/components/stone-wall-backdrop';
import { Stretch, StretchText } from '@/components/stretch';
import { CartProvider, useCart } from '@/contexts/cart-context';
import type { CartAddon, CartItem } from '@/contexts/cart-context';
import { isUsualOrder, readOrders, rebuildOrder } from '@/lib/order-history';
import { forgetSharedOrder, readSharedOrder } from '@/lib/share-order';
import { cn } from '@/lib/utils';
import type {
    Addon,
    Category,
    OrderType,
    Product,
    ProductCardStyle,
    Slide,
} from '@/types';

interface MenuProps {
    orderType: OrderType;
    orderTypeLabel: string;
    /**
     * Only the categories with something in them for this order type — the
     * controller drops the empty ones, so a pill always opens onto products.
     */
    categories: Category[];
    /**
     * The carousel above the menu. Empty until the shop adds one, which leaves
     * the strip out of the page entirely rather than holding space for it.
     */
    slides: Slide[];
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
 * overflow.
 *
 * The ceiling is where the panel stops widening, which is now a different
 * number at each breakpoint — so it comes in as a variable the class list sets
 * rather than being baked in here. Each value is the panel's inner width at
 * that breakpoint divided by {@see HEADING_EM}, rounded down so the line always
 * stops short of the edge rather than touching it.
 */
const HEADING_SIZE = `clamp(0.8rem, calc((100vw - 3rem) / ${HEADING_EM}), var(--heading-max))`;

/**
 * How the product list is laid out, per card style.
 *
 * All three end up in columns as the screen allows, since a single item run the
 * width of a monitor is a stripe of content with an acre of nothing beside it.
 * Where they differ is how soon, and how far.
 *
 * The order runs opposite to how it first reads. A row is the widest shape of
 * the three — it sets its picture and its copy side by side — so it holds a
 * single column the longest and stops at three. A card is upright and needs only
 * a photo and two lines, so it tiles sooner. The minimal item has no padding, no
 * edge and no rule to clear, so it starts at two on a phone and ends at five.
 * The less each one is given to draw, the more of them fit.
 */
const PRODUCT_LIST: Record<ProductCardStyle, string> = {
    row: 'flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3',
    card: 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4',
    // The rows are given more air than the columns: with no card edge to mark
    // where one dish ends, the space between them is the only thing separating
    // a name from the photograph of the next dish under it.
    minimal:
        'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
};

/** One product, drawn in whichever style the shop has chosen. */
function ProductInStyle({
    style,
    ...props
}: {
    style: ProductCardStyle;
    product: Product;
    quantity: number;
    onOpen: (product: Product, variantIndex: number | null) => void;
    onAdd?: (product: Product, variantIndex: number | null) => void;
}) {
    if (style === 'card') {
        return <ProductShowcase {...props} />;
    }

    if (style === 'minimal') {
        return <ProductMinimal {...props} />;
    }

    return <ProductCard {...props} />;
}

/** The category named in `?category=`, or null when it names nothing known. */
function readCategoryFromUrl(menu: readonly Category[]): number | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const slug = new URLSearchParams(window.location.search).get('category');

    if (slug === null) {
        return null;
    }

    return menu.find((category) => category.slug === slug)?.id ?? null;
}

/**
 * The cart lives above the page so the strip, the checkout bar and the sheet
 * all read one basket — and so it survives a reload, which is the provider's
 * job rather than this page's.
 */
export default function Menu(props: MenuProps) {
    return (
        <CartProvider>
            <MenuView {...props} />
        </CartProvider>
    );
}

function MenuView({
    orderType,
    orderTypeLabel,
    categories,
    slides,
}: MenuProps) {
    // Delivery is the menu you order from; dine-in is the same menu to read.
    const canOrder = orderType === 'delivery';

    const { items, count, addItem, replaceItem, restore, setOpen, lastAdded } =
        useCart();
    const cardStyle: ProductCardStyle =
        usePage().props.productCardStyle ?? ('row' as const);

    // Null shows the category boxes; an id shows that category's products.
    const [activeCategoryId, setActiveCategoryId] = useState(() =>
        readCategoryFromUrl(categories),
    );

    // The product whose sheet is open. It is kept after closing so the sheet
    // has something to draw while it animates out.
    const [openProduct, setOpenProduct] = useState<Product | null>(null);
    const [openVariantIndex, setOpenVariantIndex] = useState<number | null>(
        null,
    );
    const [productOpen, setProductOpen] = useState(false);
    /**
     * The basket line the sheet is currently editing, and the choices it was
     * opened on. Null means the sheet is adding rather than changing, which is
     * what tells the footer whether its button says Add or Save.
     */
    const [editing, setEditing] = useState<{
        key: string;
        addons: CartAddon[];
        excludedIngredients: string[];
        quantity: number;
    } | null>(null);
    /**
     * Extras the sheet was handed rather than looked up, which is how a dish
     * opened from the carousel gets its own category's. Null means the usual
     * lookup applies.
     */
    const [addonsOverride, setAddonsOverride] = useState<Addon[] | null>(null);

    /** The menu panel, so changing what is in it can hold it where it stands. */
    const panelRef = useRef<HTMLElement>(null);
    /** Where it sat on screen just before the change, in viewport pixels. */
    const panelTop = useRef<number | null>(null);

    /**
     * Every product on the menu by id, so a basket line can be traced back to
     * the dish it came from. A line whose product has since been unpublished
     * finds nothing here and simply loses its edit button, rather than opening
     * a sheet on a dish that is no longer sold.
     */
    const productsById = useMemo(() => {
        const lookup = new Map<number, { product: Product; addons: Addon[] }>();

        categories.forEach((category) => {
            category.products.forEach((product) => {
                lookup.set(product.id, {
                    product,
                    // The extras belong to the category, so they have to be
                    // carried alongside the dish rather than looked up again
                    // from whichever category happens to be open.
                    addons: category.addons,
                });
            });
        });

        return lookup;
    }, [categories]);

    /**
     * The orders this browser has sent. Read once and never again: sending
     * hands the browser to WhatsApp, so the list cannot change while this page
     * is up.
     */
    const [pastOrders] = useState(readOrders);

    /**
     * The last order, read against the menu as it stands today. Null when there
     * is nothing to offer — no history, or nothing in it still on sale — which
     * is what keeps the card off a first visit.
     */
    const lastOrder = useMemo(() => {
        const past = pastOrders[0];

        if (past === undefined) {
            return null;
        }

        const rebuilt = rebuildOrder(past.items, productsById);

        if (rebuilt.items.length === 0) {
            return null;
        }

        return {
            ...rebuilt,
            sentAt: past.sentAt,
            usual: isUsualOrder(pastOrders, past),
        };
    }, [pastOrders, productsById]);

    /**
     * Put the last order back in the basket and show it. The basket opens
     * rather than a message being shown: what landed is a whole order, and
     * seeing it is the only confirmation worth giving.
     *
     * It merges rather than replaces, so nothing the customer has picked out
     * today is thrown away by reaching for a shortcut — and it merges by
     * quantity rather than adding to it, so pressing this twice leaves one copy
     * of the order rather than two.
     */
    const reorderLast = (): void => {
        if (lastOrder === null) {
            return;
        }

        restore(lastOrder.items);
        setOpen(true);
    };

    /**
     * A basket that arrived in a link, decoded before the first paint so the
     * page is only ever drawn once — with it, or without it.
     */
    const [sharedLines] = useState(readSharedOrder);

    const sharedOrder = useMemo(
        () =>
            sharedLines === null
                ? null
                : rebuildOrder(sharedLines, productsById),
        [sharedLines, productsById],
    );

    /**
     * What the basket says about where it came from, in the sheet that opens
     * with it. Somebody who taps a friend's link and finds food in their basket
     * deserves a sentence explaining it, and the missing dishes have to be
     * accounted for rather than quietly absent.
     */
    const sharedNotice = useMemo(() => {
        if (sharedOrder === null) {
            return null;
        }

        if (sharedOrder.items.length === 0) {
            return 'Nothing from that shared order is still on the menu.';
        }

        if (sharedOrder.dropped > 0) {
            return sharedOrder.dropped === 1
                ? 'Added from a shared order. One dish in it is no longer on the menu.'
                : `Added from a shared order. ${sharedOrder.dropped} dishes in it are no longer on the menu.`;
        }

        return 'Added from a shared order — add yours, then send it all together.';
    }, [sharedOrder]);

    // Once only, whatever else re-renders the page.
    const sharedApplied = useRef(false);

    useEffect(() => {
        if (sharedOrder === null || sharedApplied.current) {
            return;
        }

        sharedApplied.current = true;
        // Out of the address bar the moment it is read, or a reload orders it
        // again and a bookmark keeps somebody else's lunch in it forever.
        forgetSharedOrder();

        if (sharedOrder.items.length > 0) {
            restore(sharedOrder.items);
            setOpen(true);
        }
    }, [sharedOrder, restore, setOpen]);

    const activeCategory =
        categories.find((category) => category.id === activeCategoryId) ?? null;
    const products = activeCategory?.products ?? [];

    // Mirror the open category into the URL so the view survives a refresh and
    // can be shared, without a server round-trip.
    useEffect(() => {
        const url = new URL(window.location.href);

        if (activeCategory === null) {
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', activeCategory.slug);
        }

        window.history.replaceState(window.history.state, '', url);
    }, [activeCategory]);

    /**
     * Open a category, switch to another one, or go back to the boxes.
     *
     * None of these move the page. Everything above the panel — the header, the
     * order-type switch, the carousel, the heading — is the same in every view,
     * so the customer is looking at the same place before and after and should
     * still be looking at it: taking them to the top of the document instead
     * throws away wherever they had got to, on every single tap.
     *
     * The exception is a view that is shorter than the one it replaced: the
     * document loses height, the browser clamps the scroll to the new bottom,
     * and the page slides up on its own. So the panel's position on screen is
     * measured before the swap and put back after it, which holds it still in
     * that case too.
     */
    const selectCategory = (id: number | null): void => {
        panelTop.current =
            panelRef.current?.getBoundingClientRect().top ?? null;
        setActiveCategoryId(id);
    };

    useLayoutEffect(() => {
        const before = panelTop.current;
        panelTop.current = null;

        if (before === null) {
            return;
        }

        const after = panelRef.current?.getBoundingClientRect().top;

        if (after === undefined || after === before) {
            return;
        }

        // Instant, not smooth: this is a correction for something that has
        // already happened, and animating it would draw the eye to the very
        // movement it exists to hide.
        window.scrollBy({ top: after - before, behavior: 'instant' });
    }, [activeCategoryId]);

    const hasCart = count > 0;

    /**
     * The bar is the foot of an open category on the delivery menu, and only
     * once there is something in the cart to check out — an empty menu, the
     * boxes, or an empty cart each have nothing for it to do. The panel reads
     * this to know whether its own bottom padding is still needed.
     */
    const showsCheckoutBar = canOrder && activeCategory !== null && hasCart;

    /** How many of a product are in the cart, across all its variants. */
    const quantityOf = (product: Product): number =>
        items
            .filter((item) => item.productId === product.id)
            .reduce((total, item) => total + item.quantity, 0);

    const openDialog = (
        product: Product,
        variantIndex: number | null,
    ): void => {
        setOpenProduct(product);
        setOpenVariantIndex(variantIndex);
        setEditing(null);
        setAddonsOverride(null);
        setProductOpen(true);
    };

    /**
     * Open the dish a slide is advertising, on its first size and its own
     * category's extras — the customer may be looking at the carousel from the
     * landing view, with no category open to inherit anything from.
     */
    const openSlide = (slide: Slide): void => {
        if (slide.product === null) {
            return;
        }

        setOpenProduct(slide.product);
        setOpenVariantIndex(slide.product.variants.length > 0 ? 0 : null);
        setEditing(null);
        setAddonsOverride(slide.addons);
        setProductOpen(true);
    };

    /**
     * Reopen a basket line in its own sheet, on exactly what was chosen for it.
     *
     * The basket closes on the way: two sheets stacked on a phone is one sheet
     * too many, and the customer is going to be handed straight back to the
     * basket when they are done anyway.
     */
    const editCartItem = (item: CartItem): void => {
        const entry = productsById.get(item.productId);

        if (entry === undefined) {
            return;
        }

        setOpen(false);
        setOpenProduct(entry.product);
        setOpenVariantIndex(item.variantIndex);
        // The line's own category is what the lookup finds, so nothing has to
        // be handed over here — and anything left from a slide would be wrong.
        setAddonsOverride(null);
        setEditing({
            key: item.key,
            addons: item.addons,
            excludedIngredients: item.excludedIngredients,
            quantity: item.quantity,
        });
        setProductOpen(true);
    };

    /** The same, from the toast — which knows a line by its key alone. */
    const editCartItemByKey = (key: string): void => {
        const item = items.find((candidate) => candidate.key === key);

        if (item !== undefined) {
            editCartItem(item);
        }
    };

    /**
     * The corner button adds the size already chosen on the card, so a product
     * sold in sizes needs no detour. Extras are the one choice the card can't
     * make — the sheet is where those are picked, so a category offering them
     * opens it rather than adding without them.
     */
    const quickAdd = (product: Product, variantIndex: number | null): void => {
        const addons = activeCategory?.addons ?? [];

        if (addons.length > 0) {
            openDialog(product, variantIndex);

            return;
        }

        const variant =
            variantIndex === null ? null : product.variants[variantIndex];

        addItem({
            productId: product.id,
            variantIndex,
            name: product.name,
            variantName: variant?.name ?? null,
            unitUsd:
                variant === null
                    ? (product.discountPrice ?? product.price)
                    : (variant.discountPrice ?? variant.price),
            // The small cut, since the cart never draws a photo bigger than a
            // tile — and this one is written to storage, so the cheap URL is
            // what a returning basket loads too.
            image: product.thumbnail ?? product.image,
        });
    };

    const addFromDialog = ({
        variantIndex,
        addons,
        excludedIngredients,
        quantity,
    }: {
        variantIndex: number | null;
        addons: CartAddon[];
        excludedIngredients: string[];
        quantity: number;
    }): void => {
        if (openProduct === null) {
            return;
        }

        const variant =
            variantIndex === null ? null : openProduct.variants[variantIndex];

        const input = {
            productId: openProduct.id,
            variantIndex,
            name: openProduct.name,
            variantName: variant?.name ?? null,
            unitUsd:
                variant === null
                    ? (openProduct.discountPrice ?? openProduct.price)
                    : (variant.discountPrice ?? variant.price),
            image: openProduct.thumbnail ?? openProduct.image,
            addons,
            excludedIngredients,
            quantity,
        };

        setProductOpen(false);

        // Changing a line hands the customer back to where they came from, with
        // no toast: they are about to see the row they just changed, which says
        // it landed better than a message about it would.
        if (editing !== null) {
            replaceItem(editing.key, input);
            setOpen(true);

            return;
        }

        // The toast is the confirmation, here as well as on the card's quick
        // add — one answer to "did that work?" wherever the add came from.
        addItem(input);
    };

    return (
        <>
            <Head title={`${orderTypeLabel} Menu`} />
            <StoneWallBackdrop />

            {/* The footer is what lets the checkout button let go: sticky only
                releases once its panel's bottom edge has travelled up past the
                foot of the screen, which cannot happen while that panel is the
                last thing in the document.

                The page is a column so the footer can be pushed to the bottom
                of a short one; the menu keeps to its own width inside it, while
                the footer's slab runs the full width of the window.

                That width is a phone's the whole way up to `lg`, where a desk
                monitor gets a column wide enough to put products side by side.
                Below that nothing changes: the layout a phone gets is the one
                it had. */}
            <div className="flex min-h-screen flex-col">
                <div className="mx-auto flex w-full max-w-2xl flex-col lg:max-w-5xl xl:max-w-6xl">
                    <SiteHeader />

                    {/* The way across to the other menu. Which one you are on is
                    already said by the selected half, so it carries no title
                    of its own.

                    Held to its own width on a wide screen: a two-option switch
                    stretched across a monitor reads as a pair of banners, not
                    as one control with two halves. */}
                    <div className="px-5 pb-5 lg:mx-auto lg:w-full lg:max-w-md">
                        <OrderTypeSwitch current={orderType} />
                    </div>

                    {/* Straight under the switch, above everything the menu
                        itself draws: it is the first thing on the page after
                        the way between the two menus.

                        The landing view only. Once a category is picked the
                        customer is choosing between dishes, and a row of
                        promotions above that list is competing with the choice
                        it interrupted.

                        Out on the wall rather than inside the panel, so the
                        pictures are the full width of the column and the menu
                        below still opens on its heading.

                        Held still while the sheet is open: it is behind the
                        overlay there, and a row that has moved on by itself is
                        not the row the customer left. */}
                    {activeCategory === null && slides.length > 0 && (
                        /* Asked here as well as inside the slider, or a shop
                           with no slides would keep this row's padding as a
                           band of empty wall.

                           No side padding of its own: the carousel keeps its
                           gutters inside its own viewport, so its cards run to
                           the edge of the column as they travel rather than
                           being clipped short of it. */
                        <div className="pb-5">
                            <MenuSlider
                                slides={slides}
                                onOpen={openSlide}
                                paused={productOpen}
                            />
                        </div>
                    )}

                    {/* Always on the delivery menu, empty or not — it holds the
                        space the order lives in, so the first item added
                        doesn't shove the page down as you reach for it. */}
                    {canOrder && <CartStrip />}

                    {/* The menu proper: one panel the stone runs alongside, sized
                    to its own contents so it closes on the last product rather
                    than running on to the foot of the window. Both ends are
                    rounded, since the bottom one is now on show.

                    Its position is the same with a cart or without one — the
                    cart's surplus white passes behind it rather than moving
                    it, so nothing here has to reach up to meet it. */}
                    <main
                        ref={panelRef}
                        className={cn(
                            // `isolate` so the pattern below can sit on a negative
                            // layer: it puts it above the panel's own background
                            // but under the cards, without every card needing a
                            // stacking order of its own.
                            'relative isolate mx-2 mt-3 flex flex-col gap-5 rounded-[2rem] bg-surface px-3 pt-7',
                            // More air once there is room for it: the phone's
                            // margins on a monitor leave the panel looking like
                            // a page that forgot to be laid out.
                            'lg:mx-4 lg:gap-7 lg:px-8 lg:pt-10',
                            // Thrown upwards, onto the cart sheet this panel
                            // overlaps. The stock shadows all fall downwards,
                            // where there is nothing to catch them.
                            'shadow-[0_-6px_20px_rgb(0_0_0/0.11)]',
                            // The checkout bar brings its own spacing, so the
                            // panel only pads its own foot when the bar isn't
                            // there to do it — dine-in either way, and the
                            // delivery menu while it is still on the boxes.
                            showsCheckoutBar || 'pb-6 lg:pb-10',
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
                            className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 rounded-b-[2rem] bg-[radial-gradient(currentColor_1px,transparent_1px)] mask-[linear-gradient(to_top,#000_20%,transparent)] bg-size-[14px_14px] opacity-[0.07] [-webkit-mask-image:linear-gradient(to_top,#000_20%,transparent)]"
                        />

                        <StretchText
                            as="h1"
                            aria-label="Choose your craving."
                            style={{ fontSize: HEADING_SIZE }}
                            className="text-center font-display whitespace-nowrap uppercase [--heading-max:1.85rem] lg:[--heading-max:2.7rem] xl:[--heading-max:3.1rem]"
                        >
                            C<Stretch level={2}>H</Stretch>OOSE YOUR CRAVING.
                        </StretchText>

                        {/* On the front page only, and only on the menu you
                            can order from. It is a way past the whole menu, so
                            it belongs where the menu starts — offered again
                            three categories deep, it would be in the way of the
                            browsing it exists to skip. */}
                        {canOrder && activeCategory === null && lastOrder && (
                            <OrderAgain
                                items={lastOrder.items}
                                sentAt={lastOrder.sentAt}
                                usual={lastOrder.usual}
                                dropped={lastOrder.dropped}
                                onReorder={reorderLast}
                            />
                        )}

                        {activeCategory === null ? (
                            /* The landing view. `CategoryGrid` also carries the
                               empty state, so a menu with nothing published
                               reads as one waiting on its dishes rather than as
                               something broken. */
                            <CategoryGrid
                                categories={categories}
                                onSelect={selectCategory}
                            />
                        ) : (
                            <>
                                <CategoryPills
                                    categories={categories}
                                    activeId={activeCategory.id}
                                    onSelect={selectCategory}
                                    onClear={() => selectCategory(null)}
                                />

                                <ul className={PRODUCT_LIST[cardStyle]}>
                                    {products.map((product) => (
                                        <li key={product.id}>
                                            <ProductInStyle
                                                style={cardStyle}
                                                product={product}
                                                quantity={quantityOf(product)}
                                                onOpen={openDialog}
                                                onAdd={
                                                    canOrder
                                                        ? quickAdd
                                                        : undefined
                                                }
                                            />
                                        </li>
                                    ))}
                                </ul>

                                {showsCheckoutBar && <CheckoutBar />}
                            </>
                        )}
                    </main>
                </div>

                {/* Pushed to the foot of the column, so a short category still
                    closes on the slab instead of on bare wall. The gap is on
                    the wrapper rather than the slab, or `mt-auto` would have
                    nothing left to push with. */}
                <div className="mt-auto pt-10">
                    <SiteFooter />
                </div>
            </div>

            <ProductDialog
                product={openProduct}
                // A line opened from the basket brings its own category's
                // extras: the customer may well have moved on to another
                // category, or back to the boxes, since adding it.
                addons={
                    addonsOverride ??
                    (openProduct === null
                        ? undefined
                        : productsById.get(openProduct.id)?.addons) ??
                    activeCategory?.addons ??
                    []
                }
                initialVariantIndex={openVariantIndex}
                editing={editing}
                open={productOpen}
                onOpenChange={setProductOpen}
                onAdd={canOrder ? addFromDialog : undefined}
            />

            {canOrder && (
                <CartToast
                    // Offered only for a dish there is something to choose
                    // about, so the plain adds stay plain.
                    onCustomise={
                        lastAdded !== null &&
                        (productsById.get(lastAdded.productId)?.product
                            .ingredients.length ?? 0) > 0
                            ? editCartItemByKey
                            : undefined
                    }
                />
            )}
            {canOrder && (
                <CartSheet onEditItem={editCartItem} notice={sharedNotice} />
            )}
        </>
    );
}
