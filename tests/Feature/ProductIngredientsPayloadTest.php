<?php

use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia;

it('sends the ingredients to the storefront as plain names in the kitchen\'s order', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create([
        'title' => 'Lamb kofta',
        'ingredients' => [
            ['name' => 'Lamb'],
            ['name' => 'Parsley'],
            ['name' => 'Sumac'],
        ],
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categories.0.products.0.ingredients', ['Lamb', 'Parsley', 'Sumac'])
        );
});

it('drops rows the kitchen left blank rather than offering them to remove', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create([
        'ingredients' => [
            ['name' => 'Halloumi'],
            ['name' => '   '],
            ['name' => ''],
            ['other' => 'Tahini'],
            ['name' => ' Mint '],
        ],
    ]);

    // Trimmed and re-indexed, so the storefront never receives a nameless chip
    // or a list with holes in it.
    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categories.0.products.0.ingredients', ['Halloumi', 'Mint'])
        );
});

it('lists a repeated ingredient once, in the kitchen\'s first spelling', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create([
        'ingredients' => [
            ['name' => 'Garlic'],
            ['name' => 'Tahini'],
            ['name' => 'garlic'],
            ['name' => ' GARLIC '],
        ],
    ]);

    // The picker is keyed by name — the customer takes out "Garlic", not the
    // third row of the repeater — so a duplicate would draw a second chip that
    // toggles as one with the first.
    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categories.0.products.0.ingredients', ['Garlic', 'Tahini'])
        );
});

it('drops a row that is not a row at all', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create([
        'ingredients' => [
            ['name' => 'Mint'],
            'Lemon',
            null,
        ],
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categories.0.products.0.ingredients', ['Mint'])
        );
});

it('sends an empty list for a product that lists nothing', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create(['ingredients' => null]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categories.0.products.0.ingredients', [])
        );
});
