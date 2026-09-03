import { Head } from '@inertiajs/react';
import { Maximize, Minimize } from 'lucide-react';
import { lazy, Suspense, useMemo } from 'react';

import { BoardPage } from '@/components/screen/board-page';
import { ShowcasePage } from '@/components/screen/showcase-page';
import { SlidePage } from '@/components/screen/slide-page';
import { SplitPage } from '@/components/screen/split-page';
import { SpotlightPage } from '@/components/screen/spotlight-page';
import { StoneHouseLogo } from '@/components/stone-house-logo';
import { buildDeck } from '@/lib/screen-deck';
import type { ScreenPage } from '@/lib/screen-deck';
import {
    useClock,
    useFullscreen,
    useIdleChrome,
    useRotation,
    useTimedReload,
    useWakeLock,
} from '@/lib/use-screen';
import { cn } from '@/lib/utils';
import type { Category, Slide } from '@/types';
import type { Screen } from '@/types/screen';

/**
 * The code is split off because almost every screen runs without one, and the
 * encoder has no business being downloaded onto a television that will never
 * draw one.
 */
const OrderQr = lazy(() => import('@/components/menu/order-qr'));

/**
 * A screen hung in the shop: a television over the counter, a tablet on a table.
 *
 * Everything here is written for a room rather than a hand. The page never
 * scrolls, never navigates and never waits to be touched: it takes the whole
 * viewport, turns its own pages on a timer, keeps the set awake, and fetches
 * itself again every so often so a price changed in the dashboard reaches the
 * wall on its own.
 *
 * It is drawn dark whatever the visitor's theme happens to be. A board is on
 * for twelve hours in a lit room, and white at that size is a lamp — the same
 * reason every departure board and every counter menu in the world is light on
 * dark.
 *
 * The one unit everything is sized in, `--u`, is mixed from the viewport's
 * width and height: a fifty-five inch television and a ten inch tablet then
 * draw the same board at the size each room reads it from, without a single
 * breakpoint between them.
 */
