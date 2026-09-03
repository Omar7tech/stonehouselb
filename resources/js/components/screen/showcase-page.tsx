import { ScreenMarks } from '@/components/screen/screen-marks';
import { ProductLeadPrice } from '@/components/screen/screen-price';
import { SmartImage } from '@/components/smart-image';
import type { ScreenPage } from '@/lib/screen-deck';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import type { ScreenOrientation } from '@/types/screen';

/**
 * The wall: a bento of tiles, one dish to each, laid out big-and-small rather
 * than in a grid of equals.
 *
 * The storefront draws its categories this way, so a customer who has scrolled
 * the menu on their phone recognises the shop on the wall. It is the layout for
 * a photographed menu that is too long for the cinema and too handsome for the
 * ledger: five or six dishes at a time, each one large enough to be appetising,
 * with the first given twice the room so the eye has somewhere to land.
 *
 * The tiles set themselves down one after another. The page turns often enough
 * that the entrance is a large part of what the board actually looks like.
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
    const portrait = orientation === 'portrait';
    const [feature, ...rest] = page.products;

    if (feature === undefined) {
        return null;
    }

    return (
        <div
            className={cn(
                'grid h-full min-h-0 gap-[0.9em]',
                portrait
                    ? 'grid-cols-2 grid-rows-[1.35fr_1fr_1fr]'
                    : 'grid-cols-4 grid-rows-2',
            )}
            style={{ fontSize: 'var(--u)' }}
        >
            {/* The feature: two cells by two, so it is unmistakably the dish
                the shop wants sold on this page. */}
            <Tile
                product={feature}
                order={0}
                large
                showPrices={showPrices}
                className={portrait ? 'col-span-2' : 'col-span-2 row-span-2'}
            />

            {rest.map((product, index) => (
                <Tile
                    key={product.id}
                    product={product}
                    order={index + 1}
                    showPrices={showPrices}
                />
            ))}
        </div>
    );
}

function Tile({
    product,
    order,
    large = false,
    showPrices,
    className,
}: {
    product: Product;
    /** Its place on the page, which is what staggers the entrance. */
    order: number;
    large?: boolean;
    showPrices: boolean;
    className?: string;
}) {
    const art = large ? product.image : (product.thumbnail ?? product.image);

    return (
        <article
            className={cn(
                'relative min-h-0 animate-board-tile overflow-hidden rounded-[0.9em] bg-(--board-soft)',
                className,
            )}
            style={{ animationDelay: `${order * 90}ms` }}
        >
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

            {/* Copy over a photograph stays white on a dark wash in both
                sheets: a picture does not get lighter when the wall does. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 via-45% to-transparent" />

            <div
                className={cn(
                    'absolute inset-x-0 bottom-0 flex items-end justify-between gap-[0.6em] text-white',
                    large ? 'p-[1.3em]' : 'p-[0.8em]',
                )}
            >
                <span className="flex min-w-0 flex-col gap-[0.25em]">
                    <ScreenMarks
                        product={product}
                        scale={large ? 1.5 : 1}
                        className="text-white"
                    />

                    <span
                        className={cn(
                            'leading-[1.05] font-semibold text-balance uppercase',
                            large ? 'line-clamp-2' : 'line-clamp-2',
                        )}
                        style={{
                            fontSize: `calc(var(--u) * ${large ? 2.2 : 1.15})`,
                        }}
                    >
                        {product.name}
                    </span>

                    {/* Only the feature has the room for a line of copy; a
                        small tile with a description on it is a small tile
                        nobody can read the name of. */}
                    {large && (product.subtitle ?? product.description) && (
                        <span
                            className="line-clamp-2 max-w-[22em] text-white/65"
                            style={{ fontSize: 'calc(var(--u) * 1.05)' }}
                        >
                            {product.subtitle ?? product.description}
                        </span>
                    )}
                </span>

                {showPrices && (
                    <ProductLeadPrice
                        product={product}
                        scale={large ? 1.5 : 0.85}
                    />
                )}
            </div>
        </article>
    );
}
