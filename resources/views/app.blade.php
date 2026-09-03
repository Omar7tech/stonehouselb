<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    @include('partials.seo')

    <link rel="icon" type="image/png" href="/favicon-96x96.png?v=20260819" sizes="96x96" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20260819" />
    <link rel="shortcut icon" href="/favicon.ico?v=20260819" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20260819" />
    <meta name="apple-mobile-web-app-title" content="Stone House" />
    <link rel="manifest" href="/site.webmanifest?v=20260819" />

    {{-- The visitor's own theme, put on the document before anything is drawn.
         It is inline and ahead of the stylesheet on purpose: read from the
         bundle instead and everyone who chose the dark sheet gets a white page
         flashed at them first. Light needs nothing, being what the stylesheet
         already is. --}}
    <script>
        try {
            if (localStorage.getItem('stone-house-theme') === 'dark') {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
            }
        } catch (error) {
            // Storage can be off or walled up. The light sheet is the default
            // anyway, so there is nothing to recover from.
        }
    </script>

    @fonts

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    {{-- The one title, resolved on the server so a crawler and a customer are
         told the same thing. The app rewrites it on a client-side visit from
         the same copy, shared as `seo` — the two cannot drift apart. --}}
    <x-inertia::head>
        <title>{{ app(\App\Support\Seo::class)->meta(request()->route()?->getName())['title'] }}</title>
    </x-inertia::head>
</head>

<body class="font-sans antialiased">
    @include('partials.crawlable')

    <x-inertia::app />
</body>

</html>
