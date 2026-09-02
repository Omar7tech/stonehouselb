<?php

use App\Enums\CategoryLayout;
use App\Enums\PriceDisplay;
use App\Enums\ProductCardStyle;
use App\Enums\ShopStatusMode;
use App\Enums\VariantStyle;
use App\Settings\GeneralSettings;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

/**
 * Every setting the storefront reads, in one place. Grouped the way the
 * dashboard groups them, so a tab there and a block here line up.
 */
return new class extends SettingsMigration
{
    public function up(): void
    {
        // Shop status. Manual and open, which is the shop saying nothing about
        // its hours until someone fills the schedule in.
        $this->migrator->add('general.status_mode', ShopStatusMode::Manual->value);
        $this->migrator->add('general.is_open', true);
        $this->migrator->add('general.opening_hours', GeneralSettings::defaultOpeningHours());

        // Pricing. USD only until a rate is entered: LBP with no rate to
        // convert at would price the whole menu at nothing.
        $this->migrator->add('general.show_lbp_prices', false);
        $this->migrator->add('general.lbp_exchange_rate', null);
        $this->migrator->add('general.price_display', PriceDisplay::Usd->value);

        // Appearance. Each of these is a look only — the same categories,
        // products and sizes, however they are drawn.
        $this->migrator->add('general.category_layout', CategoryLayout::Grid->value);
        $this->migrator->add('general.product_card_style', ProductCardStyle::Row->value);
        $this->migrator->add('general.variant_style', VariantStyle::Cards->value);

        // Delivery. Active, but with no number to send to, so checkout stays
        // shut until the owner gives orders somewhere to go.
        $this->migrator->add('general.online_ordering_active', true);
        $this->migrator->add('general.whatsapp_number', null);
        $this->migrator->add('general.charge_delivery', false);
        $this->migrator->add('general.delivery_fee', null);

        // Checkout. Nothing is asked of the customer by default; every question
        // is one more thing between a full basket and a sent order.
        $this->migrator->add('general.require_full_name', false);
        $this->migrator->add('general.require_phone_number', false);
        $this->migrator->add('general.get_client_location', false);

        // Footer. Seeded with the rows the storefront used to hard-code, and a
        // null map link, which simply leaves the location button out.
        $this->migrator->add('general.location_url', null);
        $this->migrator->add('general.social_links', [
            ['label' => 'Instagram', 'url' => 'https://instagram.com/stonehouselb'],
            ['label' => 'TikTok', 'url' => 'https://tiktok.com/@stonehouselb'],
            ['label' => 'Facebook', 'url' => 'https://facebook.com/stonehouselb'],
            ['label' => 'WhatsApp', 'url' => 'https://wa.me/96171000000'],
        ]);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.social_links');
        $this->migrator->deleteIfExists('general.location_url');

        $this->migrator->deleteIfExists('general.get_client_location');
        $this->migrator->deleteIfExists('general.require_phone_number');
        $this->migrator->deleteIfExists('general.require_full_name');

        $this->migrator->deleteIfExists('general.delivery_fee');
        $this->migrator->deleteIfExists('general.charge_delivery');
        $this->migrator->deleteIfExists('general.whatsapp_number');
        $this->migrator->deleteIfExists('general.online_ordering_active');

        $this->migrator->deleteIfExists('general.variant_style');
        $this->migrator->deleteIfExists('general.product_card_style');
        $this->migrator->deleteIfExists('general.category_layout');

        $this->migrator->deleteIfExists('general.price_display');
        $this->migrator->deleteIfExists('general.lbp_exchange_rate');
        $this->migrator->deleteIfExists('general.show_lbp_prices');

        $this->migrator->deleteIfExists('general.opening_hours');
        $this->migrator->deleteIfExists('general.is_open');
        $this->migrator->deleteIfExists('general.status_mode');
    }
};
