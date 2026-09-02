<?php

use App\Models\Product;

it('stores the ingredients as a list and reads them back as one', function (): void {
    $product = Product::factory()->withIngredients()->create();

    expect($product->refresh()->ingredients)->toBe([
        ['name' => 'Halloumi'],
        ['name' => 'Za\'atar'],
        ['name' => 'Olive oil'],
    ]);
});

it('keeps the order the kitchen listed them in', function (): void {
    $product = Product::factory()->create([
        'ingredients' => [
            ['name' => 'Lamb'],
            ['name' => 'Bulgur'],
            ['name' => 'Cinnamon'],
        ],
    ]);

    // A list, not a set: the order is the recipe's, and reordering the repeater
    // in the dashboard has to mean something.
    expect(array_column($product->refresh()->ingredients, 'name'))
        ->toBe(['Lamb', 'Bulgur', 'Cinnamon']);
});

it('leaves a product that lists nothing as null rather than an empty list', function (): void {
    $product = Product::factory()->create();

    expect($product->refresh()->ingredients)->toBeNull();
});

it('gives some seeded products ingredients and others none', function (): void {
    $products = Product::factory()
        ->count(60)
        ->randomlyWithIngredients()
        ->make();

    $listed = $products->filter(fn (Product $product): bool => $product->ingredients !== null);

    // Both kinds turn up. Sixty draws at a 65% chance makes an all-or-nothing
    // run about as likely as the same coin landing the same way 60 times.
    expect($listed)->not->toBeEmpty()
        ->and($listed->count())->toBeLessThan(60);

    foreach ($listed as $product) {
        expect(count($product->ingredients))
            ->toBeGreaterThanOrEqual(3)
            ->toBeLessThanOrEqual(7);
    }
});
