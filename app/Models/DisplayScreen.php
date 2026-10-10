<?php

namespace App\Models;

use App\Enums\OrderType;
use App\Enums\ScreenLabelSize;
use App\Enums\ScreenLabelStyle;
use App\Enums\ScreenLayout;
use App\Enums\ScreenOrientation;
use App\Enums\ScreenTileCorners;
use App\Enums\ScreenTileSpacing;
use App\Enums\ScreenTone;
use Database\Factories\DisplayScreenFactory;
use Illuminate\Database\Eloquent\Attributes\Guarded;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Sluggable\Attributes\Sluggable;

/**
 * One screen in the shop: a television over the counter, a tablet on a table.
 *
 * It is addressed by its slug, so the set is pointed at `/screen/counter` once
 * and left there. Everything else about it — what it shows, how it draws it,
 * how long each page holds — is the dashboard's to change, and the screen picks
 * the change up on its next refresh without anyone touching the set.
 */
#[Sluggable(from: 'name', to: 'slug')]
#[Guarded(['id'])]
class DisplayScreen extends Model
{
    /** @use HasFactory<DisplayScreenFactory> */
    use HasFactory;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * The categories this screen runs, in the order the shop put them in.
     *
     * None chosen means every category, which is what a screen created and hung
     * without further thought should show.
     *
     * @return BelongsToMany<Category, $this>
     */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }

    /**
     * The dishes a hand-picked screen shows, in the order the shop put them in.
     * Read only by the layout that draws them; every other layout runs the
     * categories above.
     *
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }

    /**
     * How long the page holds, never below a couple of seconds. A rotation set
     * to nothing by accident would otherwise flicker through the whole menu
     * faster than anyone could read a line of it.
     */
    public function holdSeconds(): int
    {
        return max((int) $this->rotation_seconds, 3);
    }

    /**
     * How often the screen fetches itself again, in minutes, or null when it
     * should be left alone. Clamped to a floor for the same reason as above.
     */
    public function refreshMinutes(): ?int
    {
        if ($this->refresh_minutes === null) {
            return null;
        }

        return max((int) $this->refresh_minutes, 1);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'orientation' => ScreenOrientation::class,
            'layout' => ScreenLayout::class,
            'order_type' => OrderType::class,
            'rotation_seconds' => 'integer',
            'refresh_minutes' => 'integer',
            'show_prices' => 'boolean',
            'show_names' => 'boolean',
            'label_style' => ScreenLabelStyle::class,
            'tone' => ScreenTone::class,
            'tile_corners' => ScreenTileCorners::class,
            'tile_spacing' => ScreenTileSpacing::class,
            'label_size' => ScreenLabelSize::class,
            'show_marks' => 'boolean',
            'show_logo' => 'boolean',
            'show_slides' => 'boolean',
            'show_qr' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
