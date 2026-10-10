<?php

use App\Enums\OrderType;
use App\Enums\ScreenLabelSize;
use App\Enums\ScreenLabelStyle;
use App\Enums\ScreenLayout;
use App\Enums\ScreenTileCorners;
use App\Enums\ScreenTileSpacing;
use App\Enums\ScreenTone;
use App\Filament\Resources\DisplayScreens\Pages\CreateDisplayScreen;
use App\Filament\Resources\DisplayScreens\Pages\EditDisplayScreen;
use App\Filament\Resources\DisplayScreens\Pages\ListDisplayScreens;
use App\Models\Category;
use App\Models\DisplayScreen;
use App\Models\Product;
use App\Models\Slide;
use App\Models\User;
use Filament\Actions\Testing\TestAction;
use Inertia\Testing\AssertableInertia;
use Livewire\Livewire;

it('renders a screen with the whole menu when no categories are chosen', function (): void {
    $first = Category::factory()->create(['title' => 'Burgers', 'sort_order' => 1]);
    $second = Category::factory()->create(['title' => 'Drinks', 'sort_order' => 2]);

    Product::factory()->for($first)->create(['title' => 'Classic']);
    Product::factory()->for($second)->create(['title' => 'Lemonade']);

    $screen = DisplayScreen::factory()->create(['name' => 'Counter TV']);

    $this->get(route('screen.show', $screen))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('screen')
            ->where('screen.name', 'Counter TV')
            ->where('screen.layout', ScreenLayout::Board->value)
            ->where('screen.holdSeconds', 12)
            ->has('categories', 2)
            ->where('categories.0.name', 'Burgers')
            ->where('categories.1.name', 'Drinks')
        );
});

it('shows only the chosen categories, in the order they were chosen', function (): void {
    $burgers = Category::factory()->create(['title' => 'Burgers', 'sort_order' => 1]);
    $drinks = Category::factory()->create(['title' => 'Drinks', 'sort_order' => 2]);
    $sides = Category::factory()->create(['title' => 'Sides', 'sort_order' => 3]);

    foreach ([$burgers, $drinks, $sides] as $category) {
        Product::factory()->for($category)->create();
    }

    $screen = DisplayScreen::factory()->create();
    $screen->categories()->attach([
        $drinks->id => ['sort_order' => 0],
        $burgers->id => ['sort_order' => 1],
    ]);

    $this->get(route('screen.show', $screen))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->has('categories', 2)
            ->where('categories.0.name', 'Drinks')
            ->where('categories.1.name', 'Burgers')
        );
});

it('drops categories with nothing to quote on this screen', function (): void {
    $stocked = Category::factory()->create(['title' => 'Burgers']);
    Category::factory()->create(['title' => 'Empty']);

    Product::factory()->for($stocked)->create();

    $screen = DisplayScreen::factory()->create();

    $this->get(route('screen.show', $screen))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->has('categories', 1)
            ->where('categories.0.name', 'Burgers')
        );
});

it('quotes only the dishes offered on the menu the screen is set to', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create([
        'title' => 'Eat in only',
        'order_type' => OrderType::DineIn,
    ]);
    Product::factory()->for($category)->create([
        'title' => 'Delivery only',
        'order_type' => OrderType::Delivery,
    ]);

    $screen = DisplayScreen::factory()->create(['order_type' => OrderType::Delivery]);

    $this->get(route('screen.show', $screen))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->has('categories.0.products', 1)
            ->where('categories.0.products.0.name', 'Delivery only')
            ->where('screen.menuUrl', route('menu.delivery'))
        );
});

it('deals in the slider offers, and leaves them out when the screen says so', function (): void {
    $category = Category::factory()->create();
    Product::factory()->for($category)->create();
    Slide::factory()->create(['text' => 'Two for one on Fridays']);

    $showing = DisplayScreen::factory()->create(['show_slides' => true]);
    $quiet = DisplayScreen::factory()->create(['show_slides' => false]);

    $this->get(route('screen.show', $showing))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->has('slides', 1)
            ->where('slides.0.text', 'Two for one on Fridays')
        );

    $this->get(route('screen.show', $quiet))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->has('slides', 0)
        );
});

it('draws every layout from the same deck', function (string $layout): void {
    $category = Category::factory()->create(['title' => 'Burgers']);
    Product::factory()->count(3)->for($category)->create();

    $screen = DisplayScreen::factory()->create(['layout' => $layout]);

    $this->get(route('screen.show', $screen))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('screen')
            ->where('screen.layout', $layout)
            ->has('categories.0.products', 3)
        );
})->with(array_map(
    fn (ScreenLayout $layout): string => $layout->value,
    // The hand-picked board is the one layout not fed the deck.
    array_values(array_filter(ScreenLayout::cases(), fn (ScreenLayout $layout): bool => $layout !== ScreenLayout::Picks)),
));

