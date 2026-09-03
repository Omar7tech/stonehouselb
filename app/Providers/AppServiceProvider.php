<?php

namespace App\Providers;

use App\Support\Seo;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureCanonicalUrls();
        $this->configureErrorPages();
    }

    /**
     * Draw the error pages as the storefront rather than as Laravel.
     *
     * A customer who mistypes a URL, or arrives on a link from a year ago,
     * should land somewhere that looks like the shop and offers them the menu —
     * not on a white page with a number on it. So the statuses a customer can
     * actually meet are rendered as the `error` page component, with the shared
     * props the rest of the storefront gets, which is what lets it draw the
     * same header, footer and shop status as every other page.
     *
     * A 500 with debug on is left to Laravel: while developing, the stack trace
     * is the whole point, and a pretty page in front of it helps nobody.
     */
    protected function configureErrorPages(): void
    {
        Inertia::handleExceptionsUsing(function (ExceptionResponse $response) {
            $status = $response->statusCode();

            // 503 is deliberately not here. It is the status the app itself
            // is down for — maintenance mode renders `errors/503.blade.php`
            // with the framework bypassed entirely — so it is drawn by the
            // plain branded page instead, and drawn the same way whatever the
            // cause.
            if (! in_array($status, [403, 404, 419, 429, 500], true)) {
                return null;
            }

            if ($status >= 500 && config('app.debug')) {
                return null;
            }

            return $response->render('error', [
                'status' => $status,
                // The tab's title is resolved where every other page's title is
                // resolved, so an error page names itself the same way in the
                // tab, in the history, and in a bookmark.
                'title' => app(Seo::class)->errorMeta($status)['title'],
            ])->withSharedData();
        });
    }

    /**
     * Pin every generated URL to the configured domain.
     *
     * By default Laravel builds `route()` and `asset()` URLs from the host the
     * request arrived on, so the same page reached over `www.`, over plain
     * `http://`, or through a preview hostname hands back a different absolute
     * URL each time - and with it a different Open Graph image, a different
     * schema.org id, and a second copy of the site for Google to rank against
     * the first. Rooting them at `APP_URL` leaves exactly one.
     */
    protected function configureCanonicalUrls(): void
    {
        $url = (string) config('app.url');

        if (blank($url) || app()->runningInConsole()) {
            return;
        }

        URL::forceRootUrl($url);

        if (str_starts_with($url, 'https://')) {
            URL::forceScheme('https');
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
