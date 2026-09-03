<?php

namespace App\Http\Controllers;

use App\Enums\OrderType;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\SlideResource;
use App\Models\Category;
use App\Models\Slide;
use App\Settings\GeneralSettings;
use Closure;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function dineIn(): Response
    {
        return $this->renderMenu(OrderType::DineIn);
    }

    public function delivery(GeneralSettings $settings): Response|RedirectResponse
    {
        // The delivery menu only exists while online ordering is active;
        // otherwise the shop is dine-in only, so send customers back there.
        if (! $settings->online_ordering_active) {
            return redirect()->route('menu.dine-in');
        }

        return $this->renderMenu(OrderType::Delivery);
    }

    /**
     * Both menus are the same page. The order type is the seam the differences
     * hang off — the delivery menu carries the cart, dine-in only shows prices,
     * and each gets the products offered for it.
     *
     * Categories with nothing in them for this order type are dropped, so a
     * pill never opens onto an empty list.
     */
    private function renderMenu(OrderType $orderType): Response
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->with([
                'media',
                'products' => $this->productsConstraint($orderType),
            ])
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (Category $category): bool => $category->products->isNotEmpty())
            ->values();

        return Inertia::render('menu', [
            'orderType' => $orderType->value,
            'categories' => CategoryResource::collection($categories)->resolve(),
            'slides' => SlideResource::collection($this->slides($orderType))->resolve(),
        ]);
    }

    /**
     * The carousel above the menu, in the owner's order.
     *
     * A slide's dish is loaded under the same constraint the menu itself uses,
     * so one pointing at something not sold on this menu comes back with no
     * product and is drawn as a plain picture rather than as a way into a dish
     * the customer cannot order.
     *
     * @return Collection<int, Slide>
     */
    private function slides(OrderType $orderType): Collection
    {
        return Slide::query()
            ->where('is_active', true)
            ->with([
                'media',
                // The constraint brings the dish's own media with it; the
                // category is here for the extras the sheet offers.
                'product' => $this->productsConstraint($orderType),
                'product.category',
            ])
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Constrain a category's eager-loaded products to the active ones offered
     * for this order type, in display order.
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
}
