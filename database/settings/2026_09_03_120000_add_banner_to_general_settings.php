<?php

use App\Enums\BannerMode;
use App\Settings\GeneralSettings;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

/**
 * The promotional strip across the top of the storefront: whether it shows, how
 * it picks its line, and the lines themselves.
 */
return new class extends SettingsMigration
{
    public function up(): void
    {
        // Off, so nothing appears above the menu until the shop writes
        // something worth putting there.
        $this->migrator->add('general.show_banner', false);
        $this->migrator->add('general.banner_mode', BannerMode::Fixed->value);
        $this->migrator->add('general.banner_text', 'Welcome to Stone House');
        $this->migrator->add('general.banner_schedule', GeneralSettings::defaultBannerSchedule());
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.banner_schedule');
        $this->migrator->deleteIfExists('general.banner_text');
        $this->migrator->deleteIfExists('general.banner_mode');
        $this->migrator->deleteIfExists('general.show_banner');
    }
};
