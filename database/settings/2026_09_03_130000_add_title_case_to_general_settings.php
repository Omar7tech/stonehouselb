<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

/**
 * Whether the storefront shouts the names it is given. On, which is how every
 * title was drawn before this was a choice.
 */
return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.uppercase_category_titles', true);
        $this->migrator->add('general.uppercase_product_titles', true);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.uppercase_product_titles');
        $this->migrator->deleteIfExists('general.uppercase_category_titles');
    }
};
