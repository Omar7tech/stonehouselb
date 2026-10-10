<?php

use App\Enums\ScreenLabelSize;
use App\Enums\ScreenTileCorners;
use App\Enums\ScreenTileSpacing;
use App\Enums\ScreenTone;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The rest of how a hand-picked screen looks. Every default is what the board
 * was already drawing, so a screen made before these existed does not change.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('display_screens', function (Blueprint $table): void {
            // A line across the top of the board: "Today's specials".
            $table->string('heading')->nullable()->after('label_style');

            $table->string('tone')->default(ScreenTone::Light->value)->after('heading');
            $table->string('tile_corners')->default(ScreenTileCorners::Soft->value)->after('tone');
            $table->string('tile_spacing')->default(ScreenTileSpacing::Regular->value)->after('tile_corners');
            $table->string('label_size')->default(ScreenLabelSize::Regular->value)->after('tile_spacing');

            // The house-favourite, spicy and vegan marks in a tile's corner.
            $table->boolean('show_marks')->default(false)->after('label_size');
        });
    }

    public function down(): void
    {
        Schema::table('display_screens', function (Blueprint $table): void {
            $table->dropColumn(['heading', 'tone', 'tile_corners', 'tile_spacing', 'label_size', 'show_marks']);
        });
    }
};
