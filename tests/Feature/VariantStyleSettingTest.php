<?php

use App\Enums\VariantStyle;
use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia;

it('shares the cards style by default', function (): void {
    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('variantStyle', VariantStyle::Cards->value)
        );
});

it('shares whichever size picker the shop has chosen', function (VariantStyle $style): void {
    settings(['variant_style' => $style]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('variantStyle', $style->value)
        );
    // Driven off the enum rather than a list written out here, so a style
    // added later is covered without anyone remembering to come back.
})->with(VariantStyle::cases());

it('leaves the variants themselves untouched whichever style is chosen', function (): void {
    $category = Category::factory()->create();
    Product::factory()->for($category)->withVariants()->create(['title' => 'Sold in sizes']);

    foreach (VariantStyle::cases() as $style) {
        settings(['variant_style' => $style]);

        $this->get(route('menu.dine-in'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->count('categories.0.products.0.variants', 2)
                ->where('categories.0.products.0.variants.0.name', 'Small')
                // Whole numbers, not `4.0`: the resource casts to float, but a
                // float with nothing after the point is written to JSON as `4`
                // and read back as an int, and this assertion is strict.
                ->where('categories.0.products.0.variants.0.price', 4)
                ->where('categories.0.products.0.variants.1.name', 'Large')
                ->where('categories.0.products.0.variants.1.discountPrice', 5)
            );
    }
});

it('reads back as an enum rather than a string', function (): void {
    $settings = settings(['variant_style' => VariantStyle::Chips]);

    expect($settings->variant_style)->toBe(VariantStyle::Chips);
});
