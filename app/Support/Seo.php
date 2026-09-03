<?php

namespace App\Support;

use App\Enums\OrderType;
use App\Enums\Weekday;
use App\Models\Category;
use App\Models\Product;
use App\Settings\GeneralSettings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Everything the storefront needs to be found: the per-page meta tags, the
 * schema.org graph, the crawlable outline, and the sitemap's page list.
 *
 * The storefront is an Inertia app rendered without SSR, so React never gets to
 * write the head a crawler reads — the first HTML response has to carry the
 * whole story. This class resolves that story from the current route, and the
 * root template prints it before a single line of JavaScript runs.
 *
 * Everything that could differ from shop to shop — the address, the phone
 * number, the hours, the map link — is read from the settings rather than
 * written in here, and anything left unset is left out of the markup entirely.
 * A half-filled address published as a whole one is worse than no address: it
 * is what puts a business on the map in the wrong town.
 */
class Seo
{
    /** The Open Graph image, shot once at this size for every page. */
    private const IMAGE = 'og/main.jpg';

    private const IMAGE_WIDTH = 1456;

    private const IMAGE_HEIGHT = 720;

    private const IMAGE_ALT = 'The Stone House shopfront on the street, in stone and orange';

    /**
     * How Google may present a page: the whole photograph, the whole snippet.
     * A picture of the place is a large part of why anybody clicks it.
     */
    private const OPEN = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    /** For the pages that exist for one screen or one printer, not for search. */
    private const CLOSED = 'noindex, nofollow';

    public function __construct(private readonly GeneralSettings $settings) {}

    /**
     * The meta tags for the route being rendered, falling back to the landing
     * page's copy for anything unrecognised so no page is ever left bare.
     *
     * @return array{
     *     title: string,
     *     description: string,
     *     keywords: string,
     *     image: string,
     *     imageAlt: string,
     *     imageWidth: int,
     *     imageHeight: int,
     *     type: string,
     *     url: string,
     *     robots: string,
     *     indexable: bool,
     * }
     */
    public function meta(?string $routeName = null): array
    {
        $page = $this->pages()[$routeName] ?? $this->pages()['home'];
        $indexable = ($page['indexable'] ?? true) === true;

        // A category opened from the menu retitles the page for whoever shares
        // that link, without becoming a page of its own — see below.
        $category = $indexable ? $this->openCategory($routeName) : null;

        if ($category !== null) {
            $page['title'] = $category->title.' — '.$page['title'];
            $page['description'] = $this->categoryDescription($category, $routeName);
        }

        return [
            'title' => $page['title'],
            'description' => $page['description'],
            'keywords' => $page['keywords'],
            'image' => asset(self::IMAGE),
            'imageAlt' => self::IMAGE_ALT,
            'imageWidth' => self::IMAGE_WIDTH,
            'imageHeight' => self::IMAGE_HEIGHT,
            'type' => $page['type'],
            'url' => $this->canonicalUrl(),
            'robots' => $indexable ? self::OPEN : self::CLOSED,
            'indexable' => $indexable,
        ];
    }

    /**
     * The just-enough slice of the meta shared with the app, so a client-side
     * visit retitles the tab exactly the way the server would have.
     *
     * @return array{title: string, description: string}
     */
    public function share(?string $routeName = null): array
    {
        $meta = $this->meta($routeName);

        return [
            'title' => $meta['title'],
            'description' => $meta['description'],
        ];
    }

    /**
     * The schema.org graph for this route: the restaurant itself, the site, the
     * page being viewed, its breadcrumb trail, and — on the menu pages — the
     * whole menu as machine-readable dishes.
     *
     * One `@graph` rather than several loose scripts, so every node can point
     * at the others by `@id` and Google reads them as one business rather than
     * as four unrelated things that happen to share a page.
     *
     * @return array<string, mixed>|null
     */
    public function structuredData(?string $routeName = null): ?array
    {
        // A screen on a wall and a menu on a printer are not search results.
        if (! $this->meta($routeName)['indexable']) {
            return null;
        }

        return [
            '@context' => 'https://schema.org',
            '@graph' => [
                $this->restaurantNode($routeName),
                $this->websiteNode(),
                $this->webPageNode($routeName),
                $this->breadcrumbNode($routeName),
            ],
        ];
    }

