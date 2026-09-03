<?php

use App\Enums\OrderType;
use App\Enums\ScreenLayout;
use App\Enums\ScreenOrientation;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The screens hung around the shop: a television over the counter, a tablet on
 * a table, a display in the window. Each is a named board with its own address,
 * so a screen is set up once and then left alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('display_screens', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();

            // How the set is hung, and how it draws what it is given.
            $table->string('orientation')->default(ScreenOrientation::Landscape->value);
            $table->string('layout')->default(ScreenLayout::Board->value);

            // Which menu it quotes. A screen over the counter shows what can be
            // eaten in; one at the takeaway hatch shows what can be sent out.
            $table->string('order_type')->default(OrderType::DineIn->value);

            // How long one page holds before the next takes its place.
            $table->unsignedSmallInteger('rotation_seconds')->default(12);

            $table->boolean('show_prices')->default(true);
            $table->boolean('show_logo')->default(true);
            // The carousel slides, dealt in between the categories.
            $table->boolean('show_slides')->default(true);
            // A code in the corner that opens the menu on a phone.
            $table->boolean('show_qr')->default(false);

            // How often the page fetches itself again, so a price changed in
            // the dashboard reaches a screen nobody is standing at. Null is a
            // screen that never reloads on its own.
            $table->unsignedSmallInteger('refresh_minutes')->nullable()->default(30);

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Which categories a screen runs, and in which order. Empty means all
        // of them, so a screen works the moment it is created.
        Schema::create('category_display_screen', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('display_screen_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);

            $table->unique(['display_screen_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_display_screen');
        Schema::dropIfExists('display_screens');
    }
};
