<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Settings\GeneralSettings;
use Illuminate\Database\Eloquent\Relations\Relation;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The menu as a sheet of paper.
 *
 * Same rows, same prices, same order as the storefront — laid out for A4. That
 * is the whole point: a printed menu maintained by hand drifts out of step with
 * the website within a week, and the first anyone hears of it is a customer
 * holding one price while the till says another.
 *
 * Every active dish is sent, whichever menu it belongs to, because the page is
 * a workbench rather than a view: the switches on it change what the sheet
 * holds, and they should answer instantly rather than by reloading the page
 * under whoever is setting it up.
 *
 * Dollars only, whatever the site happens to be quoting. A printed sheet lives
 * on a table for months and the pound moves in a morning; a price in dollars is
 * still true tomorrow, and the shop converts at the till.
 */
class PrintMenuController extends Controller
{
    public function __invoke(GeneralSettings $settings): Response
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->with(['products' => function (Relation $query): void {
                $query->where('is_active', true)->orderBy('sort_order');
            }])
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (Category $category): bool => $category->products->isNotEmpty())
            ->values();

        return Inertia::render('menu/print', [
            'shopName' => config('app.name'),
            'phone' => $settings->whatsapp_number,
            'categories' => $categories
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'name' => $category->title,
                    'products' => $category->products
                        ->map(fn (Product $product): array => $this->product($product))
                        ->all(),
                ])
                ->all(),
        ]);
    }

    /**
     * One dish, as the sheet needs it. Deliberately not the storefront's
     * resource: this one carries which menu the dish belongs to, so the page
     * can sort them without asking the server again, and leaves out the photos,
     * which no printed menu wants.
     *
     * @return array<string, mixed>
     */
    private function product(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->title,
            'description' => $product->description,
            'price' => (float) $product->price,
            'discountPrice' => $product->discount_price !== null
                ? (float) $product->discount_price
                : null,
            'orderType' => $product->order_type->value,
            'isSpicy' => $product->is_spicy,
            'isVegan' => $product->is_vegan,
            'isFeatured' => $product->is_featured,
            'variants' => $this->variants($product),
            'ingredients' => $this->ingredients($product),
        ];
    }

    /**
     * The sizes the dish is sold in, each with its own price. A row the
     * repeater left half-filled has no name to print against a price, so it is
     * dropped rather than set as a blank line with a figure beside it.
     *
     * @return list<array{name: string, price: float, discountPrice: float|null}>
     */
    private function variants(Product $product): array
    {
        $sizes = [];

        foreach ($product->variants ?? [] as $variant) {
            if (! is_array($variant)) {
                continue;
            }

            $name = trim((string) ($variant['name'] ?? ''));

            if ($name === '') {
                continue;
            }

            $sizes[] = [
                'name' => $name,
                'price' => (float) ($variant['price'] ?? 0),
                'discountPrice' => filled($variant['discount_price'] ?? null)
                    ? (float) $variant['discount_price']
                    : null,
            ];
        }

        return $sizes;
    }

    /**
     * What is in the dish, as plain names. Blank rows the repeater left behind
     * are dropped rather than printed as empty commas.
     *
     * @return list<string>
     */
    private function ingredients(Product $product): array
    {
        $names = [];

        foreach ($product->ingredients ?? [] as $ingredient) {
            if (! is_array($ingredient)) {
                continue;
            }

            $name = trim((string) ($ingredient['name'] ?? ''));

            if ($name !== '') {
                $names[] = $name;
            }
        }

        return $names;
    }
}
