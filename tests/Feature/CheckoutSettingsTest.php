<?php

use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia;

it('closes checkout when no WhatsApp number is configured', function (): void {
    settings(['online_ordering_active' => true, 'whatsapp_number' => null]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('whatsappNumber', null)
        );
});

it('closes checkout when online ordering is switched off', function (): void {
    settings([
        'online_ordering_active' => false,
        'whatsapp_number' => '96171123456',
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('whatsappNumber', null)
        );
});

it('shares the number once ordering is on and a number is set', function (): void {
    settings([
        'online_ordering_active' => true,
        'whatsapp_number' => '96171123456',
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('whatsappNumber', '96171123456')
        );
});

it('sends the delivery menu back to dine-in when ordering is off', function (): void {
    settings(['online_ordering_active' => false]);

    $this->get(route('menu.delivery'))
        ->assertRedirect(route('menu.dine-in'));
});

it('shares what the customer is asked for', function (): void {
    settings([
        'require_full_name' => true,
        'require_phone_number' => false,
        'get_client_location' => true,
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('checkout.requireFullName', true)
            ->where('checkout.requirePhoneNumber', false)
            ->where('checkout.getClientLocation', true)
        );
});

it('drops the delivery fee when the charge is off or not positive', function (): void {
    $settings = settings(['charge_delivery' => false, 'delivery_fee' => 3]);

    expect($settings->deliveryFeeUsd())->toBeNull();

    $settings = settings(['charge_delivery' => true, 'delivery_fee' => 0]);

    expect($settings->deliveryFeeUsd())->toBeNull();

    $settings = settings(['charge_delivery' => true, 'delivery_fee' => 3]);

    expect($settings->deliveryFeeUsd())->toBe(3.0);
});

it('shares the delivery fee with the storefront', function (): void {
    settings(['charge_delivery' => true, 'delivery_fee' => 2.5]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('pricing.deliveryFeeUsd', 2.5)
        );
});

it('sends a product with its sizes and its category extras', function (): void {
    $category = Category::factory()
        ->withAddons([['name' => 'Extra cheese', 'price' => '1.5']])
        ->create();

    Product::factory()->for($category)->withVariants()->create();

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('categories.0.addons.0.name', 'Extra cheese')
            // The JSON column holds whatever the admin form put in it, so a
            // price arrives as a string and must reach the page as a number.
            ->where('categories.0.addons.0.price', 1.5)
            ->where('categories.0.products.0.variants.0.name', 'Small')
            // JSON has no float/int distinction, so whole prices arrive whole.
            ->where('categories.0.products.0.variants.0.price', 4)
            ->where('categories.0.products.0.variants.0.discountPrice', null)
            ->where('categories.0.products.0.variants.1.discountPrice', 5)
        );
});
