<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasDescription;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How the storefront banner picks the line it shows.
 */
enum BannerMode: string implements HasDescription, HasIcon, HasLabel
{
    /**
     * One line, shown every day until it is changed.
     */
    case Fixed = 'fixed';

    /**
     * A line per weekday, picked from the schedule as the days turn over.
     */
    case Scheduled = 'scheduled';

    public function getLabel(): string
    {
        return match ($this) {
            self::Fixed => 'Fixed',
            self::Scheduled => 'Scheduled by day',
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::Fixed => 'The same line every day, until you change it.',
            self::Scheduled => 'A line per weekday, changing on its own as the day does.',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Fixed => Heroicon::OutlinedMegaphone,
            self::Scheduled => Heroicon::OutlinedCalendarDays,
        };
    }
}
