<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Nullable rather than defaulted: a dish nobody has counted is not
            // a zero-calorie dish, and the storefront hides the figure entirely
            // rather than printing one the kitchen never gave.
            $table->unsignedSmallInteger('calories')->nullable()->after('preparation_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('calories');
        });
    }
};
