<?php

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;

/** A route that fails on purpose, for the statuses no real page produces. */
function failingRoute(int $status): string
{
    Route::middleware('web')->get("/__test/abort/{$status}", fn () => abort($status));

    return "/__test/abort/{$status}";
}

it('draws a missing page as the storefront', function (): void {
    $this->get('/there-is-no-such-page')
        ->assertNotFound()
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('error')
            ->where('status', 404)
            ->where('title', 'Page not found — Stone House')
            // The shared props are what let it draw the same header, footer and
            // shop status as every other page.
            ->has('shop')
            ->has('socialLinks')
        );
});

it('keeps the status on the response, so a crawler is told the truth', function (int $status): void {
    $this->get(failingRoute($status))
        ->assertStatus($status)
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('error')
            ->where('status', $status)
        );
})->with([403, 404, 429]);

it('names each status the way the shop would say it', function (int $status, string $title): void {
    $this->get(failingRoute($status))
        ->assertStatus($status)
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('title', $title)
        );
})->with([
    [403, 'Staff only — Stone House'],
    [404, 'Page not found — Stone House'],
    [429, 'One moment — Stone House'],
]);

it('serves the plain branded page for a 503, whatever put the app down', function (): void {
    $html = $this->get(failingRoute(503))->assertStatus(503)->getContent();

    expect($html)
        ->toContain('Back in a moment')
        ->toContain('/logos/logo.svg')
        // The same page maintenance mode serves, so a deploy and an overloaded
        // server look identical to a customer rather than like two faults.
        ->not->toContain('data-page');
});

it('draws a server error as the storefront once debug is off', function (): void {
    config(['app.debug' => false]);

    Route::middleware('web')->get('/__test/boom', function (): never {
        throw new RuntimeException('The fryer.');
    });

    $this->get('/__test/boom')
        ->assertStatus(500)
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->component('error')
            ->where('status', 500)
            ->where('title', 'Something went wrong — Stone House')
        );
});

it('leaves a server error to Laravel while debug is on', function (): void {
    config(['app.debug' => true]);

    Route::middleware('web')->get('/__test/boom-debug', function (): never {
        throw new RuntimeException('The fryer.');
    });

    // The stack trace is the whole point while developing; a pretty page in
    // front of it helps nobody.
    $this->get('/__test/boom-debug')
        ->assertStatus(500)
        ->assertDontSee('"component":"error"', escape: false);
});

it('keeps an error page out of search', function (): void {
    $html = $this->get('/there-is-no-such-page')->assertNotFound()->getContent();

    expect($html)
        ->toContain('<meta name="robots" content="noindex, nofollow">')
        ->toContain('<title>Page not found — Stone House</title>')
        // A 404 carrying the restaurant graph is a 404 that gets indexed as the
        // restaurant, which is how a soft 404 happens.
        ->not->toContain('application/ld+json')
        ->not->toContain('<noscript>');
});

it('leaves the sitemap and robots answering while a page 404s', function (): void {
    $this->get('/there-is-no-such-page')->assertNotFound();

    $this->get('/robots.txt')->assertOk();
    $this->get('/sitemap.xml')->assertOk();
});

describe('the plain pages, for when even the error page cannot be drawn', function (): void {
    it('renders without the app, the bundle or the database', function (string $view, string $heading): void {
        $html = view($view)->render();

        expect($html)
            ->toContain($heading)
            ->toContain('/logos/logo.svg')
            ->toContain('noindex')
            // No bundle, no shared props: that is the entire point of them.
            ->not->toContain('data-page')
            ->not->toContain('/build/assets');
    })->with([
        ['errors.503', 'Back in a moment'],
        ['errors.500', 'Something burned'],
    ]);
});
