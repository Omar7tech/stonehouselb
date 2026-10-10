<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

/**
 * How much of the board is left between one hand-picked photograph and the
 * next. Less of it makes the photographs larger; more of it lets each one
 * stand on its own.
 */
enum ScreenTileSpacing: string implements HasLabel
{
    case Tight = 'tight';
    case Regular = 'regular';
    case Airy = 'airy';

    public function getLabel(): string
    {
        return match ($this) {
            self::Tight => 'Tight',
            self::Regular => 'Regular',
            self::Airy => 'Airy',
        };
    }
}
