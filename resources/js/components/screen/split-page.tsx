import { ScreenMarks } from '@/components/screen/screen-marks';
import { ProductLeadPrice } from '@/components/screen/screen-price';
import { SmartImage } from '@/components/smart-image';
import type { ScreenPage } from '@/lib/screen-deck';
import { cn } from '@/lib/utils';
import type { ScreenOrientation } from '@/types/screen';

/**
 * The photograph down one half, the category listed on the other.
 *
 * The compromise layout, and the one most shops actually want: appetising
 * enough to stop somebody in the queue, but still a list of dishes and prices
 * rather than a single hero. The picture is the first dish on the page that has
 * one, so the half that sells and the half that informs are always about the
 * same food.
 *
 * A tall screen stacks them — picture on top, list below — because a portrait
 * set split down the middle gives you two columns too narrow to be either.
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
        <div
            className={cn(
                'grid h-full min-h-0 gap-[2em]',
                portrait ? 'grid-rows-[1fr_1.35fr]' : 'grid-cols-[1fr_1.15fr]',
            )}
            style={{ fontSize: 'var(--u)' }}
        >
            <div className="relative min-h-0 overflow-hidden rounded-[1em]">
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
                    <div className="h-full w-full bg-primary/12" />
                )}

                {/* The picture names itself, quietly. Without this the half is
                    a photograph of something the customer cannot identify on
                    the list beside it. */}
                {hero && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-[1.2em] pt-[3em]">
                        <span
                            className="leading-none font-semibold uppercase"
                            style={{ fontSize: 'calc(var(--u) * 1.6)' }}
                        >
                            {hero.name}
                        </span>
                    </span>
                )}
            </div>

            <ul className="flex min-w-0 flex-col justify-center">
                {page.products.map((product) => (
                    <li
                        key={product.id}
                        className="flex items-baseline gap-[0.6em] border-b border-white/8 py-[0.7em] last:border-b-0"
                    >
                        <span className="flex min-w-0 flex-col">
                            <span className="flex min-w-0 items-center gap-[0.4em]">
                                <span
                                    className="truncate leading-none font-semibold uppercase"
                                    style={{ fontSize: 'calc(var(--u) * 1.7)' }}
                                >
                                    {product.name}
                                </span>

                                <ScreenMarks product={product} scale={1.3} />
                            </span>

                            {product.subtitle && (
                                <span
                                    className="mt-[0.3em] truncate text-white/45"
                                    style={{ fontSize: 'var(--u)' }}
                                >
                                    {product.subtitle}
                                </span>
                            )}
                        </span>

                        <span className="min-w-[1.5em] flex-1 translate-y-[-0.25em] border-b border-dotted border-white/20" />

                        {showPrices && (
                            <ProductLeadPrice product={product} scale={1.2} />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
