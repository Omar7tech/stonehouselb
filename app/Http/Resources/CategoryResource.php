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
            'products' => $this->whenLoaded(
                'products',
                fn (): array => ProductResource::collection($this->products)->resolve(),
            ),
        ];
    }
}
