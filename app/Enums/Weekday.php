<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

/**
 * Days of the week, numbered to match JavaScript's `Date.getDay()` (0 = Sunday)
 * so the storefront can resolve "today" without remapping the schedule.
 */
enum Weekday: int implements HasLabel
{
    case Sunday = 0;
    case Monday = 1;
    case Tuesday = 2;
    case Wednesday = 3;
    case Thursday = 4;
    case Friday = 5;
    case Saturday = 6;

    public function getLabel(): string
    {
        return match ($this) {
            self::Sunday => 'Sunday',
            self::Monday => 'Monday',
            self::Tuesday => 'Tuesday',
            self::Wednesday => 'Wednesday',
            self::Thursday => 'Thursday',
            self::Friday => 'Friday',
            self::Saturday => 'Saturday',
        };
    }
}