it('stops answering once a screen is taken down', function (): void {
    $screen = DisplayScreen::factory()->inactive()->create();

    $this->get(route('screen.show', $screen))->assertNotFound();
});

it('holds a page for at least a few seconds, whatever the setting says', function (): void {
    $screen = DisplayScreen::factory()->create(['rotation_seconds' => 0]);

    expect($screen->holdSeconds())->toBe(3);
});

it('leaves a screen alone when no reload is configured', function (): void {
    $screen = DisplayScreen::factory()->create(['refresh_minutes' => null]);

    expect($screen->refreshMinutes())->toBeNull();

    $this->get(route('screen.show', $screen))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('screen.refreshMinutes', null)
        );
});

it('names a screen by its own address', function (): void {
    $screen = DisplayScreen::factory()->create(['name' => 'Window Tablet']);

    expect($screen->slug)->toBe('window-tablet')
        ->and(route('screen.show', $screen))->toEndWith('/screen/window-tablet');
});

describe('the plain boards for older televisions', function (): void {
    it('prints the menu with the prices already worked out', function (string $style): void {
        $category = Category::factory()->create(['title' => 'Burgers']);
        Product::factory()->for($category)->create([
            'title' => 'Classic',
            'price' => 8.5,
            'discount_price' => null,
        ]);

        $screen = DisplayScreen::factory()->create(['name' => 'Counter TV']);

        $response = $this->get(route('screen.show', $screen).'?simple='.$style);

        $response->assertOk()
            ->assertSee('Burgers')
            ->assertSee('Classic')
            ->assertSee('$8.50');

        // The whole point of these pages: nothing to download, nothing modern
        // to parse. A bundle tag here would mean a black screen on the sets
        // they exist for.
        expect($response->getContent())
            ->not->toContain('<script type="module"')
            ->not->toContain('=>')
            ->not->toContain('/build/assets');
    })->with(['still', 'cycle', 'crawl']);

    it('reloads itself on the shop schedule', function (): void {
        $screen = DisplayScreen::factory()->create(['refresh_minutes' => 15]);

        $this->get(route('screen.show', $screen).'?simple=still')
            ->assertOk()
            ->assertSee('content="900"', escape: false);
    });

    it('falls back to the full board when the style is not one we serve', function (): void {
        $screen = DisplayScreen::factory()->create();

        $this->get(route('screen.show', $screen).'?simple=nonsense')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->component('screen')
            );
    });

    it('keeps the screen name in the tab and off the board', function (): void {
        $category = Category::factory()->create(['title' => 'Burgers']);
        Product::factory()->for($category)->create();

        $screen = DisplayScreen::factory()->create(['name' => 'Counter TV']);

        $body = $this->get(route('screen.show', $screen).'?simple=still')
            ->assertOk()
            ->assertSee('<title>Counter TV', escape: false)
            ->getContent();

        // What the shop calls the set is a label for the dashboard. A customer
        // reading the board should see the menu and the shop's name, and never
        // learn which television they are standing in front of.
        expect(substr_count((string) $body, 'Counter TV'))->toBe(1);
    });

    it('says so plainly when there is nothing on the menu', function (): void {
        $screen = DisplayScreen::factory()->create();

        $this->get(route('screen.show', $screen).'?simple=still')
            ->assertOk()
            ->assertSee('Nothing on the menu yet.');
    });
});

