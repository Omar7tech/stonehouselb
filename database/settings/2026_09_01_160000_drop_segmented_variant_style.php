<?php

use App\Enums\VariantStyle;
use Illuminate\Support\Facades\DB;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    /**
     * The segmented picker is gone from {@see VariantStyle}, and a stored value
     * naming it would now fail to cast — which is a hard error on boot, on
     * every request, not a quiet fallback. Any shop sitting on it is moved to
     * the default rather than left holding a value the enum no longer has.
     *
     * Written straight to the table rather than through `$this->migrator`: its
     * `update()` reads the current value through the same enum cast that can no
     * longer resolve `segmented`, so it throws before the closure fixing it is
     * ever called. The one value this exists to repair is the one value the
     * helper cannot load.
     */
    public function up(): void
    {
        $row = DB::table('settings')
            ->where('group', 'general')
            ->where('name', 'variant_style')
            ->first();

        if ($row === null || json_decode($row->payload, true) !== 'segmented') {
            return;
        }

        DB::table('settings')
            ->where('group', 'general')
            ->where('name', 'variant_style')
            ->update(['payload' => json_encode(VariantStyle::Cards->value)]);
    }

    /**
     * Nothing to undo: the style this moved shops off no longer exists to move
     * them back to.
     */
    public function down(): void {}
};
