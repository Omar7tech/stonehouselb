<?php

namespace App\Models;

use Database\Factories\SlideFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * One card in the carousel above the menu: a wide picture, an optional line of
 * text over it, and optionally the dish it is advertising.
 */
#[Guarded(['id'])]
class Slide extends Model implements HasMedia
{
    /** @use HasFactory<SlideFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * The dish this slide opens, or null when it is a plain picture.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('image')
            ->singleFile()
            ->useDisk('public');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        /**
         * Wider and heavier than the product cuts: this one is drawn a third of
         * a desk monitor across at its smallest and the full width of a phone
         * at its largest, so 400px would show every pixel of itself.
         */
        $this->addMediaConversion('slider')
            ->nonQueued()
            ->format('webp')
            ->quality(70)
            ->fit(Fit::Max, 1600, 900);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
