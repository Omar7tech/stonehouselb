<?php

use App\Enums\ShopStatusMode;
use App\Enums\Weekday;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;

/**
 * A whole week on the same hours, so a test only has to name the moment it is
 * asking about.
 *
 * @param  array<int, int>  $closedDays  Weekdays taken off, JS-style (0 = Sunday).
 * @return array<int, array{day: int, is_closed: bool, opens_at: string, closes_at: string}>
 */
function weekOf(string $opensAt, string $closesAt, array $closedDays = []): array
{
    return array_map(static fn (Weekday $day): array => [
        'day' => $day->value,
        'is_closed' => in_array($day->value, $closedDays, true),
        'opens_at' => $opensAt,
        'closes_at' => $closesAt,
    ], Weekday::cases());
}

it('answers with the switch in manual mode, whatever the schedule says', function (bool $isOpen): void {
    $settings = settings([
        'status_mode' => ShopStatusMode::Manual,
        'is_open' => $isOpen,
        // Every day off, which would close an automatic shop outright.
        'opening_hours' => weekOf('09:00', '17:00', closedDays: [0, 1, 2, 3, 4, 5, 6]),
    ]);

    expect($settings->isCurrentlyOpen())->toBe($isOpen);
})->with([true, false]);

it('opens and closes on the schedule in automatic mode', function (string $at, bool $expected): void {
    $settings = settings([
        'status_mode' => ShopStatusMode::Automatic,
        'is_open' => false,
        'opening_hours' => weekOf('09:00', '17:00'),
    ]);

    expect($settings->isCurrentlyOpen(Carbon::parse($at)))->toBe($expected);
})->with([
    'before opening' => ['2026-09-02 08:59', false],
    'on opening' => ['2026-09-02 09:00', true],
    'mid-day' => ['2026-09-02 13:30', true],
    'on closing' => ['2026-09-02 17:00', true],
    'after closing' => ['2026-09-02 17:01', false],
]);

it('stays open past midnight when the closing time is earlier than the opening one', function (string $at, bool $expected): void {
    $settings = settings([
        'status_mode' => ShopStatusMode::Automatic,
        'is_open' => false,
        'opening_hours' => weekOf('18:00', '02:00'),
    ]);

    expect($settings->isCurrentlyOpen(Carbon::parse($at)))->toBe($expected);
})->with([
    'evening' => ['2026-09-02 19:00', true],
    'small hours' => ['2026-09-03 01:30', true],
    'after the small hours' => ['2026-09-03 02:30', false],
    'the afternoon before' => ['2026-09-02 15:00', false],
]);

it('is closed all day on a day off', function (): void {
    // 2026-09-02 is a Wednesday; 3 is Wednesday in JS day numbering.
    $settings = settings([
        'status_mode' => ShopStatusMode::Automatic,
        'is_open' => true,
        'opening_hours' => weekOf('09:00', '17:00', closedDays: [3]),
    ]);

    expect($settings->isCurrentlyOpen(Carbon::parse('2026-09-02 13:00')))->toBeFalse()
        ->and($settings->isCurrentlyOpen(Carbon::parse('2026-09-03 13:00')))->toBeTrue();
});

it('shares the status and the whole schedule with the storefront', function (): void {
    Carbon::setTestNow('2026-09-02 13:00');

    settings([
        'status_mode' => ShopStatusMode::Automatic,
        'is_open' => false,
        'opening_hours' => weekOf('09:00', '17:00', closedDays: [0]),
    ]);

    $this->get(route('menu.dine-in'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('shop.isOpen', true)
            ->where('shop.statusMode', 'automatic')
            ->where('shop.isManuallyOpen', false)
            ->has('shop.openingHours', 7)
            ->where('shop.openingHours.0', [
                'day' => 0,
                'isClosed' => true,
                'opensAt' => '09:00',
                'closesAt' => '17:00',
            ])
        );
});
