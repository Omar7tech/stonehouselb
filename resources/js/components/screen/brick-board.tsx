import { Maximize, Minimize } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';

import { ScreenMarks } from '@/components/screen/screen-marks';
import { SmartImage } from '@/components/smart-image';
import { StoneHouseLogo } from '@/components/stone-house-logo';
import { StretchText } from '@/components/stretch';
import { formatUsd } from '@/lib/currency';
import { leadPrice } from '@/lib/screen-deck';
import {
    useFullscreen,
    useIdleChrome,
    useIsPortrait,
    useRotation,
} from '@/lib/use-screen';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { Screen } from '@/types/screen';

const OrderQr = lazy(() => import('@/components/menu/order-qr'));

/** How many dishes a page is drawn for, which is what sizes everything on it. */
type Density = 'six' | 'four' | 'two';

/** One brush stroke: where its middle lands, how long it is, how it leans. */
type Stroke = { x: string; y: string; length: string; angle: number };

/**
 * The strokes behind each poster. Two run down the wall behind the columns,
 * showing between the rows and past the top and foot of the board; the large
 * poster has one thrown across its corner instead, because it has no rows for
 * two to show between.
 */
const STROKES: Record<Density, Stroke[]> = {
    six: [
        { x: '11%', y: '53%', length: '128vh', angle: 92 },
        { x: '59%', y: '56%', length: '128vh', angle: 88 },
    ],
    four: [
        { x: '13%', y: '51%', length: '112vh', angle: 91 },
        { x: '62%', y: '53%', length: '112vh', angle: 88 },
    ],
    two: [{ x: '76%', y: '21%', length: '96vw', angle: 29 }],
};

/**
 * The room each poster leaves around its dishes. The top margin is what the
 * logo sits in; the small tiles leave it less because their labels are shorter
 * than their photographs, and the mark slots in above the corner one.
 */
const STAGES: Record<Density, { landscape: string; portrait: string }> = {
    six: {
        landscape: 'gap-x-[2.4vw] gap-y-[2.4vh] px-[3.5vw] pt-[5vh] pb-[5vh]',
        portrait: 'gap-x-[3vw] gap-y-[2vh] px-[4vw] pt-[9vh] pb-[3vh]',
    },
    four: {
        landscape: 'gap-x-[2.4vw] gap-y-[3.6vh] px-[3.5vw] pt-[11vh] pb-[9vh]',
        portrait: 'gap-x-[3vw] gap-y-[2.5vh] px-[4vw] pt-[9vh] pb-[4vh]',
    },
    two: {
        landscape: 'gap-x-[2.6vw] px-[5vw] pt-[9.5vh] pb-[4vh]',
        portrait: 'gap-y-[2.5vh] px-[6vw] pt-[9vh] pb-[3vh]',
    },
};

/** How large a label's type is drawn, in board units, per poster. */
const TYPE: Record<Density, { side: number; stacked: number }> = {
    six: { side: 2.5, stacked: 1.9 },
    four: { side: 2.3, stacked: 2.3 },
    two: { side: 3.4, stacked: 3.4 },
};

/**
 * The poster board: the dishes the shop chose, up on a whitewashed brick wall.
 *
 * Where the hand-picked board is a shelf, this one is printed matter — the same
 * wall, the same orange brush work and the same joined-up photograph and label
 * as the shop's own artwork, three sizes of it. A page of five or six dishes is
 * drawn as two columns of photographs with their labels running off to the
 * side; three or four the same, larger; and one or two take the screen, the
 * label laid across the foot of the photograph.
 *
 * Which of the three a page gets is settled by what is actually on that page,
 * not by the setting alone, so the two dishes left over at the end of a list
 * are drawn large rather than rattling around in a grid made for six. Anything
 * beyond one page turns over on the timer the other boards use.
 *
 * It measures the set for itself: stood on end, every tile stacks its label
 * under its photograph, because a label running sideways out of a photograph
 * has nowhere to go on a narrow screen.
 */
