import { usePage } from '@inertiajs/react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { CSSProperties } from 'react';

import { ShopHours } from '@/components/menu/shop-hours';
import { StretchText } from '@/components/stretch';
import { hasPublishedHours, useShop } from '@/lib/shop';
import { cn } from '@/lib/utils';

/** The mark's own proportions, taken from the artwork's viewBox. */
const LOGO_ASPECT = '291.18 / 118.35';

/**
 * The wordmark, cut out of the slab rather than drawn on it.
 *
 * Two mask layers: the whole sheet, and the artwork on top of it composited
 * away, which leaves the sheet with the mark missing. The artwork is the same
 * file the inline logo was traced from, so the hole is the mark exactly.
 *
 * Its place is set by the numbers the column below already uses — centred,
 * `py-10` from the top, and as wide as `max-w-2xl` less its `px-6` — so the
 * hole lands on the space held open for it without either side measuring the
 * other. `auto` takes the height from the artwork's own ratio.
 */
const LOGO_KNOCKOUT = {
    maskImage: "url('/logos/logo.svg'), linear-gradient(#000, #000)",
    WebkitMaskImage: "url('/logos/logo.svg'), linear-gradient(#000, #000)",
    maskPosition: 'center 2.5rem, 0 0',
    WebkitMaskPosition: 'center 2.5rem, 0 0',
    maskSize: 'min(100% - 3rem, 39rem) auto, auto',
    WebkitMaskSize: 'min(100% - 3rem, 39rem) auto, auto',
    maskRepeat: 'no-repeat, repeat',
    WebkitMaskRepeat: 'no-repeat, repeat',
    maskComposite: 'exclude',
    WebkitMaskComposite: 'xor',
} satisfies CSSProperties;

/**
 * The maker's mark at the foot, taken out of the slab's own ink the way the
 * wordmark above it is taken out of the orange.
 *
 * The artwork is drawn in white, which would be the one thing on this slab not
 * wearing the footer's colours — and would vanish outright in the light theme,
 * where the ink is the dark half of the pair. Masked, it is whatever
 * `bg-current` is, so it follows the line of type beside it in both themes.
 */
const MAKER_MARK = {
    maskImage: "url('/logos/yamenlogo.svg')",
    WebkitMaskImage: "url('/logos/yamenlogo.svg')",
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    /** The artwork's own proportions, from its viewBox. */
    aspectRatio: '1151.2 / 110.92',
} satisfies CSSProperties;

/**
 * The foot of the page: one orange slab the whole menu comes to rest on.
 *
 * It is the wall's opposite — solid brand colour where everything above it is
 * stone and white — so the page closes on a full stop rather than trailing off
 * into more wallpaper. Rounded and shadowed like the menu panel above it, so
 * the two read as a pair of slabs rather than as a panel and a background.
 *
 * The rows are whatever the owner has listed in the dashboard. Named rather
 * than drawn: the logo is the only mark on this slab, so a row of borrowed
 * glyphs underneath it would be the second brand on the page.
 *
 * Above them, when an address is configured, one filled button to the shop's
 * place on a map — the one link here worth more than a line of its own.
 */
