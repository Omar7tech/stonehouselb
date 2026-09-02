<?php

namespace Database\Seeders;

use App\Enums\OrderType;
use App\Models\Category;
use App\Models\Product;
use App\Models\Slide;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * The categories the demo menu is built from, in the order they appear.
     *
     * @var list<string>
     */
    private const CATEGORY_TITLES = [
        'Appetizers',
        'Cold Mezze',
        'Hot Mezze',
        'Salads',
        'Soups',
        'Grills',
        'Pasta',
        'Burgers & Sandwiches',
        'Desserts',
        'Drinks',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::CATEGORY_TITLES as $sortOrder => $title) {
            $category = Category::firstOrCreate(
                ['title' => $title],
                ['is_active' => true, 'sort_order' => $sortOrder],
            );

            // Re-running the seeder tops nothing up; a category that already
            // has products keeps the ones it has instead of doubling them.
            if ($category->products()->exists()) {
                continue;
            }

            Product::factory()
                ->count(random_int(5, 20))
                ->for($category)
                ->orderType(OrderType::Both)
                ->randomlyWithVariants()
                ->randomlyWithIngredients()
                ->randomlyFlagged()
                ->sequence(fn (Sequence $sequence): array => ['sort_order' => $sequence->index])
                ->create();
        }

        $this->seedSlides();
    }

    /**
     * A few carousel slides pointing at dishes already on the menu, so the
     * strip above it has something in it on a fresh install. No artwork is
     * seeded — the storefront falls back to the dish's own photo, and the shop
     * uploads the real thing.
     */
    private function seedSlides(): void
    {
        if (Slide::query()->exists()) {
            return;
        }

        Product::query()
            ->inRandomOrder()
            ->take(3)
            ->get()
            ->each(function (Product $product, int $index): void {
                Slide::factory()->create([
                    'product_id' => $product->id,
                    'sort_order' => $index,
                ]);
            });
    }
}
