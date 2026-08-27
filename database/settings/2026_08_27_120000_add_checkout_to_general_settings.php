<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.online_ordering_active', true);
        $this->migrator->add('general.whatsapp_number', null);

        $this->migrator->add('general.charge_delivery', false);
        $this->migrator->add('general.delivery_fee', null);

        $this->migrator->add('general.require_full_name', false);
        $this->migrator->add('general.require_phone_number', false);
        $this->migrator->add('general.get_client_location', false);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.get_client_location');
        $this->migrator->deleteIfExists('general.require_phone_number');
        $this->migrator->deleteIfExists('general.require_full_name');
        $this->migrator->deleteIfExists('general.delivery_fee');
        $this->migrator->deleteIfExists('general.charge_delivery');
        $this->migrator->deleteIfExists('general.whatsapp_number');
        $this->migrator->deleteIfExists('general.online_ordering_active');
    }
};
