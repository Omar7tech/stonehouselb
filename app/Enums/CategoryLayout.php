<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How the menu's landing view draws its categories. Purely a look: every layout
 * lists the same categories in the same order and opens the same products.
 */
enum CategoryLayout: string implements HasIcon, HasLabel
{
    case Grid = 'grid';
    case Rows = 'rows';
    case Mosaic = 'mosaic';
    case Tickets = 'tickets';

    public function getLabel(): string
    {
        return match ($this) {
            self::Grid => 'Grid',
            self::Rows => 'Rows',
            self::Mosaic => 'Mosaic',
            self::Tickets => 'Tickets',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Grid => Heroicon::OutlinedSquares2x2,
            self::Rows => Heroicon::OutlinedBars3,
            self::Mosaic => Heroicon::OutlinedViewColumns,
            self::Tickets => Heroicon::OutlinedTicket,
        };
    }

    /**
     * One line on what the layout looks like, shown under its name in the
     * settings form so the choice can be made without opening the storefront.
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::Grid => 'Square boxes, two or three to a row. The art sits above the name.',
            self::Rows => 'Full-width bands, one category each. The art sits on the right, and every band says how many items are inside.',
            self::Mosaic => 'An uneven bento wall: every fifth category takes the full width, the rest are squares. Names sit bottom-left over a numbered slab.',
            self::Tickets => 'Kitchen tickets: the dish printed on the body, the name on a stub below a notched, dashed tear line. They lift and tilt when pointed at.',
        };
    }
}
