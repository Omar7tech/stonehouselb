import { ScreenMarks } from '@/components/screen/screen-marks';
import { ProductLeadPrice } from '@/components/screen/screen-price';
import type { ScreenPage } from '@/lib/screen-deck';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { ScreenOrientation } from '@/types/screen';

/**
 * The board above the counter: a category's dishes and prices, nothing else.
 *
 * The oldest form of menu screen there is, and still the one that sells: a
 * customer standing in a queue wants the list, the prices, and enough contrast
 * to read them from the back of the room. No photographs here — they belong to
 * the other layouts, and a grid of small ones is a wall of noise.
 *
 * Two columns on a wide screen, one on a tall one. Dotted leaders run from each
 * name to its price, which is what stops the eye sliding onto the wrong line at
 * distance.
 */
export function BoardPage({
    page,
    orientation,
    showPrices,
}: {
    page: Extract<ScreenPage, { kind: 'menu' }>;
    orientation: ScreenOrientation;
    showPrices: boolean;
}) {
    const columns = orientation === 'landscape' ? 2 : 1;
    const perColumn = Math.ceil(page.products.length / columns);

    const split =
        columns === 1
            ? [page.products]
            : [
                  page.products.slice(0, perColumn),
                  page.products.slice(perColumn),
              ].filter((column) => column.length > 0);

    return (
        <div
            className={cn(
                'grid h-full min-h-0 items-start gap-x-[4em] gap-y-[0.6em]',
                columns === 2 ? 'grid-cols-2' : 'grid-cols-1',
            )}
            style={{ fontSize: 'var(--u)' }}
        >
            {split.map((column, index) => (
                <ul key={index} className="flex min-w-0 flex-col">
                    {column.map((product) => (
                        <BoardLine
                            key={product.id}
                            product={product}
                            showPrices={showPrices}
                        />
                    ))}
                </ul>
            ))}
        </div>
    );
}

function BoardLine({
    product,
    showPrices,
}: {
    product: Product;
    showPrices: boolean;
}) {
    return (
        <li className="flex min-w-0 items-baseline gap-[0.6em] border-b border-white/8 py-[0.55em] last:border-b-0">
            <span className="flex min-w-0 flex-col">
                <span className="flex min-w-0 items-center gap-[0.4em]">
                    <span
                        className="truncate leading-none font-semibold uppercase"
                        style={{ fontSize: 'calc(var(--u) * 1.5)' }}
                    >
                        {product.name}
                    </span>

                    <ScreenMarks product={product} scale={1.2} />
                </span>

                {/* One line of copy at most: a board is read in a glance, and
                    the second line of a description never is. */}
                {product.subtitle && (
                    <span
                        className="mt-[0.25em] truncate text-white/45"
                        style={{ fontSize: 'calc(var(--u) * 0.95)' }}
                    >
                        {product.subtitle}
                    </span>
                )}
            </span>

            {/* The leaders, drawn as a border on a growing spacer rather than a
                row of dots in the markup — so they stretch to whatever gap is
                left between a short name and a long price. */}
            <span className="min-w-[1.5em] flex-1 translate-y-[-0.25em] border-b border-dotted border-white/20" />

            {showPrices && <ProductLeadPrice product={product} scale={1.05} />}
        </li>
    );
}
