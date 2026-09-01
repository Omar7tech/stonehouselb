import { usePage } from '@inertiajs/react';

import { CategoryCard } from '@/components/menu/category-card';
import { CategoryRow } from '@/components/menu/category-row';
import { CategoryTile } from '@/components/menu/category-tile';
import type { Category, CategoryLayout } from '@/types';

/**
 * How often the bento wall throws a full-width tile. Five gives a wide one and
 * then two clean rows of squares, so the pattern repeats on a whole number of
 * rows and never leaves a gap at the foot of the wall.
 */
const MOSAIC_WIDE_EVERY = 5;

/**
 * The menu's landing view: the categories, drawn however the shop has chosen.
 * Choosing one swaps the page over to that category's products, client-side.
 *
 * The layout is a setting rather than a breakpoint — a menu of six categories
 * and a menu of forty want different things, and only the owner knows which
 * they have. All three list the same categories in the same order; they differ
 * in how much of the screen each one is given and what it can therefore say.
 */
export function CategoryGrid({
    categories,
    onSelect,
}: {
    categories: readonly Category[];
    onSelect: (id: number) => void;
}) {
    const layout: CategoryLayout =
        usePage().props.categoryLayout ?? ('grid' as const);

    if (categories.length === 0) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                The menu is being written. Please check back soon.
            </p>
        );
    }

    if (layout === 'rows') {
        return (
            // Two bands abreast on a monitor. A band is a wide shape by
            // design, but one run across a desk screen has its name at one end
            // and its picture at the other with a stretch of orange in
            // between — pairing them keeps each band the proportion it was
            // drawn at.
            <div className="flex flex-col gap-3 sm:gap-4 lg:grid lg:grid-cols-2">
                {categories.map((category) => (
                    <CategoryRow
                        key={category.id}
                        category={category}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        );
    }

    if (layout === 'mosaic') {
        return (
            // Two columns up to `lg`: the wide tile is defined as spanning
            // both, so a third column would break the pattern rather than
            // widen it — the tiles themselves grow instead. Four is the next
            // width that works, since the wide tile still spans two of them
            // and simply becomes a half rather than a whole row.
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {categories.map((category, index) => (
                    <CategoryTile
                        key={category.id}
                        category={category}
                        index={index}
                        wide={index % MOSAIC_WIDE_EVERY === 0}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        );
    }

    return (
        // A little more air than the product list gets: each box now throws a
        // shadow of its own, and boxes packed tighter than that would light one
        // another rather than the panel.
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
            {categories.map((category) => (
                <CategoryCard
                    key={category.id}
                    category={category}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}
