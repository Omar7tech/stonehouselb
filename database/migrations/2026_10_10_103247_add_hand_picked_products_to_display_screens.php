<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The hand-picked board: a screen that shows exactly the dishes the shop chose
 * for it, rather than whole categories turned over on a timer.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Which dishes a hand-picked screen shows, and in which order.
        Schema::create('display_screen_product', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('display_screen_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);

            $table->unique(['display_screen_id', 'product_id']);
        });

        Schema::table('display_screens', function (Blueprint $table): void {
            // Whether a hand-picked tile names its dish, or leaves the
            // photograph and the price to speak for it.
            $table->boolean('show_names')->default(true)->after('show_prices');
        });
    }

    public function down(): void
    {
        Schema::table('display_screens', function (Blueprint $table): void {
            $table->dropColumn('show_names');
        });

        Schema::dropIfExists('display_screen_product');
    }
};
