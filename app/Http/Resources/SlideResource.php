<?php

namespace App\Http\Resources;

use App\Models\Slide;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One carousel slide as the storefront reads it.
 *
 * The linked dish is sent whole rather than as an id, because tapping the slide
 * opens the same sheet the menu opens — and that sheet wants the sizes, the
 * ingredients and the extras, none of which an id would carry. Whether a dish
 * is still on this menu at all is settled before this: the controller loads the
 * relation constrained to the menu being rendered, so a dish that has been
 * hidden, or is dine-in only on the delivery menu, arrives here as null and the
 * slide quietly falls back to being a picture.
 *
 * @mixin Slide
 */
class SlideResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $product = $this->product;

        return [
            'id' => $this->id,
            'text' => $this->text,
            // The dish's own photo stands in when no artwork was uploaded, so
            // "put this on the carousel" needs nothing but the link.
            'image' => $this->getFirstMediaUrl('image', 'slider')
                ?: ($product?->getFirstMediaUrl('image', 'webp') ?: null),
            'product' => $product === null
                ? null
                : (new ProductResource($product))->resolve(),
            // Extras belong to the category, so they have to travel with the
            // slide: the sheet it opens may well be for a dish in a category
            // the customer never opened.
            'addons' => CategoryResource::addonsPayload($product?->category->addons ?? []),
        ];
    }
}
