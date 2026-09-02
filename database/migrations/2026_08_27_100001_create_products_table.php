<?php

use App\Enums\OrderType;
use App\Models\Category;
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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('subtitle')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('preparation_time')->nullable();
            // Nullable rather than defaulted: a dish nobody has counted is not
            // a zero-calorie dish, and the storefront hides the figure entirely
            // rather than printing one the kitchen never gave.
            $table->unsignedSmallInteger('calories')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_spicy')->default(false);
            $table->boolean('is_vegan')->default(false);
            $table->unsignedMediumInteger('sort_order')->default(0);
            $table->decimal('price', 8, 2);
            $table->decimal('discount_price', 8, 2)->nullable();
            $table->string('order_type')->default(OrderType::Both->value);
            $table->json('variants')->nullable();
            $table->foreignIdFor(Category::class)->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
