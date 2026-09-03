<?php

namespace App\Settings;

use App\Enums\BannerMode;
use App\Enums\CategoryLayout;
use App\Enums\PriceDisplay;
use App\Enums\ProductCardStyle;
use App\Enums\ShopStatusMode;
use App\Enums\VariantStyle;
use App\Enums\Weekday;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Spatie\LaravelSettings\Settings;
use Spatie\LaravelSettings\SettingsCasts\EnumCast;

class GeneralSettings extends Settings
{
    /**
     * How the open/closed state is decided: by hand (`Manual`) or from the
     * weekly {@see self::$opening_hours} schedule (`Automatic`).
     */
    public ShopStatusMode $status_mode;

    /**
     * The switch behind manual mode. Only authoritative while the status mode
     * is `Manual`; the schedule answers for `Automatic`.
     */
    public bool $is_open;

    /**
     * The weekly schedule, one row per weekday, keyed by JS-style day number
     * (0 = Sunday) so the storefront needs no remapping. Each row is shaped
     * `['day' => int, 'is_closed' => bool, 'opens_at' => string, 'closes_at' => string]`.
     *
     * That shape is what the dashboard writes, not what can be read back: this
     * is a JSON column, and it holds whatever was last put in it — a row from
     * an older shape, a half-saved form, or something that isn't a row at all.
     * So it is typed as the loose thing it is and squared up on the way out by
     * {@see self::storefrontOpeningHours()}, which is the only reader.
     *
     * Typed with `@phpstan-var` for the same reason {@see self::$social_links}
     * is: a nested array type in a `@var` tag makes the settings package build
     * a broken cast and throw on boot.
     *
     * @phpstan-var array<int, mixed>
     */
    public array $opening_hours;

    /**
     * Whether the promotional strip is shown across the top of the storefront.
     */
    public bool $show_banner;

    /**
     * How the strip picks its line: one fixed sentence, or one per weekday
     * from {@see self::$banner_schedule}.
     */
    public BannerMode $banner_mode;

    /**
     * The line shown while the mode is `Fixed`.
     */
    public ?string $banner_text;

    /**
     * The line per weekday, used while the mode is `Scheduled`. One row per
     * day, keyed by JS-style day number (0 = Sunday), shaped
     * `['day' => int, 'text' => string]`.
     *
     * Loosely typed and squared up on the way out for the same reason
     * {@see self::$opening_hours} is: this is a JSON column holding whatever
     * was last written to it, and a nested `@var` array type makes the
     * settings package build a broken cast and throw on boot.
     *
     * @phpstan-var array<int, mixed>
     */
    public array $banner_schedule;

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
     * How the menu's landing view draws its categories. A look only — the same
     * categories in the same order, whichever is picked.
     */
    public CategoryLayout $category_layout;

    /**
     * How a product's sizes are offered on the card and in the sheet. A look
     * only — the same sizes at the same prices, whichever is picked.
     */
    public VariantStyle $variant_style;

    /**
     * How one product is drawn in an open category. A look only — the same
     * products at the same prices, whichever is picked.
     */
    public ProductCardStyle $product_card_style;

    /**
     * Whether category names are shouted in the storefront's title slots — the
     * boxes on the landing view. Off leaves them exactly as they were typed.
     */
    public bool $uppercase_category_titles;

    /**
     * Whether product names are shouted wherever a dish is named as a title:
     * the cards, the carousel and the heading of the product sheet.
     */
    public bool $uppercase_product_titles;

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

    /**
     * The links listed at the foot of the storefront, in the order they are
     * shown. Each row is named by the owner rather than picked from a fixed
     * list, so a platform the shop joins later needs no code change.
     *
     * Each row is a `label` and a `url`. Typed with `@phpstan-var` rather than
     * `@var` on purpose: the settings package reads `@var` to pick a cast for
     * the property, and any nested array type there makes it build a broken
     * cast and throw on boot. Its regex does not see this tag; PHPStan does.
     *
     * @phpstan-var array<int, array{label: string|null, url: string|null}>
     */
    public array $social_links;

