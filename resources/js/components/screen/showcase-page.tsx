import { ScreenMarks } from '@/components/screen/screen-marks';
import {
    ProductLeadPrice,
    VariantPrices,
} from '@/components/screen/screen-price';
import { SmartImage } from '@/components/smart-image';
import type { ScreenPage } from '@/lib/screen-deck';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { ScreenOrientation } from '@/types/screen';

/** How many dishes are queued beside the feature before the list is cut. */
const QUEUE_LENGTH = 5;

/**
 * One dish featured large, with the rest of its category queued alongside.
 *
 * The layout for a screen somebody is standing in front of rather than glancing
 * at: it sells one dish properly while still saying what else is on the list,
 * and the queue moves up a place every time the page turns, so the board reads
 * as a thing in motion rather than a slideshow of unrelated pictures.
 *
 * The dish standing next in the queue is marked, because a customer who has
 * just decided they want the third one down will wait for it.
 */
export function ShowcasePage({
    page,
    orientation,
    showPrices,
}: {
    page: Extract<ScreenPage, { kind: 'menu' }>;
    orientation: ScreenOrientation;
    showPrices: boolean;
}) {
    const product = page.products[0];

    if (product === undefined) {
        return null;
    }

    const portrait = orientation === 'portrait';

    // The category, rotated so the queue starts at the dish after this one.
    const position = page.siblings.findIndex((item) => item.id === product.id);
    const queue = [
        ...page.siblings.slice(position + 1),
        ...page.siblings.slice(0, Math.max(position, 0)),
    ].slice(0, QUEUE_LENGTH);

    return (
        <div
            className={cn(
                'grid h-full min-h-0 gap-[2em]',
                portrait ? 'grid-rows-[1.5fr_1fr]' : 'grid-cols-[1.6fr_1fr]',
            )}
            style={{ fontSize: 'var(--u)' }}
        >
            <Feature product={product} showPrices={showPrices} />

            {queue.length > 0 && (
                <div className="flex min-h-0 flex-col gap-[0.8em]">
                    <span
                        className="tracking-[0.3em] text-white/40 uppercase"
                        style={{ fontSize: 'calc(var(--u) * 0.85)' }}
                    >
                        Coming up
                    </span>

                    <ul className="flex min-h-0 flex-col gap-[0.7em]">
                        {queue.map((item, index) => (
                            <QueueLine
                                key={item.id}
                                product={item}
                                next={index === 0}
                                showPrices={showPrices}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Feature({
    product,
    showPrices,
}: {
    product: Product;
    showPrices: boolean;
}) {
    return (
        <div className="relative min-h-0 overflow-hidden rounded-[1em]">
            {product.image === null ? (
                <div className="h-full w-full bg-primary/12" />
            ) : (
                <SmartImage
                    src={product.image}
                    alt={product.name}
                    loading="eager"
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover"
                    spinnerClassName="bg-black/40 text-white/30"
                />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 via-40% to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-[1.5em] p-[1.6em]">
                <div className="flex min-w-0 flex-col gap-[0.35em]">
                    <ScreenMarks product={product} scale={1.6} />

                    <h2
                        className="leading-[0.95] font-semibold text-balance uppercase"
                        style={{ fontSize: 'calc(var(--u) * 3.2)' }}
                    >
                        {product.name}
                    </h2>

                    {(product.subtitle ?? product.description) && (
                        <p
                            className="max-w-[22em] text-white/60"
                            style={{ fontSize: 'calc(var(--u) * 1.1)' }}
                        >
                            {product.subtitle ?? product.description}
                        </p>
                    )}
                </div>

                {showPrices &&
                    (product.variants.length > 1 ? (
                        <div className="w-[13em] shrink-0 rounded-[0.7em] bg-black/45 p-[1em] backdrop-blur-sm">
                            <VariantPrices
                                variants={product.variants}
                                scale={0.95}
                            />
                        </div>
                    ) : (
                        <ProductLeadPrice product={product} scale={1.8} />
                    ))}
            </div>
        </div>
    );
}

function QueueLine({
    product,
    next,
    showPrices,
}: {
    product: Product;
    /** The dish the board turns to next, marked so a waiting eye knows. */
    next: boolean;
    showPrices: boolean;
}) {
    return (
        <li
            className={cn(
                'flex min-w-0 items-center gap-[0.8em] rounded-[0.6em] px-[0.7em] py-[0.55em]',
                next ? 'bg-primary/15' : 'bg-white/4',
            )}
        >
            {product.thumbnail && (
                <SmartImage
                    src={product.thumbnail}
                    alt=""
                    className="aspect-square w-[3.4em] shrink-0 rounded-[0.4em]"
                    imgClassName="h-full w-full object-cover"
                    spinnerClassName="bg-black/40 text-white/30"
                />
            )}

            <span className="flex min-w-0 flex-1 flex-col">
                <span
                    className="truncate leading-tight font-semibold uppercase"
                    style={{ fontSize: 'calc(var(--u) * 1.15)' }}
                >
                    {product.name}
                </span>

                {next && (
                    <span
                        className="tracking-[0.2em] text-primary uppercase"
                        style={{ fontSize: 'calc(var(--u) * 0.7)' }}
                    >
                        Up next
                    </span>
                )}
            </span>

            {showPrices && <ProductLeadPrice product={product} scale={0.8} />}
        </li>
    );
}
