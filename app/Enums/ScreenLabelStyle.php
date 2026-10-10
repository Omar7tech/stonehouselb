<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasDescription;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * How a hand-picked screen labels each photograph with its name and price.
 *
 * Purely a look: all three print the same words in the same white with the
 * same black figures, and none of them changes how large the tiles are drawn.
 */
enum ScreenLabelStyle: string implements HasDescription, HasIcon, HasLabel
{
    /** A tab of the board's own white, cut up into the foot of the photograph. */
    case Notch = 'notch';

    /** A rounded badge floating just inside the photograph. */
    case Pill = 'pill';

    /** A strip across the whole foot of the photograph: name left, price right. */
    case Band = 'band';

    public function getLabel(): string
    {
        return match ($this) {
            self::Notch => 'Notch',
            self::Pill => 'Pill',
            self::Band => 'Band',
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::Notch => 'A white tab cut up into the bottom of the photo, like a price on a shelf-edge card.',
            self::Pill => 'A rounded white badge floating just inside the bottom of the photo.',
            self::Band => 'A white strip across the whole bottom of the photo, the name on the left and the price on the right.',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Notch => Heroicon::OutlinedBookmark,
            self::Pill => Heroicon::OutlinedTag,
            self::Band => Heroicon::OutlinedBars3BottomLeft,
        };
    }
}
