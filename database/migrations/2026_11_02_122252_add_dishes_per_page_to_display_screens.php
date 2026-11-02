<?php

use App\Enums\ScreenPageSize;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How many dishes the brick board sets on a page. Read by that layout alone, so
 * no screen made before it changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('display_screens', function (Blueprint $table): void {
            $table->unsignedTinyInteger('dishes_per_page')->default(ScreenPageSize::Six->value)->after('show_marks');
        });
    }

    public function down(): void
    {
        Schema::table('display_screens', function (Blueprint $table): void {
            $table->dropColumn('dishes_per_page');
        });
    }
};
