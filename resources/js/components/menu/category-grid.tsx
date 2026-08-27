import { CategoryCard } from '@/components/menu/category-card';
import type { Category } from '@/types';

/**
 * The menu's landing view: a grid of category boxes. Choosing one swaps the
 * page over to that category's products, client-side.
 */
export function CategoryGrid({
    categories,
    onSelect,
}: {
    categories: readonly Category[];
    onSelect: (id: number) => void;
}) {
    if (categories.length === 0) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                The menu is being written. Please check back soon.
            </p>
        );
    }

    return (
        // A little more air than the product list gets: each box now throws a
        // shadow of its own, and boxes packed tighter than that would light one
        // another rather than the panel.
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
