import { ScreenMarks } from '@/components/screen/screen-marks';
import { ProductLeadPrice } from '@/components/screen/screen-price';
import { SmartImage } from '@/components/smart-image';
import { StretchText } from '@/components/stretch';
import type { ScreenPage } from '@/lib/screen-deck';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { ScreenOrientation } from '@/types/screen';

/**
 * The poster: a photograph cut across the screen on a slant, the dishes listed
 * on what is left.
 *
 * The seam is the whole idea. A screen halved down the middle is a web page
 * with a picture beside it; a screen cut on a diagonal is a printed poster, and
 * the eye follows the cut down into the list rather than picking one side to
 * read. The category is set along the seam, running up the page, so the
 * heading is part of the cut instead of a line above it.
 *
 * A tall screen takes the same idea horizontally — the cut runs across rather
 * than down, because a portrait set split on a steep diagonal gives you two
 * triangles too narrow to hold anything.
 */
export function SplitPage({
    page,
    orientation,
    showPrices,
}: {
    page: Extract<ScreenPage, { kind: 'menu' }>;
    orientation: ScreenOrientation;
    showPrices: boolean;
}) {
    const portrait = orientation === 'portrait';
    const hero = page.products.find((product) => product.image !== null);

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* The picture, clipped to the slant. It keeps the whole screen and
                is cut back rather than being sized to a column, so the
                photograph is never squeezed into a shape it was not shot in. */}
            <div
                className="absolute inset-0"
                style={{
                    clipPath: portrait
                        ? 'polygon(0 0, 100% 0, 100% 46%, 0 54%)'
                        : 'polygon(0 0, 54% 0, 46% 100%, 0 100%)',
                }}
            >
                {hero?.image ? (
                    <SmartImage
                        src={hero.image}
                        alt={hero.name}
                        loading="eager"
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover"
                        spinnerClassName="bg-black/40 text-white/30"
                    />
                ) : (
                    <div className="h-full w-full bg-primary/20" />
                )}

                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_20%,rgb(0_0_0/0.6)_100%)]" />

                {/* The picture names itself, low on its own side. Without this
                    the photograph is of something the customer cannot pick out
                    of the list beside it. */}
                {hero && (
                    <span
                        className="absolute bottom-[1.5em] left-[1.5em] max-w-[80%] leading-none font-semibold text-white uppercase drop-shadow-[0_0.1em_0.4em_rgb(0_0_0/0.8)]"
                        style={{ fontSize: 'calc(var(--u) * 1.7)' }}
                    >
                        {hero.name}
                    </span>
                )}
            </div>

            {/* The seam itself, drawn as a hairline of the house orange so the
                cut reads as deliberate rather than as a clipping artefact. */}
            <div
                aria-hidden
                className="absolute inset-0 bg-primary"
                style={{
                    clipPath: portrait
                        ? 'polygon(0 53.6%, 100% 45.6%, 100% 46.4%, 0 54.4%)'
                        : 'polygon(53.6% 0, 54.4% 0, 46.4% 100%, 45.6% 100%)',
                }}
            />

            {/* The category, run along the cut. */}
            <StretchText
                className={cn(
                    'absolute font-display whitespace-nowrap text-(--board-ink) uppercase opacity-25',
                    portrait
                        ? 'right-[1.2em] bottom-[calc(50%+1.2em)]'
                        : 'bottom-[2em] left-[calc(54%-1.5em)] origin-bottom-left -rotate-90',
                )}
                style={{ fontSize: 'calc(var(--u) * 1.6)' }}
            >
                {page.category.name}
            </StretchText>

            <ul
                className={cn(
                    'absolute flex flex-col justify-center gap-[0.2em]',
                    portrait
                        ? 'inset-x-[3em] top-[56%] bottom-[2.5em]'
                        : 'top-[3em] right-[3em] bottom-[3em] left-[56%]',
                )}
                style={{ fontSize: 'var(--u)' }}
            >
                {page.products.map((product, index) => (
                    <PosterLine
                        key={product.id}
                        product={product}
                        order={index}
                        featured={hero?.id === product.id}
                        showPrices={showPrices}
                    />
                ))}
            </ul>
        </div>
    );
}

function PosterLine({
    product,
    order,
    featured,
    showPrices,
}: {
    product: Product;
    order: number;
    /** The one in the photograph, marked so the two halves are tied together. */
    featured: boolean;
    showPrices: boolean;
}) {
    return (
        <li
            className={cn(
                'flex min-w-0 animate-board-row items-baseline gap-[0.6em] rounded-[0.4em] py-[0.55em]',
                featured && 'bg-primary/10 px-[0.6em]',
            )}
            style={{ animationDelay: `${order * 70}ms` }}
        >
            <span className="flex min-w-0 flex-col">
                <span className="flex min-w-0 items-center gap-[0.4em]">
                    <span
                        className="truncate leading-none font-semibold uppercase"
                        style={{ fontSize: 'calc(var(--u) * 1.6)' }}
                    >
                        {product.name}
                    </span>

                    <ScreenMarks product={product} scale={1.3} />
                </span>

                {product.subtitle && (
                    <span
                        className="mt-[0.3em] truncate text-(--board-muted)"
                        style={{ fontSize: 'var(--u)' }}
                    >
                        {product.subtitle}
                    </span>
                )}
            </span>

            <span className="min-w-[1em] flex-1 translate-y-[-0.25em] border-b border-dotted border-(--board-line)" />

            {showPrices && <ProductLeadPrice product={product} scale={1.15} />}
        </li>
    );
}