export function BrickBoard({
    screen,
    products,
}: {
    screen: Screen;
    products: Product[];
}) {
    const pages = useMemo(() => {
        const size = Math.max(screen.dishesPerPage, 1);

        return Array.from(
            { length: Math.ceil(products.length / size) },
            (_, page) => products.slice(page * size, (page + 1) * size),
        );
    }, [products, screen.dishesPerPage]);

    const { index, progress } = useRotation(pages.length, screen.holdSeconds);
    const dishes = pages[index] ?? [];

    const chrome = useIdleChrome();
    const fullscreen = useFullscreen();
    const portrait = useIsPortrait();

    return (
        <div
            className={cn(
                'relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#f2eee4] bg-cover bg-center text-neutral-900 select-none',
                chrome ? 'cursor-default' : 'cursor-none',
            )}
            style={{
                // The same unit the other boards are sized in, so the code and
                // the controls are the size they are everywhere else.
                ['--u' as string]: 'calc(0.6vw + 0.4vh)',
                backgroundImage: "url('/cover/brick-wall.webp')",
                fontSize: 'var(--u)',
            }}
        >
            <main className="relative min-h-0 flex-1">
                {dishes.length === 0 ? (
                    <p
                        className="relative grid h-full place-items-center text-center text-neutral-500"
                        style={{ fontSize: 'calc(var(--u) * 1.4)' }}
                    >
                        Nothing chosen yet — pick the dishes for this screen in
                        the dashboard and it will show them.
                    </p>
                ) : (
                    // Keyed by the page so the old one is torn down and the
                    // tiles of the new one set themselves down in turn.
                    <Poster
                        key={index}
                        dishes={dishes}
                        portrait={portrait}
                        screen={screen}
                    />
                )}
            </main>

            {/* A printed poster carries its mark small, in the corner, in ink
                rather than in the orange the rest of it is shouting in. */}
            {screen.showLogo && (
                <span
                    className="absolute z-20 block"
                    style={{ top: '2.6vh', right: '1.6vw', width: '8vw' }}
                >
                    <StoneHouseLogo className="w-full animate-none text-neutral-900 [&_*]:animate-none!" />
                </span>
            )}

            {screen.showQr && (
                <footer className="relative z-10 flex shrink-0 items-center justify-center gap-[1em] pb-[1em]">
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

            {/* How long is left on the page, for a board with more than one. */}
            {pages.length > 1 && (
                <div className="relative z-10 h-[0.35em] w-full shrink-0 bg-black/10">
                    <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                </div>
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
                    className="absolute z-30 rounded-full bg-white text-neutral-900 shadow-md [&>svg]:size-[calc(var(--u)*1.6)]"
                    style={{
                        bottom: 'calc(var(--u) * 2)',
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

/** One page of the board: its brush strokes, and its dishes over them. */
function Poster({
    dishes,
    portrait,
    screen,
}: {
    dishes: Product[];
    portrait: boolean;
    screen: Screen;
}) {
    const density = densityFor(dishes.length);

    // The large poster goes one over the other on a tall set; every other
    // arrangement is two columns whichever way up the screen is.
    const columns = density === 'two' && portrait ? 1 : 2;
    const stacked = density === 'two' || portrait;
    const stage = STAGES[density][portrait ? 'portrait' : 'landscape'];

    return (
        <div className="absolute inset-0 animate-in duration-700 ease-out fade-in motion-reduce:animate-none">
            {STROKES[density].map((stroke) => (
                <BrushStroke key={stroke.x} stroke={stroke} />
            ))}

            <div
                className={cn(
                    'relative grid h-full min-h-0',
                    columns === 2 ? 'grid-cols-2' : 'grid-cols-1',
                    density === 'six' && 'grid-rows-3',
                    density === 'four' && 'grid-rows-2',
                    density === 'two' &&
                        (portrait ? 'grid-rows-2' : 'grid-rows-1'),
                    stage,
                )}
            >
                {dishes.map((product, order) => (
                    <Tile
                        key={product.id}
                        product={product}
                        order={order}
                        density={density}
                        stacked={stacked}
                        // An odd dish out sits in the middle of the last row,
                        // rather than leaving a hole beside it.
                        centred={
                            columns === 2 &&
                            order === dishes.length - 1 &&
                            order % 2 === 0
                        }
                        screen={screen}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * One sweep of the brush, laid behind the tiles.
 *
 * The art is one image, stretched and turned into place, so each poster can
 * lean its strokes its own way without a picture of its own.
 */
function BrushStroke({ stroke }: { stroke: Stroke }) {
    return (
        <img
            src="/cover/brush-stroke.webp"
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute max-w-none"
            style={{
                left: stroke.x,
                top: stroke.y,
                width: stroke.length,
                height: '17vmin',
                transform: `translate(-50%, -50%) rotate(${stroke.angle}deg)`,
            }}
        />
    );
}

/**
 * One dish: its photograph, and the orange label joined on to it.
 *
 * The label runs out of the side of the photograph while the tile is wider than
 * it is tall, tucked behind it so the two read as one shape. When the tile is
 * large or the set is narrow it lies across the foot of the photograph instead,
 * inset a little so the picture shows either side of it.
 */
function Tile({
    product,
    order,
    density,
    stacked,
    centred,
    screen,
}: {
    product: Product;
    /** Its place on the page, which is what staggers the entrance. */
    order: number;
    density: Density;
    stacked: boolean;
    centred: boolean;
    screen: Screen;
}) {
    const labelled = screen.showNames || screen.showPrices;
    const art = product.image ?? product.thumbnail;

    return (
        <article
            className={cn(
                'relative flex min-h-0 min-w-0 animate-board-tile items-center',
                centred && 'col-span-2 mx-auto w-[49%]',
            )}
            style={{ animationDelay: `${order * 90}ms` }}
        >
            <div
                className={cn(
                    'overflow-hidden rounded-[1.5em] border border-primary/25 bg-[#ece9f0]',
                    !labelled && 'absolute inset-0',
                    labelled &&
                        (stacked
                            ? 'absolute inset-x-0 top-0 bottom-[11%]'
                            : 'relative z-10 h-full w-[46%] shrink-0'),
                )}
            >
                {art === null ? (
                    // A dish with no photograph still holds its tile, and
                    // still says what it is when the label is not going to.
                    !screen.showNames && (
                        <span className="absolute inset-0 grid place-items-center p-[1em] text-center text-[1.4em] leading-tight font-semibold text-neutral-400 uppercase">
                            {product.name}
                        </span>
                    )
                ) : (
                    <SmartImage
                        src={art}
                        alt={product.name}
                        loading="eager"
                        className="absolute inset-0 h-full w-full"
                        imgClassName="h-full w-full object-cover"
                        spinnerClassName="bg-black/5 text-black/20"
                    />
                )}

                {screen.showMarks && (
                    <ScreenMarks
                        product={product}
                        scale={1.3}
                        className="absolute top-[0.8em] right-[0.8em] rounded-full bg-white p-[0.45em]"
                    />
                )}
            </div>

            {labelled && (
                <div
                    className={cn(
                        'flex min-w-0 flex-col justify-center gap-[0.5em] bg-primary text-white',
                        stacked
                            ? 'absolute inset-x-[5%] bottom-0 z-10 h-[29%] items-center rounded-[1.5em] px-[1em] text-center'
                            : '-ml-[1.5em] h-[66%] flex-1 rounded-r-[1.5em] pr-[1.2em] pl-[3.2em]',
                    )}
                >
                    {screen.showNames && (
                        <Name
                            name={product.name}
                            size={TYPE[density][stacked ? 'stacked' : 'side']}
                        />
                    )}

                    {screen.showPrices && (
                        <Price
                            product={product}
                            size={TYPE[density][stacked ? 'stacked' : 'side']}
                        />
                    )}
                </div>
            )}
        </article>
    );
}

/** What the dish is called, stepped down until a long name sits on two lines. */
function Name({ name, size }: { name: string; size: number }) {
    return (
        <StretchText
            as="h2"
            className="line-clamp-2 max-w-full font-display leading-[1.15] text-balance"
            style={{ fontSize: `calc(var(--u) * ${size * fitted(name)})` }}
        >
            {name}
        </StretchText>
    );
}

/**
 * What the dish costs: the same face and white as its name, so the two print
 * as one block.
 *
 * Dollars only, whatever the storefront quotes in: one figure per label.
 */
function Price({ product, size }: { product: Product; size: number }) {
    const lead = leadPrice(product);
    const figure = formatUsd(lead.price);

    return (
        <span className="flex max-w-full items-baseline gap-[0.5em] font-display leading-none tabular-nums [font-variant-ligatures:none]">
            {lead.from && (
                <span
                    className="text-white/80"
                    style={{ fontSize: `calc(var(--u) * ${size * 0.42})` }}
                >
                    from
                </span>
            )}

            {lead.was !== null && (
                <span
                    className="text-white/70 line-through"
                    style={{ fontSize: `calc(var(--u) * ${size * 0.55})` }}
                >
                    {formatUsd(lead.was)}
                </span>
            )}

            <span
                style={{
                    fontSize: `calc(var(--u) * ${size * fitted(figure)})`,
                }}
            >
                {figure}
            </span>
        </span>
    );
}

/** The poster a page of this many dishes is drawn as. */
function densityFor(count: number): Density {
    if (count <= 2) {
        return 'two';
    }

    return count <= 4 ? 'four' : 'six';
}

/**
 * How far to bring a line of type down so it fits its label.
 *
 * Stretch Pro is the widest face on the site, and a figure measured off the
 * text itself would need the font loaded and a second pass on every page. The
 * length alone is near enough, and it costs nothing on a television.
 */
function fitted(text: string): number {
    if (text.length <= 10) {
        return 1;
    }

    if (text.length <= 18) {
        return 0.8;
    }

    return text.length <= 28 ? 0.66 : 0.54;
}
