<?php

use App\Enums\OrderType;
use App\Models\Category;
use App\Models\Product;
use App\Models\Slide;
use Inertia\Testing\AssertableInertia;

it('sends the active slides in the order the shop put them in', function (): void {
    Slide::factory()->create(['text' => 'Second', 'sort_order' => 2]);
    Slide::factory()->create(['text' => 'First', 'sort_order' => 1]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('slides', 2)
            ->where('slides.0.text', 'First')
            ->where('slides.1.text', 'Second')
        );
});

it('drops the slides the shop has taken down', function (): void {
    Slide::factory()->create(['text' => 'Showing']);
    Slide::factory()->inactive()->create(['text' => 'Hidden']);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('slides', 1)
            ->where('slides.0.text', 'Showing')
        );
});

it('carries the linked dish and its category add-ons', function (): void {
    $category = Category::factory()->create([
        'addons' => [['name' => 'Extra garlic', 'price' => '0.75']],
    ]);
    $product = Product::factory()->for($category)->create(['title' => 'Taouk']);

    Slide::factory()->create(['product_id' => $product->id]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('slides.0.product.name', 'Taouk')
            ->where('slides.0.addons.0.name', 'Extra garlic')
            // Cast out of the string the admin form stored, as everywhere else.
            ->where('slides.0.addons.0.price', 0.75)
        );
});

it('sends a slide with no dish as a plain picture', function (): void {
    Slide::factory()->create(['text' => 'Open until midnight']);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('slides.0.product', null)
            ->count('slides.0.addons', 0)
        );
});

it('unlinks a slide whose dish is not sold on the menu being shown', function (): void {
    $category = Category::factory()->create();
    $dineInOnly = Product::factory()
        ->for($category)
        ->orderType(OrderType::DineIn)
        ->create(['title' => 'Table only']);

    Slide::factory()->create(['product_id' => $dineInOnly->id]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('slides.0.product.name', 'Table only')
        );

    // Still on the carousel over on the delivery menu, but with nothing behind
    // it: a way into a dish that cannot be ordered is worse than a picture.
    $this->get(route('menu.delivery'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('slides', 1)
            ->where('slides.0.product', null)
        );
});

it('unlinks a slide whose dish has been hidden', function (): void {
    $product = Product::factory()->inactive()->create();

    Slide::factory()->create(['product_id' => $product->id]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('slides', 1)
            ->where('slides.0.product', null)
        );
});

it('renders a menu with no slides at all', function (): void {
    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->count('slides', 0)
        );
});
