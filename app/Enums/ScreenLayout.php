<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasDescription;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How a screen draws the page it is holding. Every layout is fed the same deck
 * — a category's dishes, then the next category's, with any promotions dealt in
 * between — so this is a look, not a different menu.
 */
enum ScreenLayout: string implements HasDescription, HasIcon, HasLabel
{
    /** The classic board: a category's dishes and prices, in columns. */
    case Board = 'board';

    /** One dish at a time, its photograph filling the screen behind it. */
    case Spotlight = 'spotlight';

    /** The photograph down one half, the dishes listed on the other. */
    case Split = 'split';

    /** A large feature with the rest of the category queued beside it. */
    case Showcase = 'showcase';

    public function getLabel(): string
    {
        return match ($this) {
            self::Board => 'Board',
            self::Spotlight => 'Spotlight',
            self::Split => 'Split',
            self::Showcase => 'Showcase',
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::Board => 'The whole category at once, in columns with prices. The board above a counter.',
            self::Spotlight => 'One dish at a time, its photograph filling the screen. Best for a short, showy menu.',
            self::Split => 'The photograph down one half of the screen, the category listed on the other.',
            self::Showcase => 'One dish featured large, with the rest of its category queued up the side.',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Board => Heroicon::OutlinedTableCells,
            self::Spotlight => Heroicon::OutlinedSparkles,
            self::Split => Heroicon::OutlinedViewColumns,
            self::Showcase => Heroicon::OutlinedQueueList,
        };
    }
}