export function SiteFooter() {
    const { socialLinks, locationUrl } = usePage().props;
    // The hours draw their own rule above them, so the list below only tightens
    // up under the location button when there is nothing in between.
    const hoursShown = hasPublishedHours(useShop());

    return (
        <footer className="relative overflow-hidden rounded-t-[2rem] text-slab-ink shadow-[0_-6px_20px_rgb(0_0_0/0.11)]">
            {/* The orange itself, so the wordmark can be taken out of it. The
                colour cannot sit on the footer: whatever is behind the hole
                would be filled straight back in. */}
            <div
                aria-hidden
                style={LOGO_KNOCKOUT}
                className="absolute inset-0 bg-primary"
            />

            {/* The slab runs edge to edge; only its contents keep to the same
                column the menu above them stands in. */}
            <div className="relative mx-auto w-full max-w-2xl px-6 py-10 lg:max-w-5xl xl:max-w-6xl">
                {/* The room the cut-out mark stands in. It is the wall showing
                    through the slab rather than any ink of its own, so there is
                    nothing here to draw — only its name, for readers. */}
                {/* Pinned to 39rem once the column is wider than that, because
                    that is exactly where the knockout's own `maskSize` stops
                    growing. Let this widen past it and the space held open no
                    longer matches the hole, so the links drop below the mark
                    instead of sitting under it. */}
                <div
                    role="img"
                    aria-label="Stone House — Crunch &amp; Grill"
                    style={{ aspectRatio: LOGO_ASPECT }}
                    className="w-full lg:mx-auto lg:w-[39rem]"
                />

                {/* The one thing a menu's foot is actually asked for, so it is
                    a filled block rather than another line in the list: the
                    slab's colours swapped, which on hover swap back and leave
                    the button outlined. Left out entirely when the owner has
                    set no address. */}
                {locationUrl && (
                    <a
                        href={locationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative mt-9 flex items-center justify-center gap-3 rounded-full border border-slab-ink bg-slab-ink px-6 py-4 text-primary transition-colors duration-300 ease-out hover:bg-transparent hover:text-slab-ink focus-visible:bg-transparent focus-visible:text-slab-ink focus-visible:outline-none motion-reduce:transition-none"
                    >
                        <MapPin
                            className="size-5 shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5 motion-reduce:transform-none"
                            strokeWidth={2.5}
                        />

                        <StretchText className="font-display text-lg uppercase sm:text-xl">
                            Find us
                        </StretchText>
                    </a>
                )}

                {/* Where the shop is, then when it is there. */}
                <ShopHours />

                {/* One line per account, ruled like a listing. Nothing changes
                    colour on hover — the row's own rule simply draws itself in
                    under the name, which is all the pointing it needs.

                    With nothing listed the whole rule disappears rather than
                    leaving an empty box under the mark. Keyed by position: two
                    rows may well share a name, and the order is the owner's. */}
                {socialLinks.length > 0 && (
                    <ul
                        className={cn(
                            'relative border-t border-slab-ink/20',
                            // Closer under the button than under the mark: the
                            // two belong to the same block of business.
                            locationUrl && !hoursShown ? 'mt-6' : 'mt-9',
                        )}
                    >
                        {socialLinks.map(({ label, url }, index) => (
                            <li
                                key={index}
                                className="border-b border-slab-ink/20"
                            >
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group relative flex items-center justify-between gap-4 py-3 focus-visible:outline-none"
                                >
                                    {/* Drawn straight over the faint rule the row
                                    already sits on, so the line brightens in
                                    place rather than a second one appearing. */}
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-slab-ink transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
                                    />

                                    <StretchText className="font-display text-lg uppercase transition-transform duration-300 ease-out group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5 motion-reduce:transform-none sm:text-xl">
                                        {label}
                                    </StretchText>

                                    {/* The arrow rides off the corner and a fresh
                                    one climbs in behind it, the same way the
                                    landing buttons handle theirs. */}
                                    <span className="relative flex size-5 items-center justify-center overflow-hidden">
                                        <ArrowUpRight
                                            className="size-5 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-6 group-hover:-translate-y-6 group-focus-visible:translate-x-6 group-focus-visible:-translate-y-6 motion-reduce:transform-none"
                                            strokeWidth={2.5}
                                        />
                                        <ArrowUpRight
                                            aria-hidden
                                            className="absolute size-5 shrink-0 -translate-x-6 translate-y-6 transition-transform duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-focus-visible:translate-x-0 group-focus-visible:translate-y-0 motion-reduce:hidden"
                                            strokeWidth={2.5}
                                        />
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="relative mt-7 flex items-center justify-between gap-4 text-[0.65rem] uppercase opacity-70">
                    <span>© {new Date().getFullYear()} Stone House</span>
                    <span>Crunch &amp; Grill</span>
                </div>

                {/* Who built it, under the shop's own line and quieter than it:
                    a credit is the last thing on the page, not a second name
                    over the door. It brightens on hover, which is the only
                    thing marking it as somewhere to go. */}
                <a
                    href="https://yamencreates.com"
                    target="_blank"
                    rel="noreferrer"
                    className="relative mt-4 flex items-center justify-center gap-2 text-[0.65rem] uppercase opacity-50 transition-opacity duration-300 ease-out hover:opacity-90 focus-visible:opacity-90 focus-visible:outline-none motion-reduce:transition-none"
                >
                    <span>Crafted by</span>

                    {/* The mark itself, and the only name it needs: the label
                        is what a reader hears in place of the artwork. */}
                    <span
                        role="img"
                        aria-label="Yamen Creates"
                        style={MAKER_MARK}
                        className="h-2.5 bg-current"
                    />
                </a>
            </div>
        </footer>
    );
}