    /**
     * The pages a crawler should know about. The delivery menu is only listed
     * while online ordering is on — a URL that redirects has no business in a
     * sitemap.
     *
     * @return list<array{loc: string, lastmod: string|null, changefreq: string, priority: string}>
     */
    public function sitemapPages(): array
    {
        $changedAt = $this->menuLastModified();

        $pages = [
            ['route' => 'home', 'changefreq' => 'weekly', 'priority' => '1.0'],
            ['route' => 'menu.dine-in', 'changefreq' => 'weekly', 'priority' => '0.9'],
        ];

        if ($this->settings->online_ordering_active) {
            $pages[] = ['route' => 'menu.delivery', 'changefreq' => 'weekly', 'priority' => '0.9'];
        }

        return array_map(fn (array $page): array => [
            'loc' => route($page['route']),
            'lastmod' => $changedAt,
            'changefreq' => $page['changefreq'],
            'priority' => $page['priority'],
        ], $pages);
    }

    /**
     * The crawl rules. The dashboard, the storage symlink, the printable sheet
     * and the screens are all closed off; everything a customer would search
     * for is open.
     *
     * @return list<string>
     */
    public function robotsLines(): array
    {
        return [
            'User-agent: *',
            'Allow: /',
            'Disallow: /admin',
            'Disallow: /admin/*',
            'Disallow: /storage/',
            'Disallow: /up',
            // Neither is a page anybody should arrive on from a search: one is
            // a sheet for a printer, the other a board on a wall.
            'Disallow: /menu/print',
            'Disallow: /screen/',
            '',
            // Crawlers that hammer a small host for nothing in return.
            'User-agent: AhrefsBot',
            'Crawl-delay: 10',
            '',
            'User-agent: SemrushBot',
            'Crawl-delay: 10',
            '',
            'Sitemap: '.route('seo.sitemap'),
            '',
        ];
    }

    /**
     * The menu flattened to plain text — section names, dish names, prices.
     *
     * The storefront paints the menu in React, so a crawler that indexes before
     * it runs the page's JavaScript sees no dishes at all. The root template
     * prints this outline in a `<noscript>` block, which puts the same words in
     * the raw HTML for that first pass without showing a customer anything
     * twice. Read off the cached menu graph, so it costs no extra query.
     *
     * @return list<array{name: string, items: list<array{name: string, price: string|null}>}>
     */
    public function menuOutline(?string $routeName = null): array
    {
        $menu = $this->menuNode($this->orderTypeFor($routeName));

        if ($menu === null) {
            return [];
        }

        return array_values(array_map(fn (array $section): array => [
            'name' => (string) $section['name'],
            'items' => array_values(array_map(fn (array $item): array => [
                'name' => (string) $item['name'],
                'price' => isset($item['offers']) ? (string) $item['offers']['price'] : null,
            ], $section['hasMenuItem'])),
        ], $menu['hasMenuSection']));
    }

    /** Whether this route shows the menu, and so wants the outline and the dishes. */
    public function isMenuRoute(?string $routeName): bool
    {
        return in_array($routeName, ['menu.dine-in', 'menu.delivery'], true);
    }

    /**
     * This page's one true URL, always rooted at the configured domain rather
     * than at whatever host the request happened to arrive on.
     *
     * A visit to `www.`, to plain `http://`, or through a preview hostname
     * would otherwise name itself as the canonical, and the same page would
     * compete with itself for the same rankings. The query string is dropped,
     * which folds a link tagged `?fbclid=…` into the clean URL — and folds an
     * open category back into the menu it is a view of, rather than letting one
     * menu become forty near-identical pages.
     */
    private function canonicalUrl(): string
    {
        return url()->to(request()->path());
    }

