<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasDescription;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How the screen is hung. It settles how many columns a board is drawn in and
 * how tall a feature can stand, so it is asked once here rather than guessed
 * from the viewport — a tablet on its side and a television are the same shape
 * to the browser and nothing alike in the room.
 */
enum ScreenOrientation: string implements HasColor, HasDescription, HasIcon, HasLabel
{
    case Landscape = 'landscape';
    case Portrait = 'portrait';

    public function getLabel(): string
    {
        return match ($this) {
            self::Landscape => 'Landscape',
            self::Portrait => 'Portrait',
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::Landscape => 'A television or tablet on its side. Wider than it is tall.',
            self::Portrait => 'A screen stood upright, as by a till or a door.',
        };
    }

    public function getColor(): string
    {
        return match ($this) {
            self::Landscape => 'info',
            self::Portrait => 'warning',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Landscape => Heroicon::OutlinedDeviceTablet,
            self::Portrait => Heroicon::OutlinedDevicePhoneMobile,
        };
    }
}
