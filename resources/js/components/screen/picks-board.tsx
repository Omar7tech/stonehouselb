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

/**
 * How far a tile may be pulled off square to take up room the grid would
 * otherwise leave empty. Small enough that the tile still reads as a square;
 * anything the screen has left beyond it stays white.
 */
const STRETCH = 1.12;

/**
 * The hand-picked board: the dishes the shop chose, and nothing else.
 *
 * Every other layout is a show — pages turning, photographs drifting, tiles
 * setting themselves down. This one is a shelf. It is white, it is still, and
 * every dish on it is a photograph with its price set into it on a white
 * label, in black, all of them on the screen at once. Nothing here animates,
 * on purpose: it is the board for the counter where somebody is deciding, not
 * for the wall somebody is walking past.
 *
 * The tiles are square, and as large as this particular set allows. The grid
 * is not a fixed number of columns: every arrangement is tried and the one
 * giving the biggest square is kept, with the dishes spread evenly over its
 * rows — seven go four over three, never four, two and one — and a short row
 * centred under the others. Where the screen has a little room left over, the
 * tiles are let out by a few percent to take it, and no further: a slightly
 * wide square is still a square, and a stretched one is not.
 */
export function PicksBoard({
    screen,
    products,
}: {
    screen: Screen;
    products: Product[];
}) {
    const chrome = useIdleChrome();
    const fullscreen = useFullscreen();

    const stage = useRef<HTMLDivElement>(null);
    const room = useRoom(stage);

    const layout = room === null ? null : dealRows(products.length, room);

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
                padding: 'calc(var(--u) * 1.4)',
                gap: 'calc(var(--u) * 1.4)',
            }}
        >
            {screen.showLogo && (
                <header className="flex shrink-0 justify-center">
                    <span
                        className="block"
                        style={{ width: 'calc(var(--u) * 9)' }}
                    >
                        {/* The mark draws itself in everywhere else. Here it
                            is simply there, like everything else on the
                            board. */}
                        <StoneHouseLogo className="w-full animate-none [&_*]:animate-none!" />
                    </span>
                </header>
            )}

            <main ref={stage} className="min-h-0 flex-1">
                {products.length === 0 ? (
                    <p
                        className="grid h-full place-items-center text-center text-black/50"
                        style={{ fontSize: 'calc(var(--u) * 1.4)' }}
                    >
                        Nothing chosen yet — pick the dishes for this screen in
                        the dashboard and it will show them.
                    </p>
                ) : (
                    layout !== null && (
                        <div
                            className="flex h-full flex-col items-center justify-center"
                            style={{
                                gap: `${layout.gap}px`,
                                // One em is a tenth of a tile's shorter side,
                                // so a label is sized against the photograph
                                // it sits on.
                                fontSize: `${Math.min(layout.width, layout.height) / 10}px`,
                            }}
                        >
                            {layout.rows.map((count, row) => {
                                const start = layout.rows
                                    .slice(0, row)
                                    .reduce((sum, size) => sum + size, 0);

                                return (
                                    <ul
                                        key={row}
                                        className="flex justify-center"
                                        style={{ gap: `${layout.gap}px` }}
                                    >
                                        {products
                                            .slice(start, start + count)
                                            .map((product) => (
                                                <Tile
                                                    key={product.id}
                                                    product={product}
                                                    width={layout.width}
                                                    height={layout.height}
                                                    showNames={screen.showNames}
                                                    showPrices={
                                                        screen.showPrices
                                                    }
                                                />
                                            ))}
                                    </ul>
                                );
                            })}
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
                    className="absolute rounded-full bg-white text-black shadow-md [&>svg]:size-[calc(var(--u)*1.6)]"
                    style={{
                        top: 'calc(var(--u) * 2)',
                        right: 'calc(var(--u) * 2)',
                        padding: 'calc(var(--u) * 0.9)',
                    }}
                >
                    {fullscreen.active ? <Minimize /> : <Maximize />}
                </button>
            )}
        </div>
    );
}

/**
 * One dish: its photograph, with what it costs set into the foot of it.
 *
 * The price stands on a white label rather than straight on the picture. A
 * figure laid over a photograph is only readable where the photograph happens
 * to be dark, and a price is the one thing on this board that has to be
 * readable on every tile.
 */
