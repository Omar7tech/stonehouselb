<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

/**
 * How the corners of a hand-picked photograph are cut.
 */
enum ScreenTileCorners: string implements HasLabel
{
    /** No rounding at all: a contact sheet. */
    case Square = 'square';

    /** Barely rounded: a printed card. */
    case Soft = 'soft';

    /** Clearly rounded: an app tile. */
    case Round = 'round';

    public function getLabel(): string
    {
        return match ($this) {
            self::Square => 'Square',
            self::Soft => 'Soft',
            self::Round => 'Round',
        };
    }
}
