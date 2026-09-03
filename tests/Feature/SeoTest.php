<?php

use App\Models\Category;
use App\Models\DisplayScreen;
use App\Models\Product;
use App\Support\Seo;
use Inertia\Testing\AssertableInertia;

/** The schema.org graph on a page, decoded. */
function graph(string $html): array
{
    expect($html)->toContain('application/ld+json');

    preg_match('#application/ld\+json">(.*?)</script>#s', $html, $matches);

    return json_decode(trim($matches[1]), true, flags: JSON_THROW_ON_ERROR);
}

/** One node of that graph, by its `@type`. */
function node(array $graph, string $type): ?array
{
    foreach ($graph['@graph'] as $node) {
        if ($node['@type'] === $type) {
            return $node;
        }
    }

    return null;
}

it('writes the head on the server, where a crawler can read it', function (): void {
    $html = $this->get(route('menu.dine-in'))->assertOk()->getContent();

    expect($html)
        ->toContain('<meta name="description" content="Gather at StoneHouse')
        ->toContain('<link rel="canonical" href="'.route('menu.dine-in').'">')
        ->toContain('<meta property="og:type" content="restaurant.menu">')
        ->toContain('<meta property="og:image" content="'.asset('og/main.jpg').'">')
        ->toContain('<meta property="og:image:width" content="1456">')
        ->toContain('<meta name="twitter:card" content="summary_large_image">')
        ->toContain('index, follow, max-image-preview:large');
});

it('gives each page its own title and description', function (string $route, string $starts): void {
    $html = $this->get(route($route))->assertOk()->getContent();

    expect($html)->toContain('<title>'.e($starts));
})->with([
    ['home', 'Stone House — Sefeeha Buckets, Crunch & Grill'],
    ['menu.dine-in', 'Dine-In Menu — Stone House Crunch & Grill'],
    ['menu.delivery', 'Delivery Menu — Order Stone House Online'],
]);

