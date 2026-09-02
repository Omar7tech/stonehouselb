<?php

use App\Enums\OrderType;
use App\Enums\PriceDisplay;
use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia;

it('sends the live menu to the sheet, in display order', function (): void {
    $drinks = Category::factory()->create(['title' => 'Drinks', 'sort_order' => 2]);
    $grills = Category::factory()->create(['title' => 'Grills', 'sort_order' => 1]);

    Product::factory()->for($grills)->create(['title' => 'Taouk', 'sort_order' => 2, 'price' => 8.5]);
    Product::factory()->for($grills)->create(['title' => 'Kafta', 'sort_order' => 1]);
    Product::factory()->for($drinks)->create(['title' => 'Ayran']);

    $this->get(route('menu.print'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('menu/print')
            ->where('categories.0.name', 'Grills')
            ->where('categories.1.name', 'Drinks')
            ->where('categories.0.products.0.name', 'Kafta')
            ->where('categories.0.products.1.name', 'Taouk')
            ->where('categories.0.products.1.price', 8.5)
        );
});

it('sends every menu at once, since the sheet sorts them itself', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->orderType(OrderType::DineIn)->create(['title' => 'Table only']);
    Product::factory()->for($category)->orderType(OrderType::Delivery)->create(['title' => 'Delivery only']);
    Product::factory()->for($category)->orderType(OrderType::Both)->create(['title' => 'Always']);

    // Which menu a dish belongs to travels with it, so the switches on the page
    // answer without another request.
    $this->get(route('menu.print'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('categories.0.products', 3)
            ->where('categories.0.products.0.orderType', 'dine_in')
            ->where('categories.0.products.1.orderType', 'delivery')
            ->where('categories.0.products.2.orderType', 'both')
        );
});

it('leaves out what the storefront leaves out', function (): void {
    $hidden = Category::factory()->inactive()->create(['title' => 'Hidden']);
    Product::factory()->for($hidden)->create(['title' => 'Secret']);

    $shown = Category::factory()->create(['title' => 'Shown']);
    Product::factory()->for($shown)->create(['title' => 'Visible']);
    Product::factory()->for($shown)->inactive()->create(['title' => 'Draft']);

    $this->get(route('menu.print'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('categories', 1)
            ->where('categories.0.name', 'Shown')
            ->count('categories.0.products', 1)
            ->where('categories.0.products.0.name', 'Visible')
        );
});

it('quotes dollars even where the storefront is quoting pounds', function (): void {
    // A sheet sits on a table for months and the rate moves in a morning, so
    // the paper menu does not follow the site's currency.
    settings(['price_display' => PriceDisplay::Lbp, 'show_lbp_prices' => true, 'lbp_exchange_rate' => 90000]);

    $category = Category::factory()->create();
    Product::factory()->for($category)->create(['price' => 8.5]);

    $this->get(route('menu.print'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categories.0.products.0.price', 8.5)
            ->missing('categories.0.products.0.lbpPrice')
        );
});

it('carries each size and its own price', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create([
        'variants' => [
            ['name' => 'Small', 'price' => '4.00'],
            ['name' => 'Large', 'price' => '7.00', 'discount_price' => '6.00'],
            // A row the repeater left blank has nothing to print.
            ['name' => '', 'price' => '9.00'],
        ],
    ]);

    $this->get(route('menu.print'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('categories.0.products.0.variants', 2)
            ->where('categories.0.products.0.variants.0.name', 'Small')
            // Whole numbers come back off the wire without their fraction, as
            // JSON has one kind of number and 4.00 is 4.
            ->where('categories.0.products.0.variants.0.price', 4)
            ->where('categories.0.products.0.variants.0.discountPrice', null)
            ->where('categories.0.products.0.variants.1.discountPrice', 6)
        );
});

it('carries the ingredients, for a sheet that lists them', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create([
        'ingredients' => [
            ['name' => 'Garlic'],
            ['name' => '  '],
            ['name' => 'Sumac'],
        ],
    ]);

    $this->get(route('menu.print'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categories.0.products.0.ingredients', ['Garlic', 'Sumac'])
        );
});

it('renders a sheet with nothing published on it', function (): void {
    $this->get(route('menu.print'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('menu/print')
            ->count('categories', 0)
        );
});
