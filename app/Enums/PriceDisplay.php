<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * Which currency the storefront menu prices are rendered in.
 */
enum PriceDisplay: string implements HasIcon, HasLabel
{
    case Usd = 'usd';
    case Lbp = 'lbp';
    case Both = 'both';

    public function getLabel(): string
    {
        return match ($this) {
            self::Usd => 'USD only',
            self::Lbp => 'LBP only',
            self::Both => 'Both (USD & LBP)',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Usd, self::Lbp => Heroicon::OutlinedBanknotes,
            self::Both => Heroicon::OutlinedArrowsRightLeft,
        };
    }

    /**
     * Whether this display mode needs a configured LBP exchange rate.
     */
    public function needsLbpRate(): bool
    {
        return $this !== self::Usd;
    }
}