it('shares the same copy with the app, so the tab never disagrees', function (): void {
    $this->get(route('menu.delivery'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('seo.title', 'Delivery Menu — Order Stone House Online')
            ->where('seo.description', fn (string $text): bool => str_starts_with($text, 'Craving StoneHouse?'))
        );
});

it('titles a shared category link after the category, and points it back at the menu', function (): void {
    $category = Category::factory()->create(['title' => 'Zinger Sandwiches']);
    Product::factory()->for($category)->create(['title' => 'Zinger Classic']);

    $html = $this->get(route('menu.dine-in', ['category' => $category->slug]))
        ->assertOk()
        ->getContent();

    expect($html)
        ->toContain('Zinger Sandwiches — Dine-In Menu')
        ->toContain('Zinger Classic')
        // Filtered views of one menu, not forty pages of their own.
        ->toContain('<link rel="canonical" href="'.route('menu.dine-in').'">');
});

it('ignores a category that is not on the menu', function (): void {
    Category::factory()->create(['title' => 'Hidden', 'is_active' => false]);

    $html = $this->get(route('menu.dine-in', ['category' => 'hidden']))->assertOk()->getContent();

    expect($html)->toContain('<title>Dine-In Menu — Stone House');
});

it('describes the business, the site, the page and its trail as one graph', function (): void {
    $category = Category::factory()->create(['title' => 'Buckets']);
    Product::factory()->for($category)->create(['title' => 'Sefeeha Bucket', 'price' => 12.5]);

    $graph = graph($this->get(route('menu.dine-in'))->assertOk()->getContent());

    $restaurant = node($graph, 'Restaurant');
    $breadcrumb = node($graph, 'BreadcrumbList');

    expect($restaurant['name'])->toBe(config('app.name'))
        ->and($restaurant['hasMenu']['@type'])->toBe('Menu')
        ->and($restaurant['hasMenu']['hasMenuSection'][0]['name'])->toBe('Buckets')
        ->and($restaurant['hasMenu']['hasMenuSection'][0]['hasMenuItem'][0])
        ->toMatchArray([
            '@type' => 'MenuItem',
            'name' => 'Sefeeha Bucket',
        ])
        ->and($restaurant['hasMenu']['hasMenuSection'][0]['hasMenuItem'][0]['offers']['price'])->toBe('12.50')
        ->and(node($graph, 'WebSite')['@id'])->toBe(route('home').'#website')
        ->and(node($graph, 'WebPage')['url'])->toBe(route('menu.dine-in'))
        ->and($breadcrumb['itemListElement'])->toHaveCount(2);
});

it('quotes the cheapest size, and the discount when there is one', function (): void {
    $category = Category::factory()->create();

    Product::factory()->for($category)->create([
        'title' => 'Bucket',
        'price' => 30,
        'variants' => [
            ['name' => 'Large', 'price' => 30],
            ['name' => 'Small', 'price' => 18, 'discount_price' => 15],
        ],
    ]);

    $graph = graph($this->get(route('menu.dine-in'))->assertOk()->getContent());
    $item = node($graph, 'Restaurant')['hasMenu']['hasMenuSection'][0]['hasMenuItem'][0];

    expect($item['offers']['price'])->toBe('15.00');
});

it('carries only the menu URL on pages that are not the menu', function (): void {
    Product::factory()->for(Category::factory())->create();

    $graph = graph($this->get(route('home'))->assertOk()->getContent());

    expect(node($graph, 'Restaurant')['hasMenu'])->toBe(route('menu.dine-in'));
});

it('publishes an address only once the shop has given one', function (): void {
    $graph = graph($this->get(route('home'))->assertOk()->getContent());

    expect(node($graph, 'Restaurant'))->not->toHaveKey('address')
        ->and(node($graph, 'Restaurant'))->not->toHaveKey('geo');

    settings([
        'street_address' => 'Main Road',
        'address_locality' => 'Aley',
        'address_region' => 'Mount Lebanon',
        'latitude' => 33.79764,
        'longitude' => 35.59503,
    ]);

    $response = $this->get(route('home'))->assertOk();
    $restaurant = node(graph($response->getContent()), 'Restaurant');

    expect($restaurant['address'])->toBe([
        '@type' => 'PostalAddress',
        'streetAddress' => 'Main Road',
        'addressLocality' => 'Aley',
        'addressRegion' => 'Mount Lebanon',
        'addressCountry' => 'LB',
    ])
        ->and($restaurant['geo']['latitude'])->toBe(33.79764)
        ->and($restaurant['areaServed']['name'])->toBe('Aley')
        ->and($response->getContent())->toContain('<meta name="geo.position" content="33.79764;35.59503">');
});

it('writes a session that runs past midnight the way schema.org reads it', function (): void {
    settings([
        'opening_hours' => [
            ['day' => 1, 'is_closed' => false, 'opens_at' => '18:00', 'closes_at' => '02:00'],
            ['day' => 2, 'is_closed' => true, 'opens_at' => '09:00', 'closes_at' => '17:00'],
        ],
    ]);

    $hours = node(graph($this->get(route('home'))->assertOk()->getContent()), 'Restaurant')['openingHoursSpecification'];

    expect($hours)->toHaveCount(1)
        ->and($hours[0]['opens'])->toBe('18:00')
        ->and($hours[0]['closes'])->toBe('26:00');
});

it('never publishes one of our own URLs as a profile of somebody else', function (): void {
    settings([
        'social_links' => [
            ['label' => 'Instagram', 'url' => 'https://instagram.com/stonehouselb'],
            ['label' => 'Menu', 'url' => route('menu.dine-in')],
        ],
    ]);

    expect(node(graph($this->get(route('home'))->assertOk()->getContent()), 'Restaurant')['sameAs'])
        ->toBe(['https://instagram.com/stonehouselb']);
});

it('prints the menu in the page for a crawler that runs no JavaScript', function (): void {
    $category = Category::factory()->create(['title' => 'Buckets']);
    Product::factory()->for($category)->create(['title' => 'Sefeeha Bucket', 'price' => 12.5]);

    $html = $this->get(route('menu.dine-in'))->assertOk()->getContent();

    expect($html)
        ->toContain('<noscript>')
        ->toContain('<h3>Buckets</h3>')
        ->toContain('Sefeeha Bucket — $12.50');
});

it('keeps the boards and the printable sheet out of search', function (): void {
    $screen = DisplayScreen::factory()->create();

    foreach ([route('menu.print'), route('screen.show', $screen)] as $url) {
        $html = $this->get($url)->assertOk()->getContent();

        expect($html)
            ->toContain('<meta name="robots" content="noindex, nofollow">')
            ->not->toContain('application/ld+json')
            ->not->toContain('<noscript>');
    }
});

describe('the files a crawler asks for first', function (): void {
    it('serves robots.txt with the sitemap on it', function (): void {
        $this->get('/robots.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Disallow: /admin')
            ->assertSee('Disallow: /screen/')
            ->assertSee('Sitemap: '.route('seo.sitemap'));
    });

    it('lists the delivery menu only while it exists', function (): void {
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
            ->assertSee('<loc>'.route('home').'</loc>', escape: false)
            ->assertSee('<loc>'.route('menu.delivery').'</loc>', escape: false);

        settings(['online_ordering_active' => false]);

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee('<loc>'.route('menu.dine-in').'</loc>', escape: false)
            ->assertDontSee('<loc>'.route('menu.delivery').'</loc>', escape: false);
    });

    it('never lists a page it has just told crawlers to stay off', function (): void {
        $sitemap = $this->get('/sitemap.xml')->assertOk()->getContent();

        expect($sitemap)
            ->not->toContain('/menu/print')
            ->not->toContain('/screen/')
            ->not->toContain('/admin');
    });
});

it('roots every URL at the configured domain, whatever host the request used', function (): void {
    $seo = app(Seo::class);

    expect($seo->robotsLines())->toContain('Sitemap: '.route('seo.sitemap'))
        ->and(collect($seo->sitemapPages())->pluck('loc')->every(
            fn (string $loc): bool => str_starts_with($loc, (string) config('app.url')),
        ))->toBeTrue();
});
