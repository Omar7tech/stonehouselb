<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Null until the owner pastes a map link, which leaves the footer's
        // location button out rather than pointing it somewhere invented.
        $this->migrator->add('general.location_url', null);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.location_url');
    }
};
