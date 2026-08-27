<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One product as the storefront menu reads it. The keys are camelCase and
 * deliberately few: this is what `resources/js/types/menu.ts` declares, not a
 * dump of the row.
 *
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'price' => (float) $this->price,
            'discountPrice' => $this->discount_price !== null ? (float) $this->discount_price : null,
            'image' => $this->getFirstMediaUrl('image', 'webp') ?: null,
            'preparationTime' => $this->preparation_time,
            'isFeatured' => $this->is_featured,
            'isSpicy' => $this->is_spicy,
            'isVegan' => $this->is_vegan,
            'variants' => $this->variantsPayload(),
        ];
    }

    /**
     * The sizes this product is sold in, with their prices cast to numbers —
     * the JSON column stores whatever the admin form put in it, which for a
     * price is a string.
     *
     * @return list<array{name: string, price: float, discountPrice: float|null}>
     */
    private function variantsPayload(): array
    {
        return array_values(array_map(
            fn (array $variant): array => [
                'name' => (string) ($variant['name'] ?? ''),
                'price' => (float) ($variant['price'] ?? 0),
                'discountPrice' => isset($variant['discount_price'])
                    ? (float) $variant['discount_price']
                    : null,
            ],
            $this->variants ?? [],
        ));
    }
}
