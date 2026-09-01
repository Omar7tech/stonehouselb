import { ArrowUpRight } from 'lucide-react';

import { CategoryArt } from '@/components/menu/category-art';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * Where the watermark copies sit, as a share of the band, with the angle each
 * one is turned to.
 *
 * Fixed rather than random: a band that reshuffled its own pattern on every
 * render would flicker on any state change, and a category would look different
 * each time you came back to it. The numbers are irregular by hand — an even
 * spread reads as wallpaper, where an uneven one reads as scattered.
 *
 * Several sit past the top or bottom edge on purpose. The slab clips them, so
 * the pattern carries on past the band rather than stopping politely inside it.
 */
const WATERMARK = [
    { top: '-18%', left: '1%', size: '3.2rem', angle: -24 },
    { top: '40%', left: '13%', size: '2.4rem', angle: 12 },
    { top: '-8%', left: '27%', size: '2.9rem', angle: 34 },
    { top: '54%', left: '38%', size: '2.6rem', angle: -11 },
    { top: '2%', left: '52%', size: '3.1rem', angle: 21 },
    { top: '48%', left: '63%', size: '2.5rem', angle: -32 },
    { top: '-14%', left: '76%', size: '2.8rem', angle: 7 },
    { top: '46%', left: '88%', size: '3rem', angle: -19 },
] as const;

/**
 * One category as a full-width band: the name large on the left, the art on the
 * right, both sitting whole inside the slab.
 *
 * The opposite trade from the grid. A band gives a name the whole width of the
 * page, so "Burgers & Sandwiches" is read at a glance rather than wrapped to
 * two lines at a third the size — and there is room left over to say how many
 * items are inside, which a square box has nowhere to put.
 *
 * The cost is that fewer fit on a screen, so a long menu is a scroll rather
 * than a wall. That is the choice the setting exists to make.
 */
export function CategoryRow({
    category,
    onSelect,
}: {
    category: Category;
    onSelect: (id: number) => void;
}) {
    const count = category.products.length;
    // Held in a local so the null check narrows inside the map below, which a
    // property read on `category` would not survive. The small cut: these are
    // drawn at 48px, eight to a band.
    const art = category.thumbnail ?? category.image;

    return (
        <button
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
                'group relative flex h-28 w-full items-center overflow-hidden rounded-3xl bg-primary pr-4 pl-5 text-left text-primary-foreground sm:h-32 sm:pr-5 sm:pl-7',
                'shadow-[0_2px_8px_rgb(249_159_62/0.3)] hover:shadow-[0_12px_24px_rgb(249_159_62/0.42)]',
                // Slides toward the reader rather than lifting: a wide band that
                // rises reads as peeling off the page, where a short one reads
                // as picked up.
                'transition-[translate,scale,box-shadow] duration-300 ease-out hover:translate-x-1 active:translate-x-0 active:scale-[0.99] motion-reduce:translate-none motion-reduce:scale-100',
                'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none',
            )}
        >
            {/* The category's own art, scattered across the slab as a pattern.
                Only where there is art to scatter — a category still waiting on
                its picture gets the plain band rather than a wall of wordmarks.

                Knocked to a white silhouette rather than laid down as the photo
                it is: eight tinted pictures at low opacity over orange come out
                as muck, where the same shapes in the slab's own foreground
                colour read as one printed pattern. It is the shape that says
                which category this is anyway, not the colour.

                The knock-out is one filter on the group rather than eight on
                the copies. The result is identical — a filter reads the pixels
                already drawn, so the group and its parts come out the same — but
                the browser runs one pass instead of one per copy, and this band
                repaints its whole subtree on every frame of the shadow it
                animates on hover.

                First in the band, so the name and the art proper paint over it
                without either needing a stacking order to say so. */}
            {art !== null && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.13] brightness-0 invert"
                >
                    {WATERMARK.map((tile) => (
                        <img
                            key={`${tile.top}-${tile.left}`}
                            src={art}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            style={{
                                top: tile.top,
                                left: tile.left,
                                width: tile.size,
                                rotate: `${tile.angle}deg`,
                            }}
                            className="absolute aspect-square object-contain"
                        />
                    ))}
                </span>
            )}

            {/* `min-w-0` so the name clips inside its own column rather than
                shoving the art off the end of the band. */}
            <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-1 py-4">
                <span className="line-clamp-2 text-lg leading-tight font-semibold tracking-wide text-balance uppercase sm:text-2xl">
                    {category.name}
                </span>

                {/* The one thing a band can say that a box cannot. Held back to
                    a tint of the slab's own white so it reads as a note under
                    the name rather than a second heading. */}
                <span className="inline-flex items-center gap-1.5 text-[0.7rem] tracking-wide text-primary-foreground/70 uppercase">
                    {count === 1 ? '1 item' : `${count} items`}
                    <ArrowUpRight
                        aria-hidden
                        className="size-3.5 transition-[translate] duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:translate-none"
                        strokeWidth={2.5}
                    />
                </span>
            </span>

            {/* Sits whole inside the band with the padding clear on its right.
                It used to hang past that edge to be cropped by the slab, which
                on a phone left a category's picture sliced down the middle —
                and the art is the fastest way to recognise a category, so it is
                the last thing that should be half there. */}
            <span
                aria-hidden
                className="relative flex h-full w-24 shrink-0 items-center justify-center sm:w-36"
            >
                <CategoryArt
                    category={category}
                    className="max-h-[85%]"
                    logoClassName="w-full"
                    imageClassName="aspect-square w-full"
                />
            </span>
        </button>
    );
}
