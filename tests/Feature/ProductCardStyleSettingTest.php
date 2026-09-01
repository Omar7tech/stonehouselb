<?php

use App\Enums\ProductCardStyle;
use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia;

it('shares the row style by default', function (): void {
    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('productCardStyle', ProductCardStyle::Row->value)
        );
});

it('shares whichever product card the shop has chosen', function (ProductCardStyle $style): void {
    settings(['product_card_style' => $style]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('productCardStyle', $style->value)
        );
    // Driven off the enum rather than a list written out here, so a style
    // added later is covered without anyone remembering to come back.
})->with(ProductCardStyle::cases());

it('leaves the products themselves untouched whichever style is chosen', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create(['title' => 'Kafta', 'sort_order' => 1, 'price' => 7.5]);
    Product::factory()->for($category)->create(['title' => 'Taouk', 'sort_order' => 2]);

    foreach (ProductCardStyle::cases() as $style) {
        settings(['product_card_style' => $style]);

        $this->get(route('menu.dine-in'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->count('categories.0.products', 2)
                ->where('categories.0.products.0.name', 'Kafta')
                ->where('categories.0.products.0.price', 7.5)
                ->where('categories.0.products.1.name', 'Taouk')
            );
    }
});

it('reads back as an enum rather than a string', function (): void {
    $settings = settings(['product_card_style' => ProductCardStyle::Card]);

    expect($settings->product_card_style)->toBe(ProductCardStyle::Card);
});
