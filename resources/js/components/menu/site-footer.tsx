import { usePage } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';

import { StretchText } from '@/components/stretch';

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
 */
export function SiteFooter() {
    const { socialLinks } = usePage().props;

    return (
        <footer className="relative overflow-hidden rounded-t-[2rem] text-primary-foreground shadow-[0_-6px_20px_rgb(0_0_0/0.11)]">
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

                {/* One line per account, ruled like a listing. Nothing changes
                    colour on hover — the row's own rule simply draws itself in
                    under the name, which is all the pointing it needs.

                    With nothing listed the whole rule disappears rather than
                    leaving an empty box under the mark. Keyed by position: two
                    rows may well share a name, and the order is the owner's. */}
                {socialLinks.length > 0 && (
                    <ul className="relative mt-9 border-t border-primary-foreground/20">
                        {socialLinks.map(({ label, url }, index) => (
                            <li
                                key={index}
                                className="border-b border-primary-foreground/20"
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
                                        className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-primary-foreground transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
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
            </div>
        </footer>
    );
}
