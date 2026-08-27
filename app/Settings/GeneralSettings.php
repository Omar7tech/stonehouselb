<?php

namespace App\Settings;

use App\Enums\PriceDisplay;
use Spatie\LaravelSettings\Settings;
use Spatie\LaravelSettings\SettingsCasts\EnumCast;

class GeneralSettings extends Settings
{
    /**
     * Whether prices may be displayed in Lebanese Pounds. When off, the
     * storefront falls back to USD regardless of {@see self::$price_display}.
     */
    public bool $show_lbp_prices;

    /**
     * How many LBP one USD is worth, used to convert every menu price.
     */
    public ?float $lbp_exchange_rate;

    /**
     * Which currency the storefront menu prices are rendered in.
     */
    public PriceDisplay $price_display;

    public static function group(): string
    {
        return 'general';
    }

    /**
     * @return array<string, EnumCast>
     */
    public static function casts(): array
    {
        return [
            'price_display' => new EnumCast(PriceDisplay::class),
        ];
    }

    /**
     * The LBP rate to actually convert with, or null when LBP pricing is off
     * or no positive rate is configured.
     */
    public function usableLbpRate(): ?float
    {
        $rate = (float) $this->lbp_exchange_rate;

        return $this->show_lbp_prices && $rate > 0 ? $rate : null;
    }

    /**
     * The price display to actually render with, falling back to USD whenever
     * the chosen mode needs an LBP rate that isn't available.
     */
    public function resolvedPriceDisplay(): PriceDisplay
    {
        if ($this->price_display->needsLbpRate() && $this->usableLbpRate() === null) {
            return PriceDisplay::Usd;
        }

        return $this->price_display;
    }
}
