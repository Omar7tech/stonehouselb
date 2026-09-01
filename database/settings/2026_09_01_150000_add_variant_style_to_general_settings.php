<?php

use App\Enums\VariantStyle;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Cards are what the picker already looked like, so an existing shop
        // sees no change until someone picks another style.
        $this->migrator->add('general.variant_style', VariantStyle::Cards->value);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.variant_style');
    }
};