export default function ScreenBoard({
    screen,
    categories,
    slides,
}: {
    screen: Screen;
    categories: Category[];
    slides: Slide[];
}) {
    useWakeLock();
    useTimedReload(screen.refreshMinutes);

    const deck = useMemo(
        () =>
            buildDeck({
                categories,
                slides,
                layout: screen.layout,
                orientation: screen.orientation,
            }),
        [categories, slides, screen.layout, screen.orientation],
    );

    const { index, progress } = useRotation(deck.length, screen.holdSeconds);
    const page = deck[index] ?? null;

    const chrome = useIdleChrome();
    const fullscreen = useFullscreen();
    const clock = useClock();

    // A photograph given the whole set, rather than a list inset from it.
    const fullBleed =
        page !== null &&
        (page.kind === 'slide' || screen.layout === 'spotlight');

    // A category page names its category; a promotion is the shop talking, so
    // it carries the shop's name instead.
    const heading =
        page === null || page.kind === 'slide'
            ? screen.name
            : page.category.name;

    return (
        <>
            <Head title={`${screen.name} — Screen`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div
                className={cn(
                    'relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#0b0b0b] text-white select-none',
                    // The pointer is hidden until somebody moves it, so a
                    // tablet or a mounted set never shows an arrow parked in
                    // the middle of the menu.
                    chrome ? 'cursor-default' : 'cursor-none',
                )}
                style={{
                    // Mixed from both axes so one board reads correctly on a
                    // wall-mounted television and on a tablet stood on a table.
                    ['--u' as string]: 'calc(0.6vw + 0.4vh)',
                }}
            >
                <ScreenHeader
                    heading={heading}
                    showLogo={screen.showLogo}
                    clock={clock}
                    page={page}
                />

                {/* The page itself. Keyed by the deck entry so React tears the
                    old one down and the new one animates in — a cross-fade is
                    what makes a board read as a board rather than as a browser
                    being redrawn. */}
                <main
                    className={cn(
                        'relative min-h-0 flex-1',
                        // The layouts built on a photograph run it to the edges
                        // of the set; the ones built on a list are inset, or
                        // the first letter of every line sits on the bezel.
                        fullBleed ? '' : 'px-[3em] pb-[1.5em]',
                    )}
                    style={{ fontSize: 'var(--u)' }}
                >
                    {page === null ? (
                        <EmptyBoard />
                    ) : (
                        <div
                            key={page.key}
                            className="h-full animate-in duration-700 ease-out fade-in motion-reduce:animate-none"
                        >
                            <DeckPage page={page} screen={screen} />
                        </div>
                    )}
                </main>

                <ScreenFooter
                    screen={screen}
                    progress={progress}
                    pages={deck.length}
                    index={index}
                />

                {/* The only control on the board, and only while somebody is
                    touching the set: a tablet cannot be put into fullscreen any
                    other way, because the browser grants it inside a gesture or
                    not at all. */}
                {fullscreen.toggle !== null && (
                    <button
                        type="button"
                        onClick={fullscreen.toggle}
                        aria-label={
                            fullscreen.active
                                ? 'Leave fullscreen'
                                : 'Show fullscreen'
                        }
                        className={cn(
                            'absolute top-[1.5em] right-[1.5em] z-20 rounded-full bg-white/10 p-[0.9em] backdrop-blur-sm transition-opacity duration-300 ease-out',
                            chrome
                                ? 'opacity-100'
                                : 'pointer-events-none opacity-0',
                        )}
                        style={{ fontSize: 'var(--u)' }}
                    >
                        {fullscreen.active ? (
                            <Minimize
                                style={{
                                    width: 'calc(var(--u) * 1.6)',
                                    height: 'calc(var(--u) * 1.6)',
                                }}
                            />
                        ) : (
                            <Maximize
                                style={{
                                    width: 'calc(var(--u) * 1.6)',
                                    height: 'calc(var(--u) * 1.6)',
                                }}
                            />
                        )}
                    </button>
                )}
            </div>
        </>
    );
}

/** The page, drawn in whichever layout the screen is set to. */
function DeckPage({ page, screen }: { page: ScreenPage; screen: Screen }) {
    if (page.kind === 'slide') {
        return <SlidePage slide={page.slide} />;
    }

    if (screen.layout === 'spotlight') {
        return <SpotlightPage page={page} showPrices={screen.showPrices} />;
    }

    if (screen.layout === 'split') {
        return (
            <SplitPage
                page={page}
                orientation={screen.orientation}
                showPrices={screen.showPrices}
            />
        );
    }

    if (screen.layout === 'showcase') {
        return (
            <ShowcasePage
                page={page}
                orientation={screen.orientation}
                showPrices={screen.showPrices}
            />
        );
    }

    return (
        <BoardPage
            page={page}
            orientation={screen.orientation}
            showPrices={screen.showPrices}
        />
    );
}

/**
 * The mark, the heading, and the time.
 *
 * The heading is the category the board is on, which is the one thing a
 * customer needs before they can read anything under it — and when a category
 * runs to several pages it says so, because "1 of 3" is the difference between
 * a customer waiting for the rest and one assuming that was all of it.
 */
function ScreenHeader({
    heading,
    showLogo,
    clock,
    page,
}: {
    heading: string;
    showLogo: boolean;
    clock: string;
    page: ScreenPage | null;
}) {
    const pages = page !== null && page.kind === 'menu' ? page.pages : 1;

    return (
        <header
            className="flex shrink-0 items-center justify-between gap-[2em] px-[3em] pt-[2em] pb-[1.2em]"
            style={{ fontSize: 'var(--u)' }}
        >
            <div className="flex min-w-0 items-center gap-[1.5em]">
                {/* Sized through a wrapper: the mark takes a class list and
                    nothing else, and the board's unit is not a class. */}
                {showLogo && (
                    <span
                        className="block shrink-0"
                        style={{ width: 'calc(var(--u) * 9)' }}
                    >
                        <StoneHouseLogo className="w-full" />
                    </span>
                )}

                <h1
                    className="truncate leading-none font-semibold tracking-wide uppercase"
                    style={{ fontSize: 'calc(var(--u) * 2.4)' }}
                >
                    {heading}
                </h1>

                {pages > 1 && page !== null && page.kind === 'menu' && (
                    <span
                        className="shrink-0 rounded-full bg-white/10 px-[0.9em] py-[0.35em] tracking-[0.2em] text-white/60 tabular-nums"
                        style={{ fontSize: 'calc(var(--u) * 0.85)' }}
                    >
                        {page.page + 1} / {page.pages}
                    </span>
                )}
            </div>

            <span
                className="shrink-0 leading-none font-semibold text-white/45 tabular-nums"
                style={{ fontSize: 'calc(var(--u) * 1.5)' }}
            >
                {clock}
            </span>
        </header>
    );
}

/**
 * The foot: the code to scan, and the bar that says how long is left.
 *
 * The bar is the board's pulse. It tells a customer mid-sentence that the page
 * is about to turn, and it tells anybody walking past a set that has frozen
 * that it has — a still bar is visible from the other side of a room where
 * still text is not.
 */
function ScreenFooter({
    screen,
    progress,
    pages,
    index,
}: {
    screen: Screen;
    progress: number;
    pages: number;
    index: number;
}) {
    return (
        <footer className="shrink-0" style={{ fontSize: 'var(--u)' }}>
            <div className="flex items-end justify-between gap-[2em] px-[3em] pb-[1em]">
                {screen.showQr ? (
                    <div className="flex items-center gap-[1em]">
                        <Suspense
                            fallback={
                                <span
                                    className="block rounded-[0.4em] bg-white/10"
                                    style={{
                                        width: 'calc(var(--u) * 5.5)',
                                        height: 'calc(var(--u) * 5.5)',
                                    }}
                                />
                            }
                        >
                            <OrderQr
                                value={screen.menuUrl}
                                className="rounded-[0.3em]"
                            />
                        </Suspense>

                        <span className="flex flex-col leading-tight">
                            <span
                                className="font-semibold tracking-[0.2em] uppercase"
                                style={{ fontSize: 'calc(var(--u) * 1.05)' }}
                            >
                                Scan for the full menu
                            </span>
                            <span
                                className="text-white/40"
                                style={{ fontSize: 'calc(var(--u) * 0.85)' }}
                            >
                                Point a camera at the code
                            </span>
                        </span>
                    </div>
                ) : (
                    <span />
                )}

                {pages > 1 && (
                    <span
                        className="tracking-[0.25em] text-white/30 uppercase tabular-nums"
                        style={{ fontSize: 'calc(var(--u) * 0.8)' }}
                    >
                        {index + 1} / {pages}
                    </span>
                )}
            </div>

            <div className="h-[0.35em] w-full bg-white/8">
                <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                />
            </div>
        </footer>
    );
}

/** A screen with nothing to show yet, said plainly rather than left black. */
function EmptyBoard() {
    return (
        <div
            className="grid h-full place-items-center text-center text-white/40"
            style={{ fontSize: 'calc(var(--u) * 1.4)' }}
        >
            <p>
                Nothing to show yet — add a category with dishes in it, or a
                slide, and this screen will pick it up.
            </p>
        </div>
    );
}
