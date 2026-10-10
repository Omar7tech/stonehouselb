<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

/**
 * How large a hand-picked label prints its name and price, against the
 * photograph it sits on.
 */
enum ScreenLabelSize: string implements HasLabel
{
    case Small = 'small';
    case Regular = 'regular';
    case Large = 'large';

    public function getLabel(): string
    {
        return match ($this) {
            self::Small => 'Small',
            self::Regular => 'Regular',
            self::Large => 'Large',
        };
    }
}
