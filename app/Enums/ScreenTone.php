<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * The sheet a hand-picked screen is drawn on. The labels take the same colour
 * as the sheet and print in the other one, so the board is one thing in two
 * inks whichever is chosen.
 */
enum ScreenTone: string implements HasIcon, HasLabel
{
    /** White board, black figures. */
    case Light = 'light';

    /** Black board, white figures. For a dim room, or a set that glares. */
    case Dark = 'dark';

    public function getLabel(): string
    {
        return match ($this) {
            self::Light => 'White',
            self::Dark => 'Black',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Light => Heroicon::OutlinedSun,
            self::Dark => Heroicon::OutlinedMoon,
        };
    }
}
