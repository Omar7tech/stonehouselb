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
 * The hand-picked board: the dishes the shop chose, and nothing else.
 *
 * Every other layout is a show — pages turning, photographs drifting, tiles
 * setting themselves down. This one is a shelf. It is white, it is still, and
 * every dish on it is a photograph with its price set into it on a white
 * label, in black, all of them on the screen at once. Nothing here animates,
 * on purpose: it is the board for the counter where somebody is deciding, not
 * for the wall somebody is walking past.
 *
 * The photographs take the whole screen between them. The dishes are dealt
 * into rows — as many rows as keeps every tile closest to square on this
 * particular set — and each row is then stretched edge to edge, so five dishes
 * are three over two with no hole where a sixth would have been. The same list
 * therefore fills a wall-mounted fifty-five and a tablet stood upright, with
 * nothing left over on either.
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
                            className="flex h-full flex-col"
                            style={{
                                gap: 'calc(var(--u) * 1)',
                                // One em is a tenth of a tile's shorter side,
                                // so a label is sized against the photograph
                                // it sits on.
                                fontSize: `${layout.side / 10}px`,
                            }}
                        >
                            {layout.rows.map((count, row) => {
                                const start = layout.rows
                                    .slice(0, row)
                                    .reduce((sum, size) => sum + size, 0);

                                return (
                                    <ul
                                        key={row}
                                        className="flex min-h-0 flex-1"
                                        style={{ gap: 'calc(var(--u) * 1)' }}
                                    >
                                        {products
                                            .slice(start, start + count)
                                            .map((product) => (
                                                <Tile
                                                    key={product.id}
                                                    product={product}
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
    showNames,
    showPrices,
}: {
    product: Product;
    showNames: boolean;
    showPrices: boolean;
}) {
    const pricing = usePricing();
    const lead = leadPrice(product);
    const art = product.image ?? product.thumbnail;

    return (
        <li className="relative min-w-0 flex-1 overflow-hidden rounded-[0.45em] bg-black/5">
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
                <div className="absolute inset-x-0 bottom-[0.55em] flex justify-center px-[0.55em]">
                    <div className="flex max-w-full flex-col items-center rounded-[0.4em] bg-white px-[0.7em] py-[0.4em] text-center shadow-[0_0.1em_0.6em_rgb(0_0_0/0.18)]">
                        {showNames && (
                            <span className="max-w-full truncate text-[0.62em] leading-[1.4] font-semibold tracking-wide text-black/60 uppercase">
                                {product.name}
                            </span>
                        )}

                        {/* Dollars only, whatever the storefront quotes in:
                            one figure per tile is what reads from across a
                            room. */}
                        {showPrices && (
                            <span className="flex items-baseline justify-center gap-[0.3em] leading-none tabular-nums">
                                {lead.from && (
                                    <span className="text-[0.55em] font-semibold text-black/50 uppercase">
                                        from
                                    </span>
                                )}

                                {lead.was !== null && (
                                    <span className="text-[0.75em] text-black/40 line-through">
                                        {pricing.usd(lead.was)}
                                    </span>
                                )}

                                <span className="text-[1.35em] font-bold text-black">
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
 * Deal this many dishes into rows for this much room.
 *
 * Every row count is tried, and the one kept is the one whose least square
 * tile is still the most square — judged on the least, because an arrangement
 * is only as good as its worst tile. The dishes are then spread evenly over
 * the rows, so seven go four over three rather than four, two and one.
 */
function dealRows(
    count: number,
    room: { width: number; height: number },
): { rows: number[]; side: number } | null {
    if (count === 0 || room.width <= 0 || room.height <= 0) {
        return null;
    }

    /** How near a tile of this shape is to square: 1 is square, 0 is a line. */
    const squareness = (width: number, height: number): number =>
        Math.min(width, height) / Math.max(width, height);

    let best = { rows: 1, score: 0 };

    for (let rows = 1; rows <= count; rows++) {
        const height = room.height / rows;

        const score = Math.min(
            squareness(room.width / Math.ceil(count / rows), height),
            squareness(room.width / Math.floor(count / rows), height),
        );

        if (score > best.score) {
            best = { rows, score };
        }
    }

    const base = Math.floor(count / best.rows);
    const extra = count % best.rows;

    return {
        // The fuller rows first, so a short row closes the board rather than
        // opening it.
        rows: Array.from({ length: best.rows }, (_, row) =>
            row < extra ? base + 1 : base,
        ),
        side: Math.min(
            room.width / Math.ceil(count / best.rows),
            room.height / best.rows,
        ),
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
