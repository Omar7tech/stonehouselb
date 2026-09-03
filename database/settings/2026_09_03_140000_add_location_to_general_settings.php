<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

/**
 * Where the shop actually is. Nothing here changes the storefront: it is what
 * the search engines are told, and what the local pack is built from.
 */
return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.phone_number', null);
        $this->migrator->add('general.street_address', null);
        $this->migrator->add('general.address_locality', null);
        $this->migrator->add('general.address_region', null);
        $this->migrator->add('general.latitude', null);
        $this->migrator->add('general.longitude', null);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.longitude');
        $this->migrator->deleteIfExists('general.latitude');
        $this->migrator->deleteIfExists('general.address_region');
        $this->migrator->deleteIfExists('general.address_locality');
        $this->migrator->deleteIfExists('general.street_address');
        $this->migrator->deleteIfExists('general.phone_number');
    }
};
