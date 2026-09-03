<?php

use App\Enums\BannerMode;
use App\Settings\GeneralSettings;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;

it('shares no banner while the strip is switched off', function (): void {
    settings([
        'show_banner' => false,
        'banner_mode' => BannerMode::Fixed,
        'banner_text' => 'Two for one on Fridays',
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('banner', null)
        );
});

it('shares the fixed line with the storefront', function (): void {
    settings([
        'show_banner' => true,
        'banner_mode' => BannerMode::Fixed,
        'banner_text' => '  Two for one on Fridays  ',
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('banner', 'Two for one on Fridays')
        );
});

it('shares no banner when the fixed line is blank', function (?string $text): void {
    settings([
        'show_banner' => true,
        'banner_mode' => BannerMode::Fixed,
        'banner_text' => $text,
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('banner', null)
        );
})->with([null, '', '   ']);

it('shares the line scheduled for today', function (): void {
    // A Wednesday, so the schedule is read at day 3.
    Carbon::setTestNow(Carbon::parse('2026-09-02 12:00:00'));

    $settings = settings([
        'show_banner' => true,
        'banner_mode' => BannerMode::Scheduled,
        'banner_text' => 'The fixed line nobody should see',
        'banner_schedule' => [
            ['day' => 2, 'text' => 'Tuesday: soup day'],
            ['day' => 3, 'text' => 'Wednesday: free delivery'],
        ],
    ]);

    expect($settings->usableBannerText())->toBe('Wednesday: free delivery');

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('banner', 'Wednesday: free delivery')
        );
});

it('shares no banner on a scheduled day with nothing written for it', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-09-02 12:00:00'));

    settings([
        'show_banner' => true,
        'banner_mode' => BannerMode::Scheduled,
        'banner_schedule' => [
            ['day' => 3, 'text' => '   '],
            ['day' => 4, 'text' => 'Thursday: free delivery'],
        ],
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('banner', null)
        );
});

it('ignores schedule rows that name no real weekday', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-09-02 12:00:00'));

    $settings = settings([
        'show_banner' => true,
        'banner_mode' => BannerMode::Scheduled,
        'banner_schedule' => [
            'not a row',
            ['day' => 9, 'text' => 'A day that does not exist'],
            ['day' => '3', 'text' => 'Wednesday, written as a string'],
        ],
    ]);

    expect($settings->usableBannerText())->toBe('Wednesday, written as a string');
});

it('starts every weekday of the default schedule on the same welcome', function (): void {
    $schedule = GeneralSettings::defaultBannerSchedule();

    expect($schedule)->toHaveCount(7)
        ->and(collect($schedule)->pluck('day')->all())->toBe([0, 1, 2, 3, 4, 5, 6])
        ->and(collect($schedule)->pluck('text')->unique()->all())->toBe(['Welcome to Stone House']);
});
