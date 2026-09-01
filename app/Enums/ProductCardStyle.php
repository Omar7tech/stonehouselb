<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How one product is drawn in an open category. Purely a look: both styles list
 * the same products in the same order, open the same sheet, and offer the same
 * quick add.
 */
enum ProductCardStyle: string implements HasIcon, HasLabel
{
    case Row = 'row';
    case Card = 'card';
    case Minimal = 'minimal';

    public function getLabel(): string
    {
        return match ($this) {
            self::Row => 'Rows',
            self::Card => 'Cards',
            self::Minimal => 'Minimal',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Row => Heroicon::OutlinedBars3,
            self::Card => Heroicon::OutlinedRectangleStack,
            self::Minimal => Heroicon::OutlinedSparkles,
        };
    }

    /**
     * One line on what the style looks like, shown under its name in the
     * settings form so the choice can be made without opening the storefront.
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::Row => 'Photo on the left, name and description beside it. Fits the most on a screen and reads fastest on a phone.',
            self::Card => 'One card to a row on a phone, with the photo across the top and the name and price beneath — the shape an online shop uses. Tiles into a grid on wider screens. The most appetising, so it wants a good picture on every dish.',
            self::Minimal => 'No card at all — a square photo with the name and price set plainly under it, two to a row on a phone. The quietest and the most of them on a screen. Products sold in sizes quote their cheapest and open the sheet to choose.',
        };
    }
}
