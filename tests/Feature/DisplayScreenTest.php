<?php

use App\Enums\OrderType;
use App\Enums\ScreenLayout;
use App\Models\Category;
use App\Models\DisplayScreen;
use App\Models\Product;
use App\Models\Slide;
use Inertia\Testing\AssertableInertia;

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
