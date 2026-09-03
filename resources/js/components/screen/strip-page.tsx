import { ScreenMarks } from '@/components/screen/screen-marks';
import { ProductLeadPrice } from '@/components/screen/screen-price';
import { SmartImage } from '@/components/smart-image';
import { StretchText } from '@/components/stretch';
import type { ScreenPage } from '@/lib/screen-deck';
import type { Product } from '@/types';

/**
 * The strip: the category travelling sideways across the screen, forever.
 *
 * Nothing else here moves like this. The other layouts turn pages; this one
 * never stops, which makes it the layout for a screen people walk past rather
 * than queue in front of — over a hatch, along a corridor, above a counter
 * where the queue moves. It is also the only one that suits a very wide set,
 * where a two-column list leaves an acre of nothing in the middle.
 *
 * The run of cards is printed twice and the track is pulled left by exactly one
 * copy's width before it starts again, so the loop has no seam. The speed comes
 * from the shop's own page-hold setting: a card crosses the screen in roughly
 * the time a page would have held for, so one number governs every layout.
 */
export function StripPage({
    page,
    holdSeconds,
    showPrices,
}: {
    page: Extract<ScreenPage, { kind: 'menu' }>;
    /** The shop's page hold, which sets how fast the strip travels. */
    holdSeconds: number;
    showPrices: boolean;
}) {
    const run = page.products;

    // Roughly a card per hold. Clamped, because a two-dish category would
    // otherwise fly past and a forty-dish one would sit still.
    const seconds = Math.min(Math.max(run.length * holdSeconds, 20), 240);

    return (
        <div className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden">
            {/* The category, standing still while its dishes travel behind it.
                Set in the display face at the size the wall can carry. */}
            <StretchText
                className="mb-[0.6em] px-[3em] font-display leading-none text-(--board-ink) uppercase"
                style={{ fontSize: 'calc(var(--u) * 2.6)' }}
            >
                {page.category.name}
            </StretchText>

            <div className="relative min-h-0 flex-1">
                <div
                    className="flex h-full w-max animate-board-strip items-stretch gap-[1em]"
                    style={{ ['--strip-seconds' as string]: `${seconds}s` }}
                >
                    {/* Twice, so the second copy is in place the moment the
                        first has finished passing. Hidden from readers the
                        second time round — it is the same menu. */}
                    {run.map((product) => (
                        <StripCard
                            key={`a${product.id}`}
                            product={product}
                            showPrices={showPrices}
                        />
                    ))}

                    <span aria-hidden className="contents">
                        {run.map((product) => (
                            <StripCard
                                key={`b${product.id}`}
                                product={product}
                                showPrices={showPrices}
                            />
                        ))}
                    </span>
                </div>

                {/* The ends softened into the board, so cards arrive and leave
                    rather than being cut off at the bezel. */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-[6em] bg-gradient-to-r from-(--board-bg) to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-[6em] bg-gradient-to-l from-(--board-bg) to-transparent" />
            </div>
        </div>
    );
}

function StripCard({
    product,
    showPrices,
}: {
    product: Product;
    showPrices: boolean;
}) {
    const art = product.image ?? product.thumbnail;

    return (
        <article className="relative h-full w-[22em] shrink-0 overflow-hidden rounded-[0.9em] bg-(--board-soft)">
            {art === null ? (
                <div className="absolute inset-0 bg-primary/15" />
            ) : (
                <SmartImage
                    src={art}
                    alt={product.name}
                    loading="eager"
                    className="absolute inset-0 h-full w-full"
                    imgClassName="h-full w-full object-cover"
                    spinnerClassName="bg-black/40 text-white/30"
                />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 via-45% to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[0.6em] p-[1em] text-white">
                <span className="flex min-w-0 flex-col gap-[0.25em]">
                    <ScreenMarks
                        product={product}
                        scale={1.1}
                        className="text-white"
                    />

                    <span
                        className="line-clamp-2 leading-[1.05] font-semibold uppercase"
                        style={{ fontSize: 'calc(var(--u) * 1.3)' }}
                    >
                        {product.name}
                    </span>
                </span>

                {showPrices && <ProductLeadPrice product={product} scale={1} />}
            </div>
        </article>
    );
}