    /**
     * Where the shop is, as a map link. Null leaves the footer's location
     * button out rather than sending anyone to an address nobody set.
     */
    public ?string $location_url;

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
            'banner_mode' => new EnumCast(BannerMode::class),
            'category_layout' => new EnumCast(CategoryLayout::class),
            'price_display' => new EnumCast(PriceDisplay::class),
            'product_card_style' => new EnumCast(ProductCardStyle::class),
            'status_mode' => new EnumCast(ShopStatusMode::class),
            'variant_style' => new EnumCast(VariantStyle::class),
        ];
    }

    /**
     * The schedule a shop starts with: every day, nine to five. A baseline to
     * edit rather than seven empty rows to fill in.
     *
     * @return array<int, array{day: int, is_closed: bool, opens_at: string, closes_at: string}>
     */
    public static function defaultOpeningHours(): array
    {
        return array_map(static fn (Weekday $day): array => [
            'day' => $day->value,
            'is_closed' => false,
            'opens_at' => '09:00',
            'closes_at' => '17:00',
        ], Weekday::cases());
    }

    /**
     * The banner schedule a shop starts with: the same welcome on every day, a
     * baseline to edit rather than seven empty rows to fill in.
     *
     * @return array<int, array{day: int, text: string}>
     */
    public static function defaultBannerSchedule(): array
    {
        return array_map(static fn (Weekday $day): array => [
            'day' => $day->value,
            'text' => 'Welcome to Stone House',
        ], Weekday::cases());
    }

    /**
     * The banner line for the given moment, before it is asked whether the
     * banner is on at all. Null on a scheduled day nobody wrote a line for.
     */
    public function bannerTextFor(?CarbonInterface $now = null): ?string
    {
        if ($this->banner_mode === BannerMode::Fixed) {
            return filled($this->banner_text) ? trim((string) $this->banner_text) : null;
        }

        $today = collect($this->bannerSchedule())
            ->firstWhere('day', ($now ?? Carbon::now())->dayOfWeek);

        return $today['text'] ?? null;
    }

    /**
     * The banner line worth rendering, or null when there is nothing to show —
     * the strip is off, or the line behind today is blank. A strip with no
     * words in it is a band of orange across the top of the menu.
     */
    public function usableBannerText(?CarbonInterface $now = null): ?string
    {
        if (! $this->show_banner) {
            return null;
        }

        return $this->bannerTextFor($now);
    }

    /**
     * The banner schedule as a reader can trust it: rows that are not arrays,
     * rows not naming a real weekday, and rows with nothing to say are dropped
     * rather than passed on as a day with a blank line behind it.
     *
     * @return list<array{day: int, text: string}>
     */
    protected function bannerSchedule(): array
    {
        $rows = [];

        foreach ($this->banner_schedule as $row) {
            if (! is_array($row)) {
                continue;
            }

            $day = $row['day'] ?? null;

            if (! is_int($day) && ! is_string($day)) {
                continue;
            }

            $day = (int) $day;
            $text = $row['text'] ?? null;

            if ($day < 0 || $day > 6 || ! is_string($text) || blank($text)) {
                continue;
            }

            $rows[] = ['day' => $day, 'text' => trim($text)];
        }

        return $rows;
    }

    /**
     * Whether the shop is open right now, answered by whichever mode is active.
     */
    public function isCurrentlyOpen(?CarbonInterface $now = null): bool
    {
        if ($this->status_mode === ShopStatusMode::Manual) {
            return $this->is_open;
        }

        return $this->isWithinSchedule($now ?? Carbon::now());
    }

    /**
     * Whether the given moment falls inside the weekly schedule. Yesterday's
     * row is checked as well, because a closing time at or before the opening
     * time runs past midnight (open 18:00, close 02:00) and keeps the shop open
     * into the small hours of the next day.
     */
    protected function isWithinSchedule(CarbonInterface $now): bool
    {
        return $this->isWithinDay($now, $now->copy()->startOfDay())
            || $this->isWithinDay($now, $now->copy()->subDay()->startOfDay());
    }

    /**
     * Whether the given moment falls inside `$day`'s hours, whose session may
     * end after midnight.
     */
    protected function isWithinDay(CarbonInterface $now, CarbonInterface $day): bool
    {
        // Read through the same door the storefront uses, so a row this call
        // would honour is exactly a row the customer was shown. Malformed rows
        // are already gone by here: a non-array row reads null for every key,
        // and `null == 0` would otherwise match one on Sundays.
        $hours = collect($this->storefrontOpeningHours())
            ->firstWhere('day', $day->dayOfWeek);

        if ($hours === null || $hours['isClosed']) {
            return false;
        }

        if (blank($hours['opensAt']) || blank($hours['closesAt'])) {
            return false;
        }

        $opensAt = $day->copy()->setTimeFromTimeString($hours['opensAt']);
        $closesAt = $day->copy()->setTimeFromTimeString($hours['closesAt']);

        if ($closesAt->lessThanOrEqualTo($opensAt)) {
            $closesAt->addDay();
        }

        return $now->betweenIncluded($opensAt, $closesAt);
    }

    /**
     * The weekly schedule as the storefront reads it — camelCase keys, ordered
     * by nothing in particular but always a plain list.
     *
     * Also where {@see self::$opening_hours} is made trustworthy: rows that are
     * not arrays, and rows not naming a real weekday, are dropped rather than
     * passed on as a day nobody can be open on. Missing times survive as empty
     * strings, which every reader already treats as no hours published.
     *
     * @return list<array{day: int, isClosed: bool, opensAt: string, closesAt: string}>
     */
    public function storefrontOpeningHours(): array
    {
        $rows = [];

        foreach ($this->opening_hours as $row) {
            if (! is_array($row)) {
                continue;
            }

            $day = $row['day'] ?? null;

            if (! is_int($day) && ! is_string($day)) {
                continue;
            }

            $day = (int) $day;

            if ($day < 0 || $day > 6) {
                continue;
            }

            $opensAt = $row['opens_at'] ?? null;
            $closesAt = $row['closes_at'] ?? null;

            $rows[] = [
                'day' => $day,
                'isClosed' => (bool) ($row['is_closed'] ?? false),
                'opensAt' => is_string($opensAt) ? $opensAt : '',
                'closesAt' => is_string($closesAt) ? $closesAt : '',
            ];
        }

        return $rows;
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

    /**
     * The footer links worth rendering. A half-filled row — a name with no
     * address, or the reverse — is dropped rather than shown as a dead link.
     *
     * @return array<int, array{label: string, url: string}>
     */
    public function usableSocialLinks(): array
    {
        return collect($this->social_links)
            ->filter(fn (array $link): bool => filled($link['label'] ?? null) && filled($link['url'] ?? null))
            ->map(fn (array $link): array => [
                'label' => (string) $link['label'],
                'url' => (string) $link['url'],
            ])
            ->values()
            ->all();
    }

    /**
     * The map link worth rendering, or null when none is set. A blank address
     * is dropped rather than shown as a button that goes nowhere.
     */
    public function usableLocationUrl(): ?string
    {
        return filled($this->location_url) ? trim((string) $this->location_url) : null;
    }
}
