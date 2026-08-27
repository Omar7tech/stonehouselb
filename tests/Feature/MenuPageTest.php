<?php

use App\Enums\OrderType;
use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia;

it('sends the active categories with their products in display order', function (): void {
    $drinks = Category::factory()->create(['title' => 'Drinks', 'sort_order' => 2]);
    $grills = Category::factory()->create(['title' => 'Grills', 'sort_order' => 1]);

    Product::factory()->for($grills)->create(['title' => 'Taouk', 'sort_order' => 2, 'price' => 8.5]);
    Product::factory()->for($grills)->create(['title' => 'Kafta', 'sort_order' => 1, 'price' => 7]);
    Product::factory()->for($drinks)->create(['title' => 'Ayran']);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('menu')
            ->where('categories.0.name', 'Grills')
            ->where('categories.1.name', 'Drinks')
            ->where('categories.0.products.0.name', 'Kafta')
            ->where('categories.0.products.1.name', 'Taouk')
            ->where('categories.0.products.1.price', 8.5)
            // The box falls back to the house mark when this is null.
            ->where('categories.0.image', null)
            ->count('categories', 2)
        );
});

it('drops inactive categories and inactive products', function (): void {
    $hidden = Category::factory()->inactive()->create(['title' => 'Hidden']);
    Product::factory()->for($hidden)->create();

    $shown = Category::factory()->create(['title' => 'Shown']);
    Product::factory()->for($shown)->create(['title' => 'Visible']);
    Product::factory()->for($shown)->inactive()->create(['title' => 'Draft']);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('categories', 1)
            ->where('categories.0.name', 'Shown')
            ->count('categories.0.products', 1)
            ->where('categories.0.products.0.name', 'Visible')
        );
});

it('only shows a product on the menus its order type covers', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->orderType(OrderType::DineIn)->create(['title' => 'Dine in only']);
    Product::factory()->for($category)->orderType(OrderType::Delivery)->create(['title' => 'Delivery only']);
    Product::factory()->for($category)->orderType(OrderType::Both)->create(['title' => 'Always']);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('categories.0.products', 2)
            ->where('categories.0.products.0.name', 'Dine in only')
            ->where('categories.0.products.1.name', 'Always')
        );

    $this->get(route('menu.delivery'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('categories.0.products', 2)
            ->where('categories.0.products.0.name', 'Delivery only')
            ->where('categories.0.products.1.name', 'Always')
        );
});

it('drops a category with nothing on this menu', function (): void {
    $category = Category::factory()->create(['title' => 'Delivery corner']);
    Product::factory()->for($category)->orderType(OrderType::Delivery)->create();

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('categories', 0)
        );
});

it('renders a menu with no categories at all', function (): void {
    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('categories', 0)
        );
});