function Tile({
    product,
    width,
    height,
    showNames,
    showPrices,
}: {
    product: Product;
    width: number;
    height: number;
    showNames: boolean;
    showPrices: boolean;
}) {
    const pricing = usePricing();
    const lead = leadPrice(product);
    const art = product.image ?? product.thumbnail;

    return (
        <li
            className="relative shrink-0 overflow-hidden rounded-[0.45em] bg-black/5"
            style={{ width: `${width}px`, height: `${height}px` }}
        >
            {art === null ? (
                // A dish with no photograph still holds its tile, and still
                // says what it is when the label below is not going to.
                !showNames && (
                    <span className="absolute inset-0 grid place-items-center p-[1em] text-center text-[0.9em] leading-tight font-semibold text-black/40 uppercase">
                        {product.name}
                    </span>
                )
            ) : (
                // A plain image rather than the storefront's loading one: that
                // one fades its photograph in, and nothing on this board
                // moves.
                <img
                    src={art}
                    alt={product.name}
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                />
            )}

            {(showNames || showPrices) && (
                <div className="absolute inset-x-0 bottom-[0.5em] flex justify-center px-[0.5em]">
                    {/* A label, not a banner: it takes a corner of the
                        photograph's attention and leaves the dish the rest.
                        Never smaller than a figure can be read at, however
                        many tiles the screen is carrying. */}
                    <div className="flex max-w-full flex-col items-center rounded-[0.45em] bg-white px-[0.7em] py-[0.4em] text-center text-[max(0.72em,13px)] shadow-[0_0.1em_0.5em_rgb(0_0_0/0.18)]">
                        {showNames && (
                            <span className="max-w-full truncate text-[0.6em] leading-[1.5] font-semibold tracking-wide text-black/60 uppercase">
                                {product.name}
                            </span>
                        )}

                        {/* Dollars only, whatever the storefront quotes in:
                            one figure per tile is what reads from across a
                            room. */}
                        {showPrices && (
                            <span className="flex items-baseline justify-center gap-[0.35em] leading-none tabular-nums">
                                {lead.from && (
                                    <span className="text-[0.55em] font-semibold text-black/50 uppercase">
                                        from
                                    </span>
                                )}

                                {lead.was !== null && (
                                    <span className="text-[0.7em] text-black/40 line-through">
                                        {pricing.usd(lead.was)}
                                    </span>
                                )}

                                <span className="font-bold text-black">
                                    {pricing.usd(lead.price)}
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </li>
    );
}

/**
 * Deal this many dishes into rows for this much room, and size the tiles.
 *
 * Every row count is tried and the one that gives the largest square tile is
 * kept. The dishes are then spread evenly over the rows, and the tile is let
 * out towards whichever edge still has room, up to `STRETCH` and no further.
 */
function dealRows(
    count: number,
    room: { width: number; height: number },
): { rows: number[]; width: number; height: number; gap: number } | null {
    if (count === 0 || room.width <= 0 || room.height <= 0) {
        return null;
    }

    // Scaled to the set, so the gutters on a tablet are not the gutters of a
    // television.
    const gap = Math.round(Math.min(room.width, room.height) * 0.018);

    /** The room one tile has in each direction, for this many rows. */
    const cell = (rows: number): { width: number; height: number } => {
        const columns = Math.ceil(count / rows);

        return {
            width: (room.width - gap * (columns - 1)) / columns,
            height: (room.height - gap * (rows - 1)) / rows,
        };
    };

    let best = { rows: 1, side: 0 };

    for (let rows = 1; rows <= count; rows++) {
        const { width, height } = cell(rows);
        const side = Math.min(width, height);

        if (side > best.side) {
            best = { rows, side };
        }
    }

    const { width, height } = cell(best.rows);
    const base = Math.floor(count / best.rows);
    const extra = count % best.rows;

    return {
        // The fuller rows first, so a short row closes the board rather than
        // opening it.
        rows: Array.from({ length: best.rows }, (_, row) =>
            row < extra ? base + 1 : base,
        ),
        // Whole pixels, rounded down: a tile a fraction too large pushes the
        // last row off the bottom of the screen.
        width: Math.floor(Math.min(width, best.side * STRETCH)),
        height: Math.floor(Math.min(height, best.side * STRETCH)),
        gap,
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
