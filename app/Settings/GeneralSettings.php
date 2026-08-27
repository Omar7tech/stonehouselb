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

    /**
     * Whether the delivery menu is available. When off the storefront is
     * dine-in only and `/menu/delivery` redirects back to the dine-in menu.
     */
    public bool $online_ordering_active;

    /**
     * The WhatsApp number finished orders are sent to. Without one there is
     * nowhere for an order to go, so checkout is closed.
     */
    public ?string $whatsapp_number;

    /**
     * Whether a delivery charge is added to the order total.
     */
    public bool $charge_delivery;

    /**
     * The delivery charge in USD, applied when {@see self::$charge_delivery} is on.
     */
    public ?float $delivery_fee;

    /**
     * Whether the customer must give a name before the order can be sent.
     */
    public bool $require_full_name;

    /**
     * Whether the customer must give a phone number before the order can be sent.
     */
    public bool $require_phone_number;

    /**
     * Whether the customer's coordinates are asked for and attached to the order.
     */
    public bool $get_client_location;

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

    /**
     * The delivery charge to add to an order, or null when none applies —
     * either the charge is off or no positive fee is configured.
     */
    public function deliveryFeeUsd(): ?float
    {
        $fee = (float) $this->delivery_fee;

        return $this->charge_delivery && $fee > 0 ? $fee : null;
    }

    /**
     * Whether a finished order has somewhere to go. Without a WhatsApp number
     * the storefront shows the menu but closes checkout.
     */
    public function canReceiveOrders(): bool
    {
        return $this->online_ordering_active && filled($this->whatsapp_number);
    }
}
