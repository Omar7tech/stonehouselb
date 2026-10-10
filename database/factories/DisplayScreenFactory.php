<?php

namespace Database\Factories;

use App\Enums\OrderType;
use App\Enums\ScreenLabelSize;
use App\Enums\ScreenLabelStyle;
use App\Enums\ScreenLayout;
use App\Enums\ScreenOrientation;
use App\Enums\ScreenTileCorners;
use App\Enums\ScreenTileSpacing;
use App\Enums\ScreenTone;
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
            'show_names' => true,
            'label_style' => ScreenLabelStyle::Notch,
            'heading' => null,
            'tone' => ScreenTone::Light,
            'tile_corners' => ScreenTileCorners::Soft,
            'tile_spacing' => ScreenTileSpacing::Regular,
            'label_size' => ScreenLabelSize::Regular,
            'show_marks' => false,
            'show_logo' => true,
            'show_slides' => true,
            'show_qr' => false,
            'refresh_minutes' => 30,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * A screen showing only the dishes chosen for it.
     */
    public function handPicked(): static
    {
        return $this->state(fn (): array => ['layout' => ScreenLayout::Picks]);
    }

    /**
     * A screen the shop has taken down. Its address stops answering.
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
