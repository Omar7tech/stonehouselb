<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How a product's sizes are offered. Purely a look: every style lists the same
 * sizes in the same order, carries the same prices, and behaves as one radio
 * group however it is drawn.
 */
enum VariantStyle: string implements HasIcon, HasLabel
{
    case Cards = 'cards';
    case Chips = 'chips';
    case Rows = 'rows';

    public function getLabel(): string
    {
        return match ($this) {
            self::Cards => 'Cards',
            self::Chips => 'Chips',
            self::Rows => 'Rows',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Cards => Heroicon::OutlinedSquares2x2,
            self::Chips => Heroicon::OutlinedTag,
            self::Rows => Heroicon::OutlinedQueueList,
        };
    }

    /**
     * One line on what the style looks like, shown under its name in the
     * settings form so the choice can be made without opening the storefront.
     */
    public function getDescription(): string
    {
        return match ($this) {
            self::Cards => 'Boxed options two to a row, each with a tick and its price under the name. The roomiest, and the surest to read.',
            self::Chips => 'Small pills on one line each, name and price together, the chosen one filled solid. Compact, and wraps to as many sizes as there are.',
            self::Rows => 'A full-width row per size, name on the left and price hard right, ruled between. Best when the names are long or there are many of them.',
        };
    }
}
