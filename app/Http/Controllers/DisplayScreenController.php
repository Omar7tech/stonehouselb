<?php

namespace App\Http\Controllers;

use App\Enums\OrderType;
use App\Enums\ScreenLayout;
use App\Enums\SimpleScreenStyle;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\SlideResource;
use App\Models\Category;
use App\Models\DisplayScreen;
use App\Models\Product;
use App\Models\Slide;
use App\Settings\GeneralSettings;
use App\Support\MenuPrice;
use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A screen in the shop, drawn for whatever is hung on the wall.
 *
 * Two answers come out of here. The first is the React board: the one the sets
 * bought this decade get, with photographs, movement and a code to scan. The
 * second is a plain HTML page, served when the address carries `?simple=`, for
 * the television that came with the shop and whose browser is older than the
 * menu on it. Neither is a cut-down version of the other — they are the same
 * menu, drawn for two very different machines.
 */
class DisplayScreenController extends Controller
{
    public function __invoke(Request $request, DisplayScreen $displayScreen, GeneralSettings $settings): Response|View
    {
        // A screen taken down in the dashboard stops answering, so a set left
        // switched on in a back room cannot go on quoting last season's prices.
        abort_unless($displayScreen->is_active, 404);

        $orderType = $displayScreen->order_type === OrderType::Delivery
            ? OrderType::Delivery
            : OrderType::DineIn;

        $simple = SimpleScreenStyle::tryFrom((string) $request->query('simple'));

        if ($simple !== null) {
            return $this->plainScreen($displayScreen, $this->categories($displayScreen, $orderType), $simple, $settings);
        }

        // A hand-picked screen shows its own list and nothing else, so the
        // menu and the slider are not fetched for it at all.
        $handPicked = $displayScreen->layout === ScreenLayout::Picks;

        $categories = $handPicked ? new Collection : $this->categories($displayScreen, $orderType);
        $slides = $handPicked ? new Collection : $this->slides($displayScreen, $orderType);

        return Inertia::render('screen', [
            'screen' => [
                'name' => $displayScreen->name,
                'orientation' => $displayScreen->orientation->value,
                'layout' => $displayScreen->layout->value,
                'holdSeconds' => $displayScreen->holdSeconds(),
                'showPrices' => $displayScreen->show_prices,
                'showNames' => $displayScreen->show_names,
                'showLogo' => $displayScreen->show_logo,
                'showQr' => $displayScreen->show_qr,
                // Where a customer's phone lands when they scan the code. The
                // menu this screen is quoting, so the two never disagree.
                'menuUrl' => $orderType === OrderType::Delivery
                    ? route('menu.delivery')
                    : route('menu.dine-in'),
                'refreshMinutes' => $displayScreen->refreshMinutes(),
            ],
            'categories' => CategoryResource::collection($categories)->resolve(),
            'slides' => SlideResource::collection($slides)->resolve(),
            'products' => ProductResource::collection(
                $handPicked ? $this->handPickedProducts($displayScreen) : new Collection,
            )->resolve(),
        ]);
    }

    /**
     * The dishes chosen for a hand-picked screen, in the order they were
     * chosen.
     *
     * Not narrowed to the menu the screen quotes: a dish named here was asked
     * for by name, which outranks a filter. One taken off the menu altogether
     * is still dropped, so a screen never sells what the kitchen has stopped
     * making.
     *
     * @return Collection<int, Product>
     */
    private function handPickedProducts(DisplayScreen $displayScreen): Collection
    {
        return $displayScreen->products()
            ->with('media')
            ->where('products.is_active', true)
            ->get();
    }

