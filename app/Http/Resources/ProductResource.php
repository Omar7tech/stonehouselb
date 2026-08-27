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
            'description' => $this->description,
            'price' => (float) $this->price,
            'discountPrice' => $this->discount_price !== null ? (float) $this->discount_price : null,
            'image' => $this->getFirstMediaUrl('image', 'webp') ?: null,
        ];
    }
}