describe('the hand-picked board', function (): void {
    it('shows exactly the dishes chosen for it, in the order they were chosen', function (): void {
        $category = Category::factory()->create();
        $classic = Product::factory()->for($category)->create(['title' => 'Classic']);
        $lemonade = Product::factory()->for($category)->create(['title' => 'Lemonade']);
        Product::factory()->for($category)->create(['title' => 'Not chosen']);

        $screen = DisplayScreen::factory()->handPicked()->create();
        $screen->products()->attach([
            $lemonade->id => ['sort_order' => 0],
            $classic->id => ['sort_order' => 1],
        ]);

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->component('screen')
                ->where('screen.layout', ScreenLayout::Picks->value)
                ->where('screen.showNames', true)
                ->has('products', 2)
                ->where('products.0.name', 'Lemonade')
                ->where('products.1.name', 'Classic')
                // It runs no deck: the menu and the slider stay off it.
                ->has('categories', 0)
                ->has('slides', 0)
            );
    });

    it('drops a chosen dish once it is taken off the menu', function (): void {
        $live = Product::factory()->create(['title' => 'Classic']);
        $gone = Product::factory()->create(['title' => 'Retired', 'is_active' => false]);

        $screen = DisplayScreen::factory()->handPicked()->create();
        $screen->products()->attach([$gone->id => ['sort_order' => 0], $live->id => ['sort_order' => 1]]);

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->has('products', 1)
                ->where('products.0.name', 'Classic')
            );
    });

    it('keeps a chosen dish whichever menu the screen quotes', function (): void {
        $deliveryOnly = Product::factory()->create(['title' => 'Family box', 'order_type' => OrderType::Delivery]);

        $screen = DisplayScreen::factory()->handPicked()->create(['order_type' => OrderType::DineIn]);
        $screen->products()->attach($deliveryOnly);

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->has('products', 1)
            );
    });

    it('sends no chosen dishes to a screen on any other layout', function (): void {
        $product = Product::factory()->create();

        $screen = DisplayScreen::factory()->create(['layout' => ScreenLayout::Board]);
        $screen->products()->attach($product);

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->has('products', 0)
                ->has('categories', 1)
            );
    });

    it('never reloads itself, whatever the screen was set to before', function (): void {
        $screen = DisplayScreen::factory()->handPicked()->create(['refresh_minutes' => 30]);

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->where('screen.refreshMinutes', null)
            );
    });

    it('saves the dishes from the dashboard in the order they were picked', function (): void {
        $first = Product::factory()->create();
        $second = Product::factory()->create();
        $third = Product::factory()->create();

        $screen = DisplayScreen::factory()->handPicked()->create();
        $screen->products()->attach([
            $second->id => ['sort_order' => 0],
            $first->id => ['sort_order' => 1],
        ]);

        $this->actingAs(User::factory()->create());

        $page = Livewire::test(EditDisplayScreen::class, ['record' => $screen->getRouteKey()]);

        // The list opens on what was saved, in the order it was saved in.
        expect(array_column(array_values($page->get('data.products')), 'product_id'))
            ->toBe([$second->id, $first->id]);

        $page
            ->set('data.products', [
                'a' => ['product_id' => $third->id],
                'b' => ['product_id' => $first->id],
                'c' => ['product_id' => $second->id],
            ])
            ->call('save')
            ->assertHasNoFormErrors();

        expect($screen->products()->pluck('products.id')->all())
            ->toBe([$third->id, $first->id, $second->id]);
    });

    it('creates a hand-picked screen with its dishes from the dashboard', function (): void {
        $first = Product::factory()->create();
        $second = Product::factory()->create();

        $this->actingAs(User::factory()->create());

        Livewire::test(CreateDisplayScreen::class)
            ->fillForm(['name' => 'Counter shelf', 'layout' => ScreenLayout::Picks->value])
            ->set('data.products', [
                'a' => ['product_id' => $second->id],
                'b' => ['product_id' => $first->id],
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $screen = DisplayScreen::query()->where('name', 'Counter shelf')->sole();

        expect($screen->layout)->toBe(ScreenLayout::Picks)
            ->and($screen->products()->pluck('products.id')->all())->toBe([$second->id, $first->id]);
    });
});

describe('the label on a hand-picked tile', function (): void {
    it('is the notch unless the shop chose otherwise', function (): void {
        $screen = DisplayScreen::factory()->handPicked()->create();

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->where('screen.labelStyle', ScreenLabelStyle::Notch->value)
            );
    });

    it('is drawn in whichever style the shop chose in the dashboard', function (ScreenLabelStyle $style): void {
        $screen = DisplayScreen::factory()->handPicked()->create();

        $this->actingAs(User::factory()->create());

        Livewire::test(EditDisplayScreen::class, ['record' => $screen->getRouteKey()])
            ->fillForm(['label_style' => $style->value])
            ->call('save')
            ->assertHasNoFormErrors();

        expect($screen->refresh()->label_style)->toBe($style);

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->where('screen.labelStyle', $style->value)
            );
    })->with(ScreenLabelStyle::cases());

    it('is not offered to a board that has no labels to style', function (): void {
        $screen = DisplayScreen::factory()->create(['layout' => ScreenLayout::Board]);

        $this->actingAs(User::factory()->create());

        Livewire::test(EditDisplayScreen::class, ['record' => $screen->getRouteKey()])
            ->assertDontSee(ScreenLabelStyle::Band->getDescription())
            ->fillForm(['layout' => ScreenLayout::Picks->value])
            ->assertSee(ScreenLabelStyle::Band->getDescription());
    });
});