    /**
     * The categories this screen runs, each with the dishes it can quote.
     *
     * A screen with none chosen shows the whole menu — that is what a board
     * hung above a counter is for, and it means a screen created in a hurry is
     * already right. Categories left with nothing to show are dropped, so a
     * page never turns over onto an empty heading.
     *
     * @return Collection<int, Category>
     */
    private function categories(DisplayScreen $displayScreen, OrderType $orderType): Collection
    {
        /** @var list<int> $chosen */
        $chosen = $displayScreen->categories()->pluck('categories.id')->all();

        return Category::query()
            ->where('is_active', true)
            ->when($chosen !== [], fn (Builder $query): Builder => $query->whereIn('id', $chosen))
            ->with([
                'media',
                'products' => $this->productsConstraint($orderType),
            ])
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (Category $category): bool => $category->products->isNotEmpty())
            // The shop's own order for this screen when it named its
            // categories, and the menu's own order when it did not.
            ->sortBy(fn (Category $category): int => $chosen === []
                ? (int) $category->sort_order
                : (int) array_search($category->id, $chosen, true))
            ->values();
    }

    /**
     * The promotions dealt in between the categories, or none when the screen
     * is set to show the menu alone.
     *
     * @return Collection<int, Slide>
     */
    private function slides(DisplayScreen $displayScreen, OrderType $orderType): Collection
    {
        if (! $displayScreen->show_slides) {
            return new Collection;
        }

        return Slide::query()
            ->where('is_active', true)
            ->with([
                'media',
                'product' => $this->productsConstraint($orderType),
                'product.category',
            ])
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Constrain a category's dishes to the active ones this screen may quote.
     */
    private function productsConstraint(OrderType $orderType): Closure
    {
        return function (Relation $query) use ($orderType): void {
            $query
                ->with('media')
                ->where('is_active', true)
                ->whereIn('order_type', [$orderType->value, OrderType::Both->value])
                ->orderBy('sort_order');
        };
    }

    /**
     * The plain board, for a television that cannot run the other one.
     *
     * Everything is settled here: prices are formatted in PHP because the set
     * has no `Intl`, and each dish is reduced to the few strings the Blade
     * prints, because the page carries no code to work anything out with.
     *
     * @param  Collection<int, Category>  $categories
     */
    private function plainScreen(
        DisplayScreen $displayScreen,
        Collection $categories,
        SimpleScreenStyle $style,
        GeneralSettings $settings,
    ): View {
        $prices = new MenuPrice($settings);

        return view($style->view(), [
            'screen' => $displayScreen,
            'shopName' => config('app.name'),
            'holdSeconds' => $displayScreen->holdSeconds(),
            'refreshMinutes' => $displayScreen->refreshMinutes(),
            'categories' => $categories->map(fn (Category $category): array => [
                'name' => $category->title,
                'products' => $category->products
                    ->map(fn (Product $product): array => $this->plainProduct($product, $displayScreen, $prices))
                    ->all(),
            ])->all(),
        ]);
    }

    /**
     * One dish as a plain board prints it: a name, a line under it, and the
     * prices already written out.
     *
     * A dish sold in sizes prints one line per size. A dish sold one way prints
     * a single figure with no size against it, which is the difference between
     * a board that reads as a menu and one that reads as a spreadsheet.
     *
     * @return array{name: string, note: string|null, prices: list<array{label: string|null, amount: string, was: string|null}>}
     */
    private function plainProduct(Product $product, DisplayScreen $screen, MenuPrice $prices): array
    {
        $lines = [];

        if ($screen->show_prices) {
            $sizes = [];

            foreach ($product->variants ?? [] as $variant) {
                if (! is_array($variant)) {
                    continue;
                }

                $name = trim((string) ($variant['name'] ?? ''));

                if ($name === '') {
                    continue;
                }

                $discount = filled($variant['discount_price'] ?? null)
                    ? (float) $variant['discount_price']
                    : null;

                $sizes[] = [
                    'label' => $name,
                    'amount' => $prices->format($discount ?? (float) ($variant['price'] ?? 0)),
                    'was' => $discount === null ? null : $prices->format((float) ($variant['price'] ?? 0)),
                ];
            }

            if ($sizes !== []) {
                $lines = $sizes;
            } else {
                $discount = $product->discount_price !== null ? (float) $product->discount_price : null;

                $lines = [[
                    'label' => null,
                    'amount' => $prices->format($discount ?? (float) $product->price),
                    'was' => $discount === null ? null : $prices->format((float) $product->price),
                ]];
            }
        }

        return [
            'name' => $product->title,
            // The subtitle before the description: a plain board is read across
            // a room, and the short line is the one that survives the distance.
            'note' => $product->subtitle ?: $product->description,
            'prices' => $lines,
        ];
    }
}
