import { ScreenMarks } from '@/components/screen/screen-marks';
import { ProductLeadPrice } from '@/components/screen/screen-price';
import { StretchText } from '@/components/stretch';
import type { ScreenPage } from '@/lib/screen-deck';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { ScreenOrientation } from '@/types/screen';

/**
 * The ledger: the counter board, set as a piece of typography.
 *
 * No photographs at all, on purpose — this is the layout for a shop whose menu
 * is long and whose queue is short, and a grid of small pictures at that size
 * is noise. What carries it instead is type: the category's own name blown up
 * behind the list as a watermark, every dish numbered down the left, and dotted
 * leaders running out to the prices so the eye cannot slip a line at distance.
 *
 * The rows land one after another rather than all at once. It costs nothing,
 * and it is the difference between a page that appears and a board that is
 * being written up.
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

    // Numbering runs on across the page's columns and across its pages, so a
    // category of thirty dishes is numbered one to thirty rather than one to
    // eight, four times over.
    const first = page.page * page.products.length;

    return (
        <div
            className="relative h-full min-h-0"
            style={{ fontSize: 'var(--u)' }}
        >
            {/* The category's name, blown up and pushed almost all the way into
                the wall. Clipped by the page rather than wrapped: it is a
                texture, not a heading — the real one is in the bar above. */}
            <StretchText
                aria-hidden
                className="pointer-events-none absolute -top-[0.15em] -left-[0.1em] font-display leading-[0.8] whitespace-nowrap text-(--board-ink) uppercase opacity-[0.045]"
                style={{ fontSize: 'calc(var(--u) * 9)' }}
            >
                {page.category.name}
            </StretchText>

            <div
                className={cn(
                    'relative grid h-full min-h-0 items-start gap-x-[3.5em]',
                    columns === 2 ? 'grid-cols-2' : 'grid-cols-1',
                )}
            >
                {split.map((column, columnIndex) => (
                    <ul key={columnIndex} className="flex min-w-0 flex-col">
                        {column.map((product, rowIndex) => (
                            <LedgerLine
                                key={product.id}
                                product={product}
                                number={
                                    first +
                                    columnIndex * perColumn +
                                    rowIndex +
                                    1
                                }
                                order={columnIndex * perColumn + rowIndex}
                                showPrices={showPrices}
                            />
                        ))}
                    </ul>
                ))}
            </div>
        </div>
    );
}

function LedgerLine({
    product,
    number,
    order,
    showPrices,
}: {
    product: Product;
    /** Its place on the menu, printed down the left the way a ledger is. */
    number: number;
    /** Its place on this page, which is what staggers the entrance. */
    order: number;
    showPrices: boolean;
}) {
    return (
        <li
            className="flex min-w-0 animate-board-row items-baseline gap-[0.7em] border-b border-(--board-line) py-[0.55em] last:border-b-0"
            style={{ animationDelay: `${order * 60}ms` }}
        >
            <span
                className="w-[1.8em] shrink-0 leading-none font-semibold text-(--board-faint) tabular-nums"
                style={{ fontSize: 'calc(var(--u) * 0.95)' }}
            >
                {number.toString().padStart(2, '0')}
            </span>

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
                        className="mt-[0.25em] truncate text-(--board-muted)"
                        style={{ fontSize: 'calc(var(--u) * 0.95)' }}
                    >
                        {product.subtitle}
                    </span>
                )}
            </span>

            {/* The leaders, drawn as a border on a growing spacer rather than a
                row of dots in the markup — so they stretch to whatever gap is
                left between a short name and a long price. */}
            <span className="min-w-[1.5em] flex-1 translate-y-[-0.25em] border-b border-dotted border-(--board-line)" />

            {showPrices && <ProductLeadPrice product={product} scale={1.05} />}
        </li>
    );
}
