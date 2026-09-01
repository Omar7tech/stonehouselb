<?php

use App\Enums\CategoryLayout;
use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia;

it('shares the grid layout by default', function (): void {
    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categoryLayout', CategoryLayout::Grid->value)
        );
});

it('shares whichever layout the shop has chosen', function (CategoryLayout $layout): void {
    settings(['category_layout' => $layout]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categoryLayout', $layout->value)
        );
    // Driven off the enum rather than a list written out here, so a layout
    // added later is covered without anyone remembering to come back.
})->with(CategoryLayout::cases());

it('leaves the categories themselves untouched whichever layout is chosen', function (): void {
    $grills = Category::factory()->create(['title' => 'Grills', 'sort_order' => 1]);
    $drinks = Category::factory()->create(['title' => 'Drinks', 'sort_order' => 2]);

    Product::factory()->for($grills)->create();
    Product::factory()->for($drinks)->create();

    foreach (CategoryLayout::cases() as $layout) {
        settings(['category_layout' => $layout]);

        $this->get(route('menu.dine-in'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->count('categories', 2)
                ->where('categories.0.name', 'Grills')
                ->where('categories.1.name', 'Drinks')
            );
    }
});

it('reads back as an enum rather than a string', function (): void {
    $settings = settings(['category_layout' => CategoryLayout::Mosaic]);

    expect($settings->category_layout)->toBe(CategoryLayout::Mosaic);
});
