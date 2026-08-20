<?php

namespace App\Http\Controllers;

use App\Enums\OrderType;
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
     * hang off — the delivery menu carries the cart, dine-in only shows prices.
     */
    private function renderMenu(OrderType $orderType): Response
    {
        return Inertia::render('menu', [
            'orderType' => $orderType->value,
            'orderTypeLabel' => $orderType->getLabel(),
        ]);
    }
}
