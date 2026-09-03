import { ScreenMarks } from '@/components/screen/screen-marks';
import {
    ProductLeadPrice,
    VariantPrices,
} from '@/components/screen/screen-price';
import { SmartImage } from '@/components/smart-image';
import type { ScreenPage } from '@/lib/screen-deck';
import type { Product } from '@/types';

/**
 * One dish, its photograph filling the screen behind it.
 *
 * This is the layout that sells a single thing: the burger at the size it is
 * never seen at anywhere else, its name across the bottom and its price beside
 * it. It wants good photography and a short menu — a screen set to this and fed
 * forty dishes is a screen showing each of them for twelve seconds every eight
 * minutes.
 *
 * The wash under the copy is a gradient rather than a panel, so the photograph
 * runs to the edges of the set. Everything readable sits inside the bottom
 * third, which is the part of a television that is never cropped by overscan.
 */
export function SpotlightPage({
    page,
    showPrices,
}: {
    page: Extract<ScreenPage, { kind: 'menu' }>;
    showPrices: boolean;
}) {
    const product = page.products[0];

    if (product === undefined) {
        return null;
    }

    return (
        <div className="relative h-full w-full overflow-hidden">
            {product.image === null ? (
                // No photograph: the dish becomes the picture, set large on the
                // house orange rather than left on a black rectangle.
                <div className="absolute inset-0 bg-primary/12" />
            ) : (
                <SmartImage
                    src={product.image}
                    alt={product.name}
                    loading="eager"
                    className="absolute inset-0 h-full w-full"
                    imgClassName="h-full w-full object-cover"
                    spinnerClassName="bg-black/40 text-white/30"
                />
            )}

            {/* Dark at the foot, clear at the top: the copy is legible over any
                photograph without the picture being dimmed as a whole. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/72 via-35% to-transparent" />

            <SpotlightCopy product={product} showPrices={showPrices} />
        </div>
    );
}

function SpotlightCopy({
    product,
    showPrices,
}: {
    product: Product;
    showPrices: boolean;
}) {
    const sizes = product.variants.length > 1;

    return (
        <div
            className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[2em] p-[3em]"
            style={{ fontSize: 'var(--u)' }}
        >
            <div className="flex min-w-0 flex-col gap-[0.4em]">
                <span className="flex items-center gap-[0.5em]">
                    <ScreenMarks product={product} scale={2} />
                </span>

                <h2
                    className="leading-[0.95] font-semibold text-balance uppercase"
                    style={{ fontSize: 'calc(var(--u) * 4.4)' }}
                >
                    {product.name}
                </h2>

                {(product.subtitle ?? product.description) && (
                    <p
                        className="max-w-[26em] text-white/60"
                        style={{ fontSize: 'calc(var(--u) * 1.25)' }}
                    >
                        {product.subtitle ?? product.description}
                    </p>
                )}
            </div>

            {showPrices &&
                (sizes ? (
                    // Several sizes, and a whole screen to list them on: the
                    // board answers the question rather than saying "from".
                    <div className="w-[16em] shrink-0 rounded-[0.8em] bg-black/45 p-[1.2em] backdrop-blur-sm">
                        <VariantPrices
                            variants={product.variants}
                            scale={1.1}
                        />
                    </div>
                ) : (
                    <ProductLeadPrice product={product} scale={2.2} />
                ))}
        </div>
    );
}
