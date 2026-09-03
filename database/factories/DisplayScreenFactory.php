<?php

namespace Database\Factories;

use App\Enums\OrderType;
use App\Enums\ScreenLayout;
use App\Enums\ScreenOrientation;
use App\Models\DisplayScreen;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DisplayScreen>
 */
class DisplayScreenFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'orientation' => ScreenOrientation::Landscape,
            'layout' => ScreenLayout::Board,
            'order_type' => OrderType::DineIn,
            'rotation_seconds' => 12,
            'show_prices' => true,
            'show_logo' => true,
            'show_slides' => true,
            'show_qr' => false,
            'refresh_minutes' => 30,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * A screen the shop has taken down. Its address stops answering.
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
