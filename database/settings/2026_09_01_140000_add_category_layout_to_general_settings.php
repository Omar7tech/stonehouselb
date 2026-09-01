<?php

use App\Enums\CategoryLayout;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // The grid is what the menu already looked like, so an existing shop
        // sees no change until someone picks another layout.
        $this->migrator->add('general.category_layout', CategoryLayout::Grid->value);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.category_layout');
    }
};
