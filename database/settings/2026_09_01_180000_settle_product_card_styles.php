<?php

use App\Enums\ProductCardStyle;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    /**
     * The tile and listing styles are gone from {@see ProductCardStyle}, which
     * leaves two names a stored value could still be holding — and a value the
     * enum cannot cast is a hard error on boot, on every request, not a quiet
     * fallback.
     *
     * Tiles became the card style, so a shop on those keeps what it chose. The
     * listing has no successor, so it falls back to the default.
     *
     * Written straight to the table rather than through `$this->migrator`: its
     * `update()` reads the current value through the same enum cast that can no
     * longer resolve these names, so it throws before the closure fixing it is
     * ever called.
     */
    public function up(): void
    {
        $replacements = [
            'tile' => ProductCardStyle::Card->value,
            'listing' => ProductCardStyle::Row->value,
        ];

        $row = DB::table('settings')
            ->where('group', 'general')
            ->where('name', 'product_card_style')
            ->first();

        if ($row === null) {
            return;
        }

        $stored = json_decode($row->payload, true);

        if (! is_string($stored) || ! array_key_exists($stored, $replacements)) {
            return;
        }

        DB::table('settings')
            ->where('group', 'general')
            ->where('name', 'product_card_style')
            ->update(['payload' => json_encode($replacements[$stored])]);
    }

    /**
     * Nothing to undo: the styles this moved shops off no longer exist to move
     * them back to.
     */
    public function down(): void {}
};
