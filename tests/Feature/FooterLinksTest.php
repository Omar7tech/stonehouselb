<?php

use Inertia\Testing\AssertableInertia;

it('drops footer links that are missing a name or an address', function (): void {
    $settings = settings([
        'social_links' => [
            ['label' => 'Instagram', 'url' => 'https://instagram.com/stonehouselb'],
            ['label' => '', 'url' => 'https://tiktok.com/@stonehouselb'],
            ['label' => 'Facebook', 'url' => null],
            ['label' => 'WhatsApp', 'url' => 'https://wa.me/96171000000'],
        ],
    ]);

    expect($settings->usableSocialLinks())->toBe([
        ['label' => 'Instagram', 'url' => 'https://instagram.com/stonehouselb'],
        ['label' => 'WhatsApp', 'url' => 'https://wa.me/96171000000'],
    ]);
});

it('shares the footer links with the storefront in the configured order', function (): void {
    settings([
        'social_links' => [
            ['label' => 'WhatsApp', 'url' => 'https://wa.me/96171000000'],
            ['label' => 'Instagram', 'url' => 'https://instagram.com/stonehouselb'],
        ],
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('socialLinks', [
                ['label' => 'WhatsApp', 'url' => 'https://wa.me/96171000000'],
                ['label' => 'Instagram', 'url' => 'https://instagram.com/stonehouselb'],
            ])
        );
});

it('shares an empty list when no footer links are configured', function (): void {
    settings(['social_links' => []]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('socialLinks', [])
        );
});
