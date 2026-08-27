<?php

use App\Enums\PriceDisplay;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.show_lbp_prices', false);
        $this->migrator->add('general.lbp_exchange_rate', null);
        $this->migrator->add('general.price_display', PriceDisplay::Usd->value);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.price_display');
        $this->migrator->deleteIfExists('general.lbp_exchange_rate');
        $this->migrator->deleteIfExists('general.show_lbp_prices');
    }
};
