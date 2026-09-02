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
        Schema::create('slides', function (Blueprint $table) {
            $table->id();
            // The dish the slide is advertising, if any. Tapping the slide
            // opens that product's sheet; a slide without one is a plain
            // picture, which is all a "we're open on Sundays" banner needs.
            // Cleared rather than cascaded, so deleting a product leaves the
            // artwork in place for the owner to point somewhere else.
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            // A line laid over the picture. The dish's own name is drawn from
            // the product, so this is for the words the photo can't say.
            $table->string('text')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('slides');
    }
};
