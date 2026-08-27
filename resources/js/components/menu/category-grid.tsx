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
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
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
