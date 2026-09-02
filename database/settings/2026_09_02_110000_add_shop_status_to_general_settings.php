<?php

use App\Enums\ShopStatusMode;
use App\Settings\GeneralSettings;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Manual and open, so a shop that has never touched this reads exactly
        // as it did before the schedule existed.
        $this->migrator->add('general.status_mode', ShopStatusMode::Manual->value);
        $this->migrator->add('general.is_open', true);
        $this->migrator->add('general.opening_hours', GeneralSettings::defaultOpeningHours());
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.opening_hours');
        $this->migrator->deleteIfExists('general.is_open');
        $this->migrator->deleteIfExists('general.status_mode');
    }
};
