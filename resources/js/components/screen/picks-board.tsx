import { Maximize, Minimize } from 'lucide-react';
import type { ReactNode, RefObject } from 'react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { StoneHouseLogo } from '@/components/stone-house-logo';
import { leadPrice } from '@/lib/screen-deck';
import { useFullscreen, useIdleChrome } from '@/lib/use-screen';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { Screen, ScreenLabelStyle } from '@/types/screen';

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
                                                    labelStyle={
                                                        screen.labelStyle
                                                    }
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
 * One dish: its photograph, labelled with what it is and what it costs.
 *
 * The label is always white with black figures, whatever is in the picture and
 * whichever of the three styles the shop chose. A figure laid straight over a
 * photograph is only readable where the photograph happens to be dark, and the
 * price is the one thing here that has to be readable on every tile.
 */
function Tile({
    product,
    width,
    height,
    labelStyle,
    showNames,
    showPrices,
}: {
    product: Product;
    width: number;
    height: number;
    labelStyle: ScreenLabelStyle;
    showNames: boolean;
    showPrices: boolean;
}) {
    const art = product.image ?? product.thumbnail;

    return (
        <li
            className="relative shrink-0 overflow-hidden rounded-[0.35em] bg-black/5"
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
                <Label
                    style={labelStyle}
                    name={showNames ? <Name product={product} /> : null}
                    price={showPrices ? <Price product={product} /> : null}
                />
            )}
        </li>
    );
}

/**
 * The label, in whichever of the three styles the shop chose.
 *
 * Every one of them is sized against the tile but never below what a figure
 * can be read at, however many tiles the screen is carrying — and every one of
 * them sits inside the photograph, so changing the style never changes how
 * large the tiles are drawn.
 */
function Label({
    style,
    name,
    price,
}: {
    style: ScreenLabelStyle;
    name: ReactNode;
    price: ReactNode;
}) {
    // A strip across the whole foot of the photograph, the two halves of the
    // label pushed to its two ends. With only one of them to print, that one
    // takes the middle rather than sitting against an edge on its own.
    if (style === 'band') {
        return (
            <div
                className={cn(
                    'absolute inset-x-0 bottom-0 flex items-center gap-[0.8em] bg-white px-[0.75em] py-[0.4em] text-[max(0.92em,14px)] text-black',
                    name !== null && price !== null
                        ? 'justify-between'
                        : 'justify-center',
                )}
            >
                {name}
                {price}
            </div>
        );
    }

    // A badge floating just inside the photograph. The one style with a
    // shadow, because it is the one that really is lying on the picture.
    if (style === 'pill') {
        return (
            <div className="absolute inset-x-0 bottom-[0.55em] flex justify-center px-[0.55em]">
                <div className="flex max-w-full min-w-0 flex-col items-center rounded-[1.1em] bg-white px-[1em] py-[0.38em] text-center text-[max(0.92em,14px)] text-black shadow-[0_0.08em_0.45em_rgb(0_0_0/0.22)]">
                    {name}
                    {price}
                </div>
            </div>
        );
    }

    // A tab of the board's own white that rises out of the gutter under the
    // tile, its shoulders curving back into the photograph — so it reads as a
    // notch cut out of the picture rather than as a sticker stuck onto it, the
    // way a price is cut into a shelf-edge card. `--r` is the one radius its
    // crown and its two shoulders are all drawn with.
    return (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-[0.9em]">
            <div
                className="relative flex max-w-full min-w-0 flex-col items-center rounded-t-(--r) bg-white px-[0.85em] pt-[0.45em] pb-[0.3em] text-center text-[max(0.92em,14px)] text-black"
                style={{ ['--r' as string]: '0.6em' }}
            >
                <Shoulder side="left" />
                <Shoulder side="right" />

                {name}
                {price}
            </div>
        </div>
    );
}

/** What the dish is called, small and spaced, cut short rather than wrapped. */
function Name({ product }: { product: Product }) {
    return (
        <span className="max-w-full min-w-0 truncate text-[0.44em] leading-[1.7] font-semibold tracking-[0.14em] text-black/55 uppercase">
            {product.name}
        </span>
    );
}

/** What the dish costs: the figure, and beside it what it was or starts at. */
function Price({ product }: { product: Product }) {
    const lead = leadPrice(product);

    return (
        <span className="flex shrink-0 items-start justify-center gap-[0.4em] leading-none tabular-nums">
            {lead.from && (
                <span className="self-end pb-[0.2em] text-[0.42em] font-semibold tracking-[0.14em] text-black/50 uppercase">
                    from
                </span>
            )}

            {lead.was !== null && (
                <span className="self-end pb-[0.12em] text-[0.6em] font-medium text-black/40 line-through">
                    {formatFigure(lead.was)}
                </span>
            )}

            <Figure amount={lead.price} />
        </span>
    );
}

/**
 * One of the two curves that run the tab back into the photograph.
 *
 * A square of white standing beside the tab at the foot of the tile, with a
 * quarter circle taken out of it — which leaves exactly the sliver between the
 * tab's side and the tile's bottom edge. A gradient rather than a mask or a
 * clip-path: it is the one way to draw this that a ten-year-old television
 * draws too.
 */
function Shoulder({ side }: { side: 'left' | 'right' }) {
    const corner = side === 'left' ? '0 0' : '100% 0';

    return (
        <span
            aria-hidden
            className="absolute bottom-0 size-(--r)"
            style={{
                // Tucked half a pixel under the tab, so no hairline of
                // photograph shows between the two at an odd zoom.
                [side === 'left' ? 'right' : 'left']: 'calc(100% - 0.5px)',
                background: `radial-gradient(circle at ${corner}, transparent calc(var(--r) - 0.5px), #fff var(--r))`,
            }}
        />
    );
}

/**
 * A price set the way a menu sets one: the figure large, the sign small and
 * raised beside it, and no cents at all on a round figure.
 * "$4" is read at a glance from across a room; "$4.00" is read as four digits.
 *
 * Dollars only, whatever the storefront quotes in: one figure per tile.
 */
function Figure({ amount }: { amount: number }) {
    const { dollars, cents } = splitFigure(amount);

    return (
        <span
            className="flex items-start font-extrabold tracking-tight"
            aria-label={formatFigure(amount)}
        >
            <span aria-hidden className="pt-[0.12em] text-[0.5em]">
                $
            </span>
            <span aria-hidden>
                {cents === null ? dollars : `${dollars}.${cents}`}
            </span>
        </span>
    );
}

/** A price as whole dollars and, unless it is a round figure, its cents. */
function splitFigure(amount: number): {
    dollars: string;
    cents: string | null;
} {
    const total = Math.round(amount * 100);
    const cents = total % 100;

    return {
        dollars: Math.floor(total / 100).toLocaleString('en-US'),
        cents: cents === 0 ? null : String(cents).padStart(2, '0'),
    };
}

/** The same figure on one line, for the struck-through price and for readers. */
function formatFigure(amount: number): string {
    const { dollars, cents } = splitFigure(amount);

    return cents === null ? `$${dollars}` : `$${dollars}.${cents}`;
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
