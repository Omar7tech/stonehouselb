<?php

namespace App\Filament\Tables\Columns;

use Closure;
use Filament\Tables\Columns\Column;

class PriceColumn extends Column
{
    /**
     * LBP amounts are rounded to the nearest multiple of this for clean prices.
     * Mirrors `LBP_ROUNDING_STEP` in resources/js/lib/currency.ts so the admin
     * and the storefront menu display identical converted prices.
     */
    public const int LBP_ROUNDING_STEP = 5000;

    protected string $view = 'filament.tables.columns.price-column';

    protected float|Closure|null $lbpRate = null;

    /**
     * Convert a USD amount to LBP, rounded to the nearest {@see self::LBP_ROUNDING_STEP}.
     */
    public static function convertUsdToLbp(float $usd, float $rate): int
    {
        return (int) (round(($usd * $rate) / self::LBP_ROUNDING_STEP) * self::LBP_ROUNDING_STEP);
    }

    /**
     * The LBP exchange rate (LBP per 1 USD) used to display converted prices.
     * Pass null to hide LBP prices entirely.
     */
    public function lbpRate(float|Closure|null $rate): static
    {
        $this->lbpRate = $rate;

        return $this;
    }

    public function getLbpRate(): ?float
    {
        return $this->evaluate($this->lbpRate);
    }
}
