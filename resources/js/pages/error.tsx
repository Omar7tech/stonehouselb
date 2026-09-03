import { Head, Link } from '@inertiajs/react';
import { ArrowRight, RotateCcw } from 'lucide-react';

import { SiteBanner } from '@/components/menu/site-banner';
import { SiteFooter } from '@/components/menu/site-footer';
import { SiteHeader } from '@/components/menu/site-header';
import { StoneWallBackdrop } from '@/components/stone-wall-backdrop';
import { StretchText } from '@/components/stretch';
import { nextOpeningLabel, useShop, useShopOpen } from '@/lib/shop';
import { cn } from '@/lib/utils';

/**
 * What each status actually means to somebody standing in front of it.
 *
 * Written the way the shop would say it out loud rather than the way HTTP says
 * it: a customer who mistypes a URL has not encountered a "404 Not Found", they
 * have asked for something that is not on the menu. The line under it is the
 * useful part — what happened, and what to do next.
 */
const COPY: Record<number, { heading: string; body: string; retry?: boolean }> =
    {
        403: {
            heading: 'Staff only',
            body: 'This door goes to the kitchen. The menu is the other way — everything a customer can see is on it.',
        },
        404: {
            heading: 'Not on the menu',
            body: 'That page is not here. It may have been taken down, or the link may have lost a letter on the way over. The menu itself has not moved.',
        },
        419: {
            heading: 'Your table was cleared',
            body: 'The page sat open long enough that it expired. Nothing is lost — go back and try it once more.',
            retry: true,
        },
        429: {
            heading: 'One at a time',
            body: 'That was a lot of requests in a short while, so the kitchen asked us to slow down. Give it a moment and try again.',
            retry: true,
        },
        500: {
            heading: 'Something burned',
            body: 'Something went wrong on our end, and it is being looked at. The menu should be back in a moment.',
            retry: true,
        },
        503: {
            heading: 'Back in a moment',
            body: 'The site is closed for a short while — a clean-down, nothing more. It will be open again shortly.',
            retry: true,
        },
    };

/**
 * The error page: the storefront, with an explanation where the menu goes.
 *
 * Deliberately the whole page rather than a bare message. It carries the same
 * banner, header and footer as everywhere else, so a customer who lands here
 * from a mistyped link or a year-old post is standing in the shop rather than
 * in Laravel — and the way back to the menu is one tap, not the back button.
 *
 * The status is set enormous behind the panel, in the house display face. It is
 * the one place on the site where a number is the picture, and it is what makes
 * the page read as designed rather than as something that broke.
 */
export default function ErrorPage({
    status,
    title,
}: {
    status: number;
    /** Resolved on the server, so the tab is named the way every tab is. */
    title: string;
}) {
    const copy = COPY[status] ?? COPY[500];

    const shopOpen = useShopOpen();
    const opensLabel = nextOpeningLabel(useShop());

    return (
        <>
            <Head title={title}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <StoneWallBackdrop />

            <div className="flex min-h-screen flex-col">
                <SiteBanner />

                <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col lg:max-w-5xl xl:max-w-6xl">
                    <SiteHeader />

                    <main className="relative isolate mx-2 mt-3 mb-10 flex flex-1 flex-col justify-center overflow-hidden rounded-[2rem] bg-surface px-6 py-14 shadow-[0_-6px_20px_rgb(0_0_0/0.11)] lg:mx-4 lg:px-12 lg:py-20">
                        {/* The status, blown up and pushed almost all the way
                            into the panel. Ligatures off: 404 and 500 both
                            carry a doubled character, and the display face
                            would otherwise widen one digit of each. */}
                        <StretchText
                            aria-hidden
                            className="pointer-events-none absolute -top-6 -right-4 font-display text-[9rem] leading-none text-primary tabular-nums opacity-[0.07] select-none sm:text-[14rem] lg:-top-10 lg:text-[20rem]"
                        >
                            {status}
                        </StretchText>

                        <div className="relative flex max-w-xl flex-col items-start gap-5">
                            {/* The number said plainly as well, small, as a
                                ticket stub — the shape the boards use for a
                                price, so it reads as this shop's furniture. */}
                            <span className="relative rounded-full bg-primary px-4 py-1.5 font-display text-xs text-primary-foreground tabular-nums">
                                Error {status}
                            </span>

                            <StretchText
                                as="h1"
                                className="font-display text-3xl leading-[0.95] text-balance uppercase sm:text-4xl lg:text-5xl"
                            >
                                {copy.heading}
                            </StretchText>

                            <p className="text-base text-muted-foreground sm:text-lg">
                                {copy.body}
                            </p>

                            {/* The shop's own state, which is the one thing a
                                customer who landed here by accident may
                                actually have come to find out. */}
                            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                                {shopOpen
                                    ? 'Open now — the menu is taking orders'
                                    : opensLabel
                                      ? `Closed right now. ${opensLabel}.`
                                      : 'Closed right now. The menu is open to browse.'}
                            </p>

                            <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
                                <ErrorLink href="/menu/dine-in" primary>
                                    See the menu
                                </ErrorLink>

                                <ErrorLink href="/">
                                    Back to the start
                                </ErrorLink>

                                {/* Only where trying again is the actual fix.
                                    On a 404 it would just fetch the same
                                    missing page a second time. */}
                                {copy.retry && (
                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="group/button inline-flex h-14 items-center justify-center gap-2 rounded-full border border-foreground/15 px-6 font-display text-sm uppercase transition-colors duration-200 ease-out hover:bg-foreground/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                    >
                                        <RotateCcw className="size-4 transition-transform duration-500 ease-out group-hover/button:-rotate-180 motion-reduce:transform-none" />
                                        <StretchText>Try again</StretchText>
                                    </button>
                                )}
                            </div>
                        </div>
                    </main>
                </div>

                <SiteFooter />
            </div>
        </>
    );
}

/**
 * One way out of here. The arrow rides off to the right and a fresh one climbs
 * in behind it, the same way the landing page's buttons handle theirs — the
 * error page is not the place to invent a new one.
 */
function ErrorLink({
    href,
    primary = false,
    children,
}: {
    href: string;
    primary?: boolean;
    children: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'group/button inline-flex h-14 flex-1 items-center justify-between gap-3 rounded-full px-6 font-display text-sm uppercase transition-shadow duration-300 ease-out focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                primary
                    ? 'bg-primary text-primary-foreground shadow-md hover:shadow-xl'
                    : 'border border-foreground/15 hover:bg-foreground/5',
            )}
        >
            <StretchText>{children}</StretchText>

            <span className="relative flex size-5 shrink-0 items-center justify-center overflow-hidden">
                <ArrowRight className="size-5 transition-transform duration-300 ease-out group-hover/button:translate-x-7 motion-reduce:transform-none" />
                <ArrowRight
                    aria-hidden
                    className="absolute size-5 -translate-x-7 transition-transform duration-300 ease-out group-hover/button:translate-x-0 motion-reduce:hidden"
                />
            </span>
        </Link>
    );
}
