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

    /** A wall of tiles, one dish to each, big and small. */
    case Showcase = 'showcase';

    /** The category travelling sideways, never stopping. */
    case Strip = 'strip';

    public function getLabel(): string
    {
        return match ($this) {
            self::Board => 'Board',
            self::Spotlight => 'Spotlight',
            self::Split => 'Split',
            self::Showcase => 'Wall',
            self::Strip => 'Strip',
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::Board => 'Type only, no photographs: numbered dishes, dotted leaders out to the prices, the category ghosted behind. For a long menu and a queue that reads it.',
            self::Spotlight => 'One dish, the whole screen, the photograph slowly drifting, with the price on a torn ticket. For a short menu shot properly.',
            self::Split => 'A photograph cut across the screen on a slant, the dishes listed on what is left. Reads as a printed poster.',
            self::Showcase => 'A wall of tiles, one dish to each, the first given twice the room. The way the website draws its categories.',
            self::Strip => 'The category travelling sideways, never stopping. For a wide screen people walk past rather than queue at.',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Board => Heroicon::OutlinedTableCells,
            self::Spotlight => Heroicon::OutlinedSparkles,
            self::Split => Heroicon::OutlinedViewColumns,
            self::Showcase => Heroicon::OutlinedSquares2x2,
            self::Strip => Heroicon::OutlinedArrowsRightLeft,
        };
    }
}
