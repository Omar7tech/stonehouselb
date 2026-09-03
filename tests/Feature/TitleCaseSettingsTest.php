<?php

use Inertia\Testing\AssertableInertia;

it('shouts category and product names by default', function (): void {
    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('uppercaseCategoryTitles', true)
            ->where('uppercaseProductTitles', true)
        );
});

it('shares each title case setting as the shop set it', function (bool $categories, bool $products): void {
    settings([
        'uppercase_category_titles' => $categories,
        'uppercase_product_titles' => $products,
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('uppercaseCategoryTitles', $categories)
            ->where('uppercaseProductTitles', $products)
        );
})->with([
    [true, false],
    [false, true],
    [false, false],
]);