describe('the look of a hand-picked board', function (): void {
    it('is drawn the way it always was until the shop changes it', function (): void {
        $screen = DisplayScreen::factory()->handPicked()->create();

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->where('screen.heading', null)
                ->where('screen.tone', ScreenTone::Light->value)
                ->where('screen.tileCorners', ScreenTileCorners::Soft->value)
                ->where('screen.tileSpacing', ScreenTileSpacing::Regular->value)
                ->where('screen.labelSize', ScreenLabelSize::Regular->value)
                ->where('screen.showMarks', false)
            );
    });

    it('takes every setting from the dashboard to the screen', function (): void {
        $screen = DisplayScreen::factory()->handPicked()->create();

        $this->actingAs(User::factory()->create());

        Livewire::test(EditDisplayScreen::class, ['record' => $screen->getRouteKey()])
            ->fillForm([
                'heading' => 'Today\'s specials',
                'tone' => ScreenTone::Dark->value,
                'tile_corners' => ScreenTileCorners::Round->value,
                'tile_spacing' => ScreenTileSpacing::Airy->value,
                'label_size' => ScreenLabelSize::Large->value,
                'show_marks' => true,
            ])
            ->call('save')
            ->assertHasNoFormErrors();

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->where('screen.heading', 'Today\'s specials')
                ->where('screen.tone', ScreenTone::Dark->value)
                ->where('screen.tileCorners', ScreenTileCorners::Round->value)
                ->where('screen.tileSpacing', ScreenTileSpacing::Airy->value)
                ->where('screen.labelSize', ScreenLabelSize::Large->value)
                ->where('screen.showMarks', true)
            );
    });

    it('treats a heading of nothing but spaces as no heading', function (): void {
        $screen = DisplayScreen::factory()->handPicked()->create(['heading' => '   ']);

        $this->get(route('screen.show', $screen))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
                ->where('screen.heading', null)
            );
    });
});

describe('the screens in the dashboard', function (): void {
    it('marks the hand-picked layout as new, and still saves it', function (): void {
        $this->actingAs(User::factory()->create());

        Livewire::test(CreateDisplayScreen::class)
            ->assertSeeHtml('fi-badge')
            ->assertSeeInOrder(['Hand-picked', 'New'])
            ->fillForm(['name' => 'Window tablet', 'layout' => ScreenLayout::Picks->value])
            ->call('create')
            ->assertHasNoFormErrors();

        expect(DisplayScreen::query()->where('name', 'Window tablet')->sole()->layout)
            ->toBe(ScreenLayout::Picks);
    });

    it('asks a hand-picked screen which menu its code opens only once it shows a code', function (): void {
        $screen = DisplayScreen::factory()->handPicked()->create(['show_qr' => false]);

        $this->actingAs(User::factory()->create());

        Livewire::test(EditDisplayScreen::class, ['record' => $screen->getRouteKey()])
            ->assertDontSee('Which menu the code opens')
            ->assertDontSee('Which menu it quotes')
            ->fillForm(['show_qr' => true])
            ->assertSee('Which menu the code opens')
            ->fillForm(['order_type' => OrderType::Delivery->value])
            ->call('save')
            ->assertHasNoFormErrors();

        expect($screen->refresh()->order_type)->toBe(OrderType::Delivery);
    });

    it('saves a board that turns pages, with the categories chosen for it', function (): void {
        $category = Category::factory()->create();

        $this->actingAs(User::factory()->create());

        Livewire::test(CreateDisplayScreen::class)
            ->fillForm([
                'name' => 'Counter TV',
                'layout' => ScreenLayout::Showcase->value,
                'categories' => [$category->id],
                'rotation_seconds' => 20,
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $screen = DisplayScreen::query()->where('name', 'Counter TV')->sole();

        expect($screen->layout)->toBe(ScreenLayout::Showcase)
            ->and($screen->rotation_seconds)->toBe(20)
            ->and($screen->categories()->pluck('categories.id')->all())->toBe([$category->id]);
    });

    it('duplicates a screen with everything chosen for it, at an address of its own', function (): void {
        $category = Category::factory()->create();
        $product = Product::factory()->for($category)->create();

        $screen = DisplayScreen::factory()->handPicked()->create(['name' => 'Counter TV']);
        $screen->categories()->attach($category, ['sort_order' => 0]);
        $screen->products()->attach($product, ['sort_order' => 0]);

        $this->actingAs(User::factory()->create());

        Livewire::test(ListDisplayScreens::class)
            ->callAction(TestAction::make('replicate')->table($screen))
            ->assertHasNoErrors();

        $copy = DisplayScreen::query()->where('name', 'Counter TV copy')->sole();

        expect($copy->slug)->toBe('counter-tv-copy')
            ->and($copy->layout)->toBe(ScreenLayout::Picks)
            ->and($copy->categories()->pluck('categories.id')->all())->toBe([$category->id])
            ->and($copy->products()->pluck('products.id')->all())->toBe([$product->id]);
    });
});
