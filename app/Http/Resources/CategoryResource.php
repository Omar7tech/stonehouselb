<?php

namespace App\Http\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One category and the products under it, as the storefront menu reads it.
 *
 * @mixin Category
 */
class CategoryResource extends JsonResource
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
            'slug' => $this->slug,
            'name' => $this->title,
            'image' => $this->getFirstMediaUrl('image', 'webp') ?: null,
            'addons' => $this->addonsPayload(),
            'products' => $this->whenLoaded(
                'products',
                fn (): array => ProductResource::collection($this->products)->resolve(),
            ),
        ];
    }

    /**
     * The extras offered on every product in this category, with their prices
     * cast to numbers — the JSON column stores what the admin form put in it,
     * which for a price is a string.
     *
     * @return list<array{name: string, price: float}>
     */
    private function addonsPayload(): array
    {
        return array_values(array_map(
            fn (array $addon): array => [
                'name' => (string) ($addon['name'] ?? ''),
                'price' => (float) ($addon['price'] ?? 0),
            ],
            $this->addons ?? [],
        ));
    }
}
