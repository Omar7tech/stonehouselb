<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasDescription;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How a screen draws the page it is holding. Most layouts are fed the same deck
 * — a category's dishes, then the next category's, with any promotions dealt in
 * between — so for them this is a look, not a different menu. The last two show
 * a list the shop chose by hand instead.
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

    /**
     * The dishes the shop picked by hand, as still square tiles on white. It
     * shows its own list and nothing else, and it never moves.
     */
    case Picks = 'picks';

    /**
     * The dishes the shop picked by hand, as a poster on a whitewashed brick
     * wall: photographs joined to orange labels, six, four or two to a page.
     */
    case Brick = 'brick';

    /**
     * Whether the screen shows a list chosen by hand rather than being fed the
     * deck, which is what decides whether categories mean anything to it.
     */
    public function showsChosenDishes(): bool
    {
        return in_array($this, [self::Picks, self::Brick], true);
    }

    public function getLabel(): string
    {
        return match ($this) {
            self::Board => 'Board',
            self::Spotlight => 'Spotlight',
            self::Split => 'Split',
            self::Showcase => 'Wall',
            self::Strip => 'Strip',
            self::Picks => 'Hand-picked',
            self::Brick => 'Brick wall',
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
            self::Picks => 'Only the dishes you choose, as square photographs on a white screen with the price under each. Nothing moves and nothing turns over.',
            self::Brick => 'Only the dishes you choose, on a white or black brick wall with orange brush strokes, each photograph joined to an orange label. Six, four or two to a page, and the pages turn when there are more.',
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
            self::Picks => Heroicon::OutlinedCursorArrowRays,
            self::Brick => Heroicon::OutlinedRectangleGroup,
        };
    }
}
