import { Maximize, Minimize } from 'lucide-react';
import type { RefObject } from 'react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { StoneHouseLogo } from '@/components/stone-house-logo';
import { leadPrice } from '@/lib/screen-deck';
import { usePricing } from '@/lib/use-pricing';
import { useFullscreen, useIdleChrome } from '@/lib/use-screen';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { Screen } from '@/types/screen';

const OrderQr = lazy(() => import('@/components/menu/order-qr'));

/** The space between two tiles, as a share of a tile's side. */
const GAP = 0.09;

/**
 * The hand-picked board: the dishes the shop chose, and nothing else.
 *
 * Every other layout is a show — pages turning, photographs drifting, tiles
 * setting themselves down. This one is a shelf. It is white, it is still, and
 * every dish on it is a square photograph with its price underneath in black,
 * all of them on the screen at once. Nothing here animates, on purpose: it is
 * the board for the counter where somebody is deciding, not for the wall
 * somebody is walking past.
 *
 * The tiles are as large as the screen allows. The grid is not a fixed number
 * of columns but whichever arrangement gives the biggest square for the number
 * of dishes chosen — four dishes on a television are two enormous rows of two
 * or one row of four, whichever is larger on that set — so the same list reads
 * properly on a wall-mounted fifty-five and on a tablet stood upright.
 */
export function PicksBoard({
    screen,
    products,
}: {
    screen: Screen;
    products: Product[];
}) {
    const pricing = usePricing();
    const chrome = useIdleChrome();
    const fullscreen = useFullscreen();

    const stage = useRef<HTMLDivElement>(null);
    const room = useRoom(stage);

    // How tall the copy under a photograph stands, as a share of the tile's
    // side. Worked out from what is actually printed there, so a board with
    // the names switched off gives that room back to the photographs.
    const caption =
        (screen.showNames ? 0.15 : 0) +
        (screen.showPrices ? 0.2 : 0) +
        (screen.showPrices && pricing.showUsd && pricing.showLbp ? 0.1 : 0) +
        (screen.showNames || screen.showPrices ? 0.05 : 0);

    const fit = room === null ? null : fitTiles(products.length, room, caption);

    return (
        <div
            className={cn(
                'relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-white text-black select-none',
                chrome ? 'cursor-default' : 'cursor-none',
            )}
            style={{
                // The same unit the other boards are sized in, so the mark and
                // the code are the size they are everywhere else.
                ['--u' as string]: 'calc(0.6vw + 0.4vh)',
                padding: 'calc(var(--u) * 2.5)',
                gap: 'calc(var(--u) * 2)',
            }}
        >
            {screen.showLogo && (
                <header className="flex shrink-0 justify-center">
                    <span
                        className="block"
                        style={{ width: 'calc(var(--u) * 10)' }}
                    >
                        {/* The mark draws itself in everywhere else. Here it
                            is simply there, like everything else on the
                            board. */}
                        <StoneHouseLogo className="w-full animate-none [&_*]:animate-none!" />
                    </span>
                </header>
            )}

            <main ref={stage} className="relative min-h-0 flex-1">
                {products.length === 0 ? (
                    <p
                        className="grid h-full place-items-center text-center text-black/50"
                        style={{ fontSize: 'calc(var(--u) * 1.4)' }}
                    >
                        Nothing chosen yet — pick the dishes for this screen in
                        the dashboard and it will show them.
                    </p>
                ) : (
                    fit !== null && (
                        <div className="absolute inset-0 grid place-items-center">
                            <ul
                                className="flex flex-wrap justify-center"
                                style={{
                                    // One em is a tenth of a tile, so
                                    // everything on a tile is sized against
                                    // the tile itself.
                                    fontSize: `${fit.side / 10}px`,
                                    width: `${fit.width}px`,
                                    gap: `${fit.side * GAP}px`,
                                }}
                            >
                                {products.map((product) => (
                                    <Tile
                                        key={product.id}
                                        product={product}
                                        caption={caption}
                                        showNames={screen.showNames}
                                        showPrices={screen.showPrices}
                                    />
                                ))}
                            </ul>
                        </div>
                    )
                )}
            </main>

            {screen.showQr && (
                <footer className="flex shrink-0 items-center justify-center gap-[1em]">
                    <Suspense
                        fallback={
                            <span
                                className="block bg-black/5"
                                style={{
                                    width: 'calc(var(--u) * 5)',
                                    height: 'calc(var(--u) * 5)',
                                }}
                            />
                        }
                    >
                        <span
                            className="block shrink-0"
                            style={{ width: 'calc(var(--u) * 5)' }}
                        >
                            <OrderQr value={screen.menuUrl} />
                        </span>
                    </Suspense>

                    <span
                        className="font-semibold tracking-[0.2em] uppercase"
                        style={{ fontSize: 'calc(var(--u) * 1.05)' }}
                    >
                        Scan for the full menu
                    </span>
                </footer>
            )}

            {/* A tablet cannot be put into fullscreen any other way: the
                browser grants it inside a gesture or not at all. Shown only
                while somebody is touching the set. */}
            {fullscreen.toggle !== null && chrome && (
                <button
                    type="button"
                    onClick={fullscreen.toggle}
                    aria-label={
                        fullscreen.active
                            ? 'Leave fullscreen'
                            : 'Show fullscreen'
                    }
                    className="absolute rounded-full bg-black/5 text-black [&>svg]:size-[calc(var(--u)*1.6)]"
                    style={{
                        top: 'calc(var(--u) * 1.5)',
                        right: 'calc(var(--u) * 1.5)',
                        padding: 'calc(var(--u) * 0.9)',
                    }}
                >
                    {fullscreen.active ? <Minimize /> : <Maximize />}
                </button>
            )}
        </div>
    );
}

