<?php

namespace Database\Factories;

use App\Enums\OrderType;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * The sizes a product can be sold in, from smallest to largest.
     *
     * @var list<string>
     */
    private const VARIANT_NAMES = ['Small', 'Medium', 'Large', 'Family'];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->unique()->words(3, true),
            'subtitle' => null,
            'description' => fake()->sentence(),
            'preparation_time' => null,
            'calories' => null,
            'is_active' => true,
            'is_featured' => false,
            'is_spicy' => false,
            'is_vegan' => false,
            'sort_order' => 0,
            'price' => fake()->randomFloat(2, 1, 25),
            'discount_price' => null,
            'order_type' => OrderType::Both,
            'variants' => null,
            'category_id' => Category::factory(),
        ];
    }

    /**
     * A product offered only for the given order type.
     */
    public function orderType(OrderType $orderType): static
    {
        return $this->state(fn (): array => ['order_type' => $orderType]);
    }

    /**
     * A product that is hidden from the storefront.
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }

    /**
     * A product sold in several sizes, each shaped `['name', 'price', 'discount_price']`.
     */
    public function withVariants(): static
    {
        return $this->state(fn (): array => [
            'variants' => [
                ['name' => 'Small', 'price' => 4, 'discount_price' => null],
                ['name' => 'Large', 'price' => 6, 'discount_price' => 5],
            ],
        ]);
    }

    /**
     * A product that occasionally picks up a badge. The odds are deliberately
     * low so a seeded menu shows a sprinkling of them rather than a wall.
     */
    public function randomlyFlagged(): static
    {
        return $this->state(fn (): array => [
            'is_featured' => random_int(1, 100) <= 10,
            'is_spicy' => random_int(1, 100) <= 15,
            'is_vegan' => random_int(1, 100) <= 12,
        ]);
    }

    /**
     * A product that has a `$chanceInPercent` chance of being sold in 2 to 4
     * sizes, priced up from its own base price. The rest keep a single price,
     * so a seeded menu ends up with a realistic mix of both kinds.
     */
    public function randomlyWithVariants(int $chanceInPercent = 40): static
    {
        return $this->state(function (array $attributes) use ($chanceInPercent): array {
            if (random_int(1, 100) > $chanceInPercent) {
                return ['variants' => null];
            }

            $basePrice = (float) $attributes['price'];
            $names = array_slice(self::VARIANT_NAMES, 0, random_int(2, 4));

            $variants = [];

            foreach ($names as $index => $name) {
                $price = round($basePrice * (1 + ($index * 0.35)), 2);

                $variants[] = [
                    'name' => $name,
                    'price' => $price,
                    'discount_price' => random_int(1, 4) === 1
                        ? round($price * 0.85, 2)
                        : null,
                ];
            }

            return ['variants' => $variants];
        });
    }
}
