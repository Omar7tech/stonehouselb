<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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
