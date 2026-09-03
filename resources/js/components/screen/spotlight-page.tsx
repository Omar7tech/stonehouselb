import { ScreenMarks } from '@/components/screen/screen-marks';
import { VariantPrices } from '@/components/screen/screen-price';
import { SmartImage } from '@/components/smart-image';
import { StretchText } from '@/components/stretch';
import { leadPrice } from '@/lib/screen-deck';
import type { ScreenPage } from '@/lib/screen-deck';
import { usePricing } from '@/lib/use-pricing';
import type { Product } from '@/types';

/**
 * The cinema: one dish, the whole screen, and the picture never quite still.
 *
 * A photograph held motionless for twelve seconds reads as a poster somebody
 * forgot to take down, so the picture drifts — a slow pan and push that nobody
 * catches happening and everybody notices the absence of. Over it, the dish's
 * name is set in the house display face at a size that would be absurd anywhere
 * but a wall, and the price hangs off the corner as a torn ticket stub.
 *
 * This is the layout for a short, photographed menu: six dishes shot properly
 * will sell all evening on it, and forty will each be seen for twelve seconds
 * once every eight minutes.
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
        <div className="relative h-full w-full overflow-hidden bg-black">
            {product.image === null ? (
                // No photograph: the dish becomes the picture, set on the house
                // orange rather than left on a black rectangle.
                <div className="absolute inset-0 bg-primary/20" />
            ) : (
                <SmartImage
                    src={product.image}
                    alt={product.name}
                    loading="eager"
                    className="absolute inset-0 h-full w-full"
                    imgClassName="h-full w-full object-cover animate-board-drift"
                    spinnerClassName="bg-black/40 text-white/30"
                />
            )}

            {/* Two washes rather than one: a vignette that pulls the corners
                down so the picture sits inside the frame instead of running
                off it, and a foot the copy can be read against. */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgb(0_0_0/0.75)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 via-30% to-transparent" />

            <Copy product={product} showPrices={showPrices} />

            {/* The category, run up the left edge. It answers "what am I
                looking at" for somebody who arrived mid-rotation, without
                taking a line off the bottom of the screen. */}
            <span
                className="absolute top-1/2 left-[1.6em] origin-left -translate-y-1/2 rotate-180 tracking-[0.45em] text-white/35 uppercase [writing-mode:vertical-rl]"
                style={{ fontSize: 'calc(var(--u) * 0.85)' }}
            >
                {page.category.name}
            </span>
        </div>
    );
}

function Copy({
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
            <div className="flex min-w-0 flex-col gap-[0.5em]">
                <ScreenMarks
                    product={product}
                    scale={2}
                    className="text-white"
                />

                {/* The display face, which is drawn for exactly this: a few
                    words, very large, read from the far side of a room. */}
                <StretchText
                    as="h2"
                    className="font-display leading-[0.9] text-balance text-white uppercase"
                    style={{ fontSize: 'calc(var(--u) * 3.4)' }}
                >
                    {product.name}
                </StretchText>

                {(product.subtitle ?? product.description) && (
                    <p
                        className="max-w-[30em] text-white/65"
                        style={{ fontSize: 'calc(var(--u) * 1.25)' }}
                    >
                        {product.subtitle ?? product.description}
                    </p>
                )}
            </div>

            {showPrices &&
                (sizes ? (
                    // Several sizes and a whole screen to list them on: the
                    // board answers the question instead of saying "from".
                    <div className="w-[16em] shrink-0 rounded-[0.8em] bg-black/50 p-[1.2em] text-white backdrop-blur-sm">
                        <VariantPrices
                            variants={product.variants}
                            scale={1.1}
                        />
                    </div>
                ) : (
                    <TicketPrice product={product} />
                ))}
        </div>
    );
}

/**
 * The price as a torn ticket stub, tilted off true.
 *
 * The notches are the same trick the storefront's ticket category boxes use —
 * two circles of the page's own colour biting into the sides — so a screen and
 * the website are recognisably the same shop's work. Tilted a degree and a
 * half, because a stub pinned to a board is never straight.
 */
function TicketPrice({ product }: { product: Product }) {
    const pricing = usePricing();
    const lead = leadPrice(product);

    return (
        <span
            className="relative shrink-0 -rotate-[1.5deg] rounded-[0.5em] bg-primary px-[1.1em] py-[0.7em] text-primary-foreground shadow-[0_0.6em_1.6em_rgb(0_0_0/0.45)]"
            style={{ fontSize: 'var(--u)' }}
        >
            {/* The bite marks. Black rather than the board's colour: this stub
                only ever hangs over a photograph. */}
            <span
                aria-hidden
                className="absolute top-1/2 -left-[0.45em] size-[0.9em] -translate-y-1/2 rounded-full bg-black"
            />
            <span
                aria-hidden
                className="absolute top-1/2 -right-[0.45em] size-[0.9em] -translate-y-1/2 rounded-full bg-black"
            />

            <span className="flex flex-col items-center leading-none">
                {lead.was !== null && (
                    <span
                        className="text-primary-foreground/60 line-through"
                        style={{ fontSize: 'calc(var(--u) * 1.1)' }}
                    >
                        {pricing.primary(lead.was)}
                    </span>
                )}

                <span
                    className="font-semibold tabular-nums"
                    style={{ fontSize: 'calc(var(--u) * 3)' }}
                >
                    {pricing.primary(lead.price)}
                </span>

                {pricing.showUsd && pricing.showLbp && (
                    <span
                        className="mt-[0.3em] tracking-wide text-primary-foreground/75 tabular-nums"
                        style={{ fontSize: 'calc(var(--u) * 1)' }}
                    >
                        {pricing.lbp(lead.price)}
                    </span>
                )}
            </span>
        </span>
    );
}
