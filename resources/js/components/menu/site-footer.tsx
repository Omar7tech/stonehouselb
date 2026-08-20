import { StoneHouseLogo } from '@/components/stone-house-logo';
import { StretchText } from '@/components/stretch';

/**
 * Where to find Stone House once you are off the menu.
 *
 * PLACEHOLDER accounts, here only so the rows can be judged with real-looking
 * copy in them. Swap for the restaurant's own before this ships.
 *
 * Named rather than drawn: the logo is the only mark on this slab, so a row of
 * borrowed glyphs underneath it would be the second brand on the page.
 */
const SOCIALS = [
    {
        label: 'Instagram',
        handle: '@stonehouselb',
        href: 'https://instagram.com/stonehouselb',
    },
    {
        label: 'TikTok',
        handle: '@stonehouselb',
        href: 'https://tiktok.com/@stonehouselb',
    },
    {
        label: 'Facebook',
        handle: 'Stone House',
        href: 'https://facebook.com/stonehouselb',
    },
    {
        label: 'WhatsApp',
        handle: '+961 71 000 000',
        href: 'https://wa.me/96171000000',
    },
] as const;

/**
 * The foot of the page: one orange slab the whole menu comes to rest on.
 *
 * It is the wall's opposite — solid brand colour where everything above it is
 * stone and white — so the page closes on a full stop rather than trailing off
 * into more wallpaper. Rounded and shadowed like the menu panel above it, so
 * the two read as a pair of slabs rather than as a panel and a background.
 */
export function SiteFooter() {
    return (
        <footer className="relative overflow-hidden rounded-t-[2rem] bg-primary text-primary-foreground shadow-[0_-6px_20px_rgb(0_0_0/0.11)]">
            {/* The slab runs edge to edge; only its contents keep to the same
                column the menu above them stands in. */}
            <div className="mx-auto w-full max-w-2xl px-6 py-10">
                <StoneHouseLogo className="relative w-32 text-primary-foreground select-none sm:w-40" />

                {/* One line per account, ruled like a listing. Hovering sweeps the
                row white and drops the type back to orange — the row lights up
                where an icon would otherwise have to do the pointing. */}
                <ul className="relative mt-9 border-t border-primary-foreground/20">
                    {SOCIALS.map(({ label, handle, href }) => (
                        <li
                            key={label}
                            className="border-b border-primary-foreground/20"
                        >
                            <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="group relative flex items-center justify-between gap-4 overflow-hidden py-4 focus-visible:outline-none"
                            >
                                {/* Run out past the row's own box so the sweep
                                reaches the slab's edges; the footer clips it. */}
                                <span
                                    aria-hidden
                                    className="absolute -inset-x-6 inset-y-0 origin-left scale-x-0 bg-primary-foreground transition-transform duration-400 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
                                />

                                <StretchText className="relative font-display text-[0.7rem] uppercase transition-colors duration-300 group-hover:text-primary group-focus-visible:text-primary sm:text-xs">
                                    {label}
                                </StretchText>

                                <span className="relative text-xs tracking-wide opacity-75 transition duration-300 group-hover:-translate-x-1 group-hover:text-primary group-hover:opacity-100 group-focus-visible:text-primary group-focus-visible:opacity-100 motion-reduce:transform-none">
                                    {handle}
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="relative mt-7 flex items-center justify-between gap-4 text-[0.65rem] uppercase opacity-70">
                    <span>© {new Date().getFullYear()} Stone House</span>
                    <span>Crunch &amp; Grill</span>
                </div>
            </div>
        </footer>
    );
}
