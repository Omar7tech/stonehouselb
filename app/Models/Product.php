<?php

namespace App\Models;

use App\Enums\OrderType;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Sluggable\Attributes\Sluggable;

#[Sluggable(from: 'title', to: 'slug')]
#[Guarded(['id'])]
class Product extends Model implements HasMedia
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, InteractsWithMedia;

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('image')
            ->singleFile()
            ->useDisk('public');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('webp')
            ->nonQueued()
            ->format('webp')
            ->quality(75);

        $this->addMediaConversion('thumb')
            ->nonQueued()
            ->format('webp')
            ->quality(50)
            ->fit(Fit::Max, 400, 400);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount_price' => 'decimal:2',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'is_spicy' => 'boolean',
            'is_vegan' => 'boolean',
            'order_type' => OrderType::class,
            'preparation_time' => 'integer',
            'price' => 'decimal:2',
            'sort_order' => 'integer',
            'variants' => 'array',
        ];
    }
}