/** One dish: a square photograph, and under it what it is and what it costs. */
function Tile({
    product,
    caption,
    showNames,
    showPrices,
}: {
    product: Product;
    /** The height of the copy under the photograph, as a share of the tile. */
    caption: number;
    showNames: boolean;
    showPrices: boolean;
}) {
    const pricing = usePricing();
    const lead = leadPrice(product);
    const art = product.image ?? product.thumbnail;

    return (
        <li className="flex w-[10em] flex-col">
            {art === null ? (
                // A dish with no photograph still holds its square, named, so
                // the grid stays a grid and the tile still says what it is.
                <div className="grid size-[10em] place-items-center rounded-[0.4em] bg-black/5 p-[1em] text-center">
                    <span className="line-clamp-3 text-[0.9em] leading-tight font-semibold text-black/40 uppercase">
                        {product.name}
                    </span>
                </div>
            ) : (
                // A plain image rather than the storefront's loading one: that
                // one fades its photograph in, and nothing on this board
                // moves.
                <img
                    src={art}
                    alt={product.name}
                    draggable={false}
                    className="size-[10em] rounded-[0.4em] bg-black/5 object-cover"
                />
            )}

            {caption > 0 && (
                <div
                    className="flex flex-col items-center justify-end overflow-hidden text-center"
                    style={{ height: `${caption * 10}em` }}
                >
                    {showNames && (
                        <span className="w-full truncate text-[0.8em] leading-[1.5] font-medium text-black/60 uppercase">
                            {product.name}
                        </span>
                    )}

                    {showPrices && (
                        <>
                            <span className="flex items-baseline justify-center gap-[0.35em] leading-none tabular-nums">
                                {lead.from && (
                                    <span className="text-[0.65em] font-semibold text-black/45 uppercase">
                                        from
                                    </span>
                                )}

                                {lead.was !== null && (
                                    <span className="text-[0.85em] text-black/40 line-through">
                                        {pricing.primary(lead.was)}
                                    </span>
                                )}

                                <span className="text-[1.6em] font-bold text-black">
                                    {pricing.primary(lead.price)}
                                </span>
                            </span>

                            {pricing.showUsd && pricing.showLbp && (
                                <span className="mt-[0.3em] text-[0.75em] leading-none font-medium text-black/55 tabular-nums">
                                    {pricing.lbp(lead.price)}
                                </span>
                            )}
                        </>
                    )}
                </div>
            )}
        </li>
    );
}

/**
 * The arrangement that gives the largest square tile for this many dishes in
 * this much room.
 *
 * Every column count is tried, because the best one is not a function of the
 * screen's shape alone: seven dishes on a wide set are best as four over three,
 * and on a tall one as two columns of four.
 */
function fitTiles(
    count: number,
    room: { width: number; height: number },
    caption: number,
): { side: number; width: number } | null {
    if (count === 0 || room.width <= 0 || room.height <= 0) {
        return null;
    }

    let best = { side: 0, columns: 1 };

    for (let columns = 1; columns <= count; columns++) {
        const rows = Math.ceil(count / columns);

        const side = Math.min(
            room.width / (columns + GAP * (columns - 1)),
            room.height / (rows * (1 + caption) + GAP * (rows - 1)),
        );

        if (side > best.side) {
            best = { side, columns };
        }
    }

    // Whole pixels, rounded down: a tile a fraction too wide wraps the row,
    // and a row that wraps runs the last one off the bottom of the screen.
    const side = Math.floor(best.side);

    return {
        side,
        width: Math.ceil(side * best.columns + side * GAP * (best.columns - 1)),
    };
}

/**
 * How much room an element has, kept current as the set is rotated or the
 * browser goes in and out of fullscreen. Null until it has been measured, so
 * nothing is drawn at a guessed size and then redrawn at the real one.
 */
function useRoom(
    target: RefObject<HTMLElement | null>,
): { width: number; height: number } | null {
    const [room, setRoom] = useState<{ width: number; height: number } | null>(
        null,
    );

    useEffect(() => {
        const element = target.current;

        if (element === null) {
            return;
        }

        const measure = (): void => {
            const width = element.clientWidth;
            const height = element.clientHeight;

            setRoom((current) =>
                current !== null &&
                current.width === width &&
                current.height === height
                    ? current
                    : { width, height },
            );
        };

        measure();

        // Older sets have no observer; the window's own resize covers the
        // cases that matter on them.
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', measure);

            return () => window.removeEventListener('resize', measure);
        }

        const observer = new ResizeObserver(measure);
        observer.observe(element);

        return () => observer.disconnect();
    }, [target]);

    return room;
}
