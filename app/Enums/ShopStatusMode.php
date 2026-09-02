<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasDescription;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How the shop's open/closed state is decided.
 */
enum ShopStatusMode: string implements HasDescription, HasIcon, HasLabel
{
    /**
     * One switch, flipped by hand. The schedule is ignored.
     */
    case Manual = 'manual';

    /**
     * Derived from the weekly opening hours, so the shop opens and closes on
     * its own.
     */
    case Automatic = 'automatic';

    public function getLabel(): string
    {
        return match ($this) {
            self::Manual => 'Manual',
            self::Automatic => 'Automatic',
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::Manual => 'You open and close the shop yourself with one switch.',
            self::Automatic => 'The shop opens and closes on its own, following the weekly hours below.',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Manual => Heroicon::OutlinedHandRaised,
            self::Automatic => Heroicon::OutlinedClock,
        };
    }
}
