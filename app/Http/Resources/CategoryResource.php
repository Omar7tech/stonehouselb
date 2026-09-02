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
            // The 600px cut is the only one the storefront draws — a category
            // box tops out at 236px, and the rows layout repeats the art at
            // 48px as a watermark. `image` stays for anything that wants the
            // photo whole.
            'image' => $this->getFirstMediaUrl('image', 'webp') ?: null,
            'thumbnail' => $this->getFirstMediaUrl('image', 'thumb') ?: null,
            'addons' => self::addonsPayload($this->addons ?? []),
            'products' => $this->whenLoaded(
                'products',
                fn (): array => ProductResource::collection($this->products)->resolve(),
            ),
        ];
    }

    /**
     * The extras offered on every product in a category, with their prices cast
     * to numbers — the JSON column stores what the admin form put in it, which
     * for a price is a string.
     *
     * Static so a slide can send the same shape: a sheet opened from the
     * carousel offers the extras of the dish's own category, and it has the
     * category rather than this resource to read them from.
     *
     * @param  array<int, mixed>  $addons
     * @return list<array{name: string, price: float}>
     */
    public static function addonsPayload(array $addons): array
    {
        return array_values(array_map(
            fn (array $addon): array => [
                'name' => (string) ($addon['name'] ?? ''),
                'price' => (float) ($addon['price'] ?? 0),
            ],
            $addons,
        ));
    }
}
