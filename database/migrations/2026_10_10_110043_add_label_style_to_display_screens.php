<?php

use App\Enums\ScreenLabelStyle;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How a hand-picked screen draws the label on each photograph — the name and
 * the price. A look and nothing more, so every screen already made keeps the
 * one it has been showing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('display_screens', function (Blueprint $table): void {
            $table->string('label_style')->default(ScreenLabelStyle::Notch->value)->after('show_names');
        });
    }

    public function down(): void
    {
        Schema::table('display_screens', function (Blueprint $table): void {
            $table->dropColumn('label_style');
        });
    }
};
