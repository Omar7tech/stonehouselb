<?php

namespace App\Http\Controllers;

use App\Enums\OrderType;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Closure;
use Illuminate\Database\Eloquent\Relations\Relation;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function dineIn(): Response
    {
        return $this->renderMenu(OrderType::DineIn);
    }

    public function delivery(): Response
    {
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
            'orderTypeLabel' => $orderType->getLabel(),
            'categories' => CategoryResource::collection($categories)->resolve(),
        ]);
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
