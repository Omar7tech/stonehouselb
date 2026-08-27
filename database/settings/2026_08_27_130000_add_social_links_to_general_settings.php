<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // Seeded with the rows the footer used to hard-code, so the slab does
        // not go blank the moment the links become editable.
        $this->migrator->add('general.social_links', [
            ['label' => 'Instagram', 'url' => 'https://instagram.com/stonehouselb'],
            ['label' => 'TikTok', 'url' => 'https://tiktok.com/@stonehouselb'],
            ['label' => 'Facebook', 'url' => 'https://facebook.com/stonehouselb'],
            ['label' => 'WhatsApp', 'url' => 'https://wa.me/96171000000'],
        ]);
    }

    public function down(): void
    {
        $this->migrator->deleteIfExists('general.social_links');
    }
};
