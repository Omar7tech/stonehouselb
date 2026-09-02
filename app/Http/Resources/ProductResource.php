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
            // The same photo cut to 400px. Everywhere but the sheet draws this
            // at 88px or less, and `webp` is the untouched original in a new
            // format — so without this a menu of forty dishes downloads forty
            // full-size photographs to render them the size of a stamp.
            'thumbnail' => $this->getFirstMediaUrl('image', 'thumb') ?: null,
            'preparationTime' => $this->preparation_time,
            'calories' => $this->calories,
            'isFeatured' => $this->is_featured,
            'isSpicy' => $this->is_spicy,
            'isVegan' => $this->is_vegan,
            'variants' => $this->variantsPayload(),
            'ingredients' => $this->ingredientsPayload(),
        ];
    }

    /**
     * What is in this dish, as plain names in the order the kitchen listed
     * them. Flattened out of the `['name' => …]` rows the repeater writes,
     * because a name is all there is to one — and rows left blank are dropped
     * rather than offered to the customer as something to take out.
     *
     * @return list<string>
     */
    private function ingredientsPayload(): array
    {
        return array_values(array_filter(array_map(
            fn (array $ingredient): string => trim((string) ($ingredient['name'] ?? '')),
            $this->ingredients ?? [],
        ), static fn (string $name): bool => $name !== ''));
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
