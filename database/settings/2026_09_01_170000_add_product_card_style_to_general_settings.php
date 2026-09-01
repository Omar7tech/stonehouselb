<?php

use App\Enums\ProductCardStyle;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Rows are what the card already looked like, so an existing shop sees
        // no change until someone picks another style.
        $this->migrator->add('general.product_card_style', ProductCardStyle::Row->value);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.product_card_style');
    }
};
