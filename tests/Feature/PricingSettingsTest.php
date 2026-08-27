<?php

use App\Enums\PriceDisplay;
use Inertia\Testing\AssertableInertia;

it('falls back to USD when LBP pricing has no usable rate', function (): void {
    $settings = settings([
        'show_lbp_prices' => false,
        'lbp_exchange_rate' => 90000,
        'price_display' => PriceDisplay::Both,
    ]);

    expect($settings->usableLbpRate())->toBeNull()
        ->and($settings->resolvedPriceDisplay())->toBe(PriceDisplay::Usd);

    $settings = settings(['show_lbp_prices' => true, 'lbp_exchange_rate' => 0]);

    expect($settings->usableLbpRate())->toBeNull()
        ->and($settings->resolvedPriceDisplay())->toBe(PriceDisplay::Usd);
});

it('keeps the chosen display once LBP pricing has a rate', function (): void {
    $settings = settings([
        'show_lbp_prices' => true,
        'lbp_exchange_rate' => 90000,
        'price_display' => PriceDisplay::Both,
    ]);

    expect($settings->usableLbpRate())->toBe(90000.0)
        ->and($settings->resolvedPriceDisplay())->toBe(PriceDisplay::Both);
});

it('shares the resolved pricing with the storefront', function (): void {
    settings([
        'show_lbp_prices' => true,
        'lbp_exchange_rate' => 90000,
        'price_display' => PriceDisplay::Both,
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('pricing.display', 'both')
            // JSON has no float/int distinction, so the rate arrives whole.
            ->where('pricing.lbpRate', 90000)
        );
});

it('shares a null rate with the storefront when LBP pricing is off', function (): void {
    settings([
        'show_lbp_prices' => false,
        'lbp_exchange_rate' => 90000,
        'price_display' => PriceDisplay::Both,
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('pricing.display', 'usd')
            ->where('pricing.lbpRate', null)
        );
});