    /**
     * The per-page copy. Titles stay under about sixty characters so Google
     * prints them whole, and every description leads with what the shop is
     * actually known for rather than with its own name.
     *
     * @return array<string, array{title: string, description: string, keywords: string, type: string, indexable?: bool}>
     */
    private function pages(): array
    {
        $name = config('app.name', 'Stone House');

        // Arabic alongside the English: a customer in Lebanon is as likely to
        // search صفيحة as sefeeha, and the two spellings cost one line each.
        $arabic = 'ستون هاوس, صفيحة, دلو صفيحة, دجاج مقلي, زنجر, ساندويش زنجر, مشاوي, مطعم, توصيل طعام';

        return [
            'home' => [
                'title' => $name.' — Sefeeha Buckets, Crunch & Grill',
                'description' => 'Discover StoneHouse for sefeeha buckets, crispy fried chicken, zinger '
                    .'sandwiches, and flavourful meat dishes. Explore our menu for dine-in and delivery.',
                'keywords' => 'StoneHouse, StoneHouse menu, sefeeha buckets, sefeeha, fried chicken, '
                    .'zinger sandwiches, meat dishes, crispy chicken, dine-in restaurant, food delivery, '
                    .$arabic,
                'type' => 'restaurant.restaurant',
            ],
            'menu.dine-in' => [
                'title' => 'Dine-In Menu — '.$name.' Crunch & Grill',
                'description' => 'Gather at StoneHouse for sefeeha buckets, crispy fried chicken, zinger '
                    .'sandwiches, and delicious meat dishes. Enjoy your favourites with friends and family.',
                'keywords' => 'StoneHouse dine-in, StoneHouse restaurant, sefeeha buckets, sefeeha '
                    .'restaurant, fried chicken restaurant, zinger sandwiches, meat dishes, dine-in menu, '
                    .'family dining, dining with friends, '.$arabic,
                'type' => 'restaurant.menu',
            ],
            'menu.delivery' => [
                'title' => 'Delivery Menu — Order '.$name.' Online',
                'description' => 'Craving StoneHouse? Get sefeeha buckets, crispy fried chicken, zinger '
                    .'sandwiches, and flavourful meat dishes delivered to your door. Explore our delivery menu.',
                'keywords' => 'StoneHouse delivery, sefeeha delivery, sefeeha buckets, fried chicken '
                    .'delivery, zinger delivery, zinger sandwiches, meat dishes delivery, chicken delivery, '
                    .'food delivery, StoneHouse delivery menu, '.$arabic,
                'type' => 'restaurant.menu',
            ],
            'menu.print' => [
                'title' => $name.' — Printable Menu',
                'description' => 'The Stone House menu laid out for print.',
                'keywords' => '',
                'type' => 'website',
                'indexable' => false,
            ],
            'screen.show' => [
                'title' => $name.' — Screen',
                'description' => 'A menu board for a screen in the shop.',
                'keywords' => '',
                'type' => 'website',
                'indexable' => false,
            ],
        ];
    }

    /**
     * The category the menu was opened on, when the URL names one that exists.
     *
     * The storefront mirrors the open category into `?category=` so a link to
     * one can be shared, and this is what makes that link arrive somewhere
     * specific: WhatsApp shows the category's own name and its dishes rather
     * than the whole menu's. The canonical still points at the menu, so the
     * shared link is a view of a page rather than a page of its own.
     */
    private function openCategory(?string $routeName): ?Category
    {
        if (! $this->isMenuRoute($routeName)) {
            return null;
        }

        $slug = request()->query('category');

        if (! is_string($slug) || blank($slug)) {
            return null;
        }

        return Category::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }

    /** A description written from the dishes actually in the open category. */
    private function categoryDescription(Category $category, ?string $routeName): string
    {
        $dishes = $category->products()
            ->where('is_active', true)
            ->whereIn('order_type', [$this->orderTypeFor($routeName)->value, OrderType::Both->value])
            ->orderBy('sort_order')
            ->limit(6)
            ->pluck('title')
            ->all();

        $lead = $dishes === []
            ? $category->title.' at '.config('app.name', 'Stone House').'.'
            : $category->title.' at '.config('app.name', 'Stone House').': '.implode(', ', $dishes).'.';

        return Str::limit($lead.' '.($routeName === 'menu.delivery'
            ? 'Order for delivery on WhatsApp, prices included.'
            : 'See the full dine-in menu with prices.'), 160, preserveWords: true);
    }

    /** Which menu a route is quoting; the dine-in one answers for everything else. */
    private function orderTypeFor(?string $routeName): OrderType
    {
        return $routeName === 'menu.delivery' ? OrderType::Delivery : OrderType::DineIn;
    }

