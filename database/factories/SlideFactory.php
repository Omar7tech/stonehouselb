<?php

namespace Database\Factories;

use App\Models\Slide;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Slide>
 */
class SlideFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // A plain slide by default: linking one to a product is the state
            // most tests are actually about, so it is said out loud there.
            'product_id' => null,
            'text' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * A slide the owner has taken down.
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