    /**
     * The business itself: where it is, when it opens, what it serves, and how
     * an order reaches it. This is the node the local pack and the knowledge
     * panel are built from.
     *
     * The full dish-by-dish menu only rides along on the menu pages, where it
     * is what the page is about. Everywhere else `hasMenu` is the plain URL of
     * the menu — schema.org takes either, and the landing page stays light
     * instead of carrying twenty kilobytes of JSON a customer never reads.
     *
     * @return array<string, mixed>
     */
    private function restaurantNode(?string $routeName): array
    {
        $home = route('home');

        return array_filter([
            '@type' => 'Restaurant',
            '@id' => $home.'#restaurant',
            'name' => config('app.name', 'Stone House'),
            'alternateName' => 'ستون هاوس',
            'slogan' => 'Crunch & Grill',
            'description' => $this->pages()['home']['description'],
            'url' => $home,
            'logo' => asset('web-app-manifest-512x512.png'),
            'image' => [asset(self::IMAGE)],
            'telephone' => $this->settings->usablePhoneNumber(),
            'priceRange' => '$$',
            'currenciesAccepted' => $this->settings->usableLbpRate() !== null ? 'USD, LBP' : 'USD',
            'paymentAccepted' => 'Cash',
            'servesCuisine' => ['Lebanese', 'Sefeeha', 'Fried Chicken', 'Sandwiches', 'Grill'],
            'address' => $this->addressNode(),
            'geo' => $this->geoNode(),
            'hasMap' => $this->settings->usableLocationUrl(),
            'areaServed' => $this->areaServedNode(),
            'publicAccess' => true,
            'openingHoursSpecification' => $this->openingHoursSpecification(),
            'hasMenu' => $this->isMenuRoute($routeName)
                ? $this->menuNode($this->orderTypeFor($routeName))
                : route('menu.dine-in'),
            'sameAs' => $this->sameAs(),
            'potentialAction' => $this->orderAction(),
        ], fn (mixed $value): bool => $value !== null && $value !== [] && $value !== '');
    }

    /**
     * The postal address, or null when the shop has given nothing to put in
     * one. A `PostalAddress` with only a country in it tells a search engine
     * the business is somewhere in Lebanon, which it already assumed.
     *
     * @return array<string, string>|null
     */
    private function addressNode(): ?array
    {
        $address = array_filter([
            'streetAddress' => $this->settings->street_address,
            'addressLocality' => $this->settings->address_locality,
            'addressRegion' => $this->settings->address_region,
        ], fn (?string $line): bool => filled($line));

        if ($address === []) {
            return null;
        }

        return [
            '@type' => 'PostalAddress',
            ...array_map(fn (string $line): string => trim($line), $address),
            'addressCountry' => 'LB',
        ];
    }

    /**
     * @return array<string, float|string>|null
     */
    private function geoNode(): ?array
    {
        $coordinates = $this->settings->usableCoordinates();

        if ($coordinates === null) {
            return null;
        }

        return [
            '@type' => 'GeoCoordinates',
            'latitude' => $coordinates['latitude'],
            'longitude' => $coordinates['longitude'],
        ];
    }

    /**
     * The town the shop serves, when it has said which one.
     *
     * @return array<string, mixed>|null
     */
    private function areaServedNode(): ?array
    {
        if (blank($this->settings->address_locality)) {
            return null;
        }

        return array_filter([
            '@type' => 'City',
            'name' => trim((string) $this->settings->address_locality),
            'containedInPlace' => blank($this->settings->address_region) ? null : [
                '@type' => 'AdministrativeArea',
                'name' => trim((string) $this->settings->address_region),
            ],
        ]);
    }

    /**
     * The site as a whole, so every page is attributed to one publisher.
     *
     * @return array<string, mixed>
     */
    private function websiteNode(): array
    {
        $home = route('home');

        return [
            '@type' => 'WebSite',
            '@id' => $home.'#website',
            'url' => $home,
            'name' => config('app.name', 'Stone House'),
            'inLanguage' => ['en', 'ar'],
            'publisher' => ['@id' => $home.'#restaurant'],
        ];
    }

    /**
     * The page being viewed, tied back to the site and the business.
     *
     * @return array<string, mixed>
     */
    private function webPageNode(?string $routeName): array
    {
        $home = route('home');
        $meta = $this->meta($routeName);

        return [
            '@type' => 'WebPage',
            '@id' => $meta['url'].'#webpage',
            'url' => $meta['url'],
            'name' => $meta['title'],
            'description' => $meta['description'],
            'isPartOf' => ['@id' => $home.'#website'],
            'about' => ['@id' => $home.'#restaurant'],
            'primaryImageOfPage' => [
                '@type' => 'ImageObject',
                'url' => $meta['image'],
                'width' => self::IMAGE_WIDTH,
                'height' => self::IMAGE_HEIGHT,
                'caption' => $meta['imageAlt'],
            ],
            'inLanguage' => 'en',
            'breadcrumb' => ['@id' => $meta['url'].'#breadcrumb'],
        ];
    }

    /**
     * The trail from the landing page to this one. Every page here is one hop
     * from home, so the deepest trail is two items — which is exactly what
     * Google needs to print the breadcrumb line under the result.
     *
     * @return array<string, mixed>
     */
    private function breadcrumbNode(?string $routeName): array
    {
        $trail = [['name' => 'Home', 'url' => route('home')]];

        $leaf = match ($routeName) {
            'menu.dine-in' => ['name' => 'Dine-in menu', 'url' => route('menu.dine-in')],
            'menu.delivery' => ['name' => 'Delivery menu', 'url' => route('menu.delivery')],
            default => null,
        };

        if ($leaf !== null) {
            $trail[] = $leaf;
        }

        return [
            '@type' => 'BreadcrumbList',
            '@id' => $this->canonicalUrl().'#breadcrumb',
            'itemListElement' => array_map(fn (array $crumb, int $index): array => [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $crumb['name'],
                'item' => $crumb['url'],
            ], $trail, array_keys($trail)),
        ];
    }

    /**
     * The menu as schema.org sections and dishes, so individual items can
     * surface in Google rather than only the shop's name.
     *
     * Built from the same active-and-ordered set the storefront renders, and
     * cached under a key made of the menu's own timestamps — an edit in the
     * dashboard changes the key, so the schema is never stale and never costs a
     * rebuild on an untouched menu.
     *
     * @return array<string, mixed>|null
     */
    private function menuNode(OrderType $orderType): ?array
    {
        $fingerprint = $this->menuFingerprint();

        if ($fingerprint === null) {
            return null;
        }

        return Cache::remember(
            "seo.menu.{$orderType->value}.{$fingerprint}",
            now()->addDay(),
            fn (): ?array => $this->buildMenuNode($orderType),
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    private function buildMenuNode(OrderType $orderType): ?array
    {
        $sections = Category::query()
            ->where('is_active', true)
            ->with(['media', 'products' => fn ($query) => $query
                ->where('is_active', true)
                ->whereIn('order_type', [$orderType->value, OrderType::Both->value])
                ->orderBy('sort_order'), 'products.media'])
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (Category $category): bool => $category->products->isNotEmpty())
            ->map(fn (Category $category): array => array_filter([
                '@type' => 'MenuSection',
                'name' => $category->title,
                'image' => $category->getFirstMediaUrl('image', 'webp') ?: null,
                'hasMenuItem' => $category->products
                    ->map(fn (Product $product): array => $this->menuItemNode($product))
                    ->values()
                    ->all(),
            ]))
            ->values()
            ->all();

        if ($sections === []) {
            return null;
        }

        $url = $orderType === OrderType::Delivery
            ? route('menu.delivery')
            : route('menu.dine-in');

        return [
            '@type' => 'Menu',
            '@id' => $url.'#menu',
            'name' => config('app.name', 'Stone House').' menu',
            'url' => $url,
            'inLanguage' => 'en',
            'hasMenuSection' => $sections,
        ];
    }

    /**
     * One dish, priced at what a customer actually pays — the discounted price
     * when there is one, and the cheapest size when it is sold in several.
     *
     * @return array<string, mixed>
     */
    private function menuItemNode(Product $product): array
    {
        return array_filter([
            '@type' => 'MenuItem',
            'name' => $product->title,
            'description' => $product->description ?: $product->subtitle ?: null,
            'image' => $product->getFirstMediaUrl('image', 'webp') ?: null,
            'suitableForDiet' => $product->is_vegan ? 'https://schema.org/VeganDiet' : null,
            'offers' => [
                '@type' => 'Offer',
                'price' => number_format($this->leadPrice($product), 2, '.', ''),
                'priceCurrency' => 'USD',
                'availability' => 'https://schema.org/InStock',
                'availableAtOrFrom' => ['@id' => route('home').'#restaurant'],
            ],
        ], fn (mixed $value): bool => $value !== null);
    }

    /** What the dish costs at its cheapest, which is the figure a menu quotes. */
    private function leadPrice(Product $product): float
    {
        $prices = [];

        foreach ($product->variants ?? [] as $variant) {
            if (! is_array($variant)) {
                continue;
            }

            $prices[] = (float) ($variant['discount_price'] ?? $variant['price'] ?? 0);
        }

        $prices = array_filter($prices, fn (float $price): bool => $price > 0);

        if ($prices !== []) {
            return min($prices);
        }

        return (float) ($product->discount_price ?? $product->price);
    }

    /**
     * The weekly schedule in schema.org's shape, skipping closed days. A
     * closing time at or before the opening time runs past midnight, which
     * schema.org writes as an hour past 24:00.
     *
     * @return list<array<string, string>>
     */
    private function openingHoursSpecification(): array
    {
        return array_values(collect($this->settings->storefrontOpeningHours())
            ->reject(fn (array $hours): bool => $hours['isClosed']
                || blank($hours['opensAt'])
                || blank($hours['closesAt']))
            ->map(fn (array $hours): array => [
                '@type' => 'OpeningHoursSpecification',
                'dayOfWeek' => 'https://schema.org/'.Weekday::from($hours['day'])->getLabel(),
                'opens' => $hours['opensAt'],
                'closes' => $this->closingTime($hours['opensAt'], $hours['closesAt']),
            ])
            ->all());
    }

    /**
     * A session that ends at or before it starts runs past midnight, and
     * schema.org says so with an hour past 24: open 18:00, close 02:00 is
     * written `26:00`. Left as `02:00` it reads as a shop that shuts sixteen
     * hours before it opens.
     */
    private function closingTime(string $opensAt, string $closesAt): string
    {
        if (strtotime($closesAt) > strtotime($opensAt)) {
            return $closesAt;
        }

        [$hour, $minute] = array_pad(explode(':', $closesAt), 2, '00');

        return ((int) $hour + 24).':'.$minute;
    }

    /**
     * The shop's profiles elsewhere, so search engines can tie them to this
     * business. A link pointing back at our own domain is dropped — a menu URL
     * pasted into the footer by mistake must never be published as a profile.
     *
     * @return list<string>
     */
    private function sameAs(): array
    {
        $host = parse_url(route('home'), PHP_URL_HOST);

        return array_values(collect($this->settings->usableSocialLinks())
            ->map(fn (array $link): string => $link['url'])
            ->filter(fn (string $url): bool => filter_var($url, FILTER_VALIDATE_URL) !== false
                && parse_url($url, PHP_URL_HOST) !== $host)
            ->unique()
            ->all());
    }

    /**
     * What a customer can do from here: send an order. It lands in WhatsApp,
     * which is where this shop actually takes them.
     *
     * @return list<array<string, mixed>>
     */
    private function orderAction(): array
    {
        if (! $this->settings->canReceiveOrders()) {
            return [];
        }

        $digits = preg_replace('/\D+/', '', (string) $this->settings->whatsapp_number);

        if (blank($digits)) {
            return [];
        }

        $message = rawurlencode('Hello Stone House, I would like to place an order');

        return [[
            '@type' => 'OrderAction',
            'target' => [
                '@type' => 'EntryPoint',
                'urlTemplate' => "https://wa.me/{$digits}?text={$message}",
                'inLanguage' => 'en',
                'actionPlatform' => [
                    'https://schema.org/DesktopWebPlatform',
                    'https://schema.org/MobileWebPlatform',
                ],
            ],
            'deliveryMethod' => ['https://purl.org/goodrelations/v1#DeliveryModeOwnFleet'],
        ]];
    }

    /**
     * A short signature of the menu's current state — how many rows there are
     * and when one last changed — used to key the cached menu schema.
     */
    private function menuFingerprint(): ?string
    {
        try {
            $stamp = collect(['categories', 'products'])
                ->map(fn (string $table): string => DB::table($table)->count()
                    .'|'.(string) DB::table($table)->max('updated_at'))
                ->implode('|');
        } catch (\Throwable) {
            // The menu tables aren't there yet — a fresh install mid-migration.
            // The graph simply goes out without a menu on it.
            return null;
        }

        return $stamp === '0||0|' ? null : md5($stamp);
    }

    /** When the menu last changed, in the format a sitemap's `lastmod` wants. */
    private function menuLastModified(): ?string
    {
        try {
            $latest = collect(['categories', 'products'])
                ->map(fn (string $table): ?string => DB::table($table)->max('updated_at'))
                ->filter()
                ->max();
        } catch (\Throwable) {
            return null;
        }

        return $latest === null ? null : now()->parse($latest)->toAtomString();
    }
}
