{{--
    The page in plain HTML, for whoever reads it before running its JavaScript.

    Everything a customer sees is painted by React, so the raw document a
    crawler fetches is otherwise an empty div. This block puts the same
    headings, dishes and prices into that document — inside `<noscript>`, so it
    is never drawn on top of the real page — and gives the first indexing pass
    something to read.

    @see App\Support\Seo::menuOutline()
--}}
@php
    $crawlRoute = request()->route()?->getName();
    $crawlSeo = app(\App\Support\Seo::class);
    // An error page is about a status rather than about the shop, and is
    // never a search result: it names itself from the status it carries.
    $crawlMeta = ($page['component'] ?? null) === 'error'
        ? $crawlSeo->errorMeta((int) ($page['props']['status'] ?? 500))
        : $crawlSeo->meta($crawlRoute);
    $crawlSettings = app(\App\Settings\GeneralSettings::class);
    // Only on the pages that actually show the menu: the outline stands in for
    // what React would have painted, so it must not claim more than the page does.
    $crawlMenu = $crawlSeo->isMenuRoute($crawlRoute) ? $crawlSeo->menuOutline($crawlRoute) : [];
@endphp

@if ($crawlMeta['indexable'])
    <noscript>
        <h1>{{ $crawlMeta['title'] }}</h1>
        <p>{{ $crawlMeta['description'] }}</p>

        <h2>Where we are</h2>
        <p>
            @if ($street = $crawlSettings->street_address){{ $street }}, @endif
            @if ($locality = $crawlSettings->address_locality){{ $locality }}, @endif
            @if ($region = $crawlSettings->address_region){{ $region }}, @endif
            Lebanon.

            @if ($phone = $crawlSettings->usablePhoneNumber())
                Call <a href="tel:{{ $phone }}">{{ $phone }}</a>.
            @endif

            @if ($map = $crawlSettings->usableLocationUrl())
                <a href="{{ $map }}" rel="noreferrer">See us on the map</a>.
            @endif
        </p>

        @if ($hours = $crawlSettings->storefrontOpeningHours())
            <h2>Opening hours</h2>
            <ul>
                @foreach ($hours as $day)
                    <li>
                        {{ \App\Enums\Weekday::from($day['day'])->getLabel() }}:
                        {{ $day['isClosed'] || blank($day['opensAt']) ? 'Closed' : $day['opensAt'].' – '.$day['closesAt'] }}
                    </li>
                @endforeach
            </ul>
        @endif

        <h2>Pages</h2>
        <ul>
            <li><a href="{{ route('home') }}">Home</a></li>
            <li><a href="{{ route('menu.dine-in') }}">Dine-in menu</a></li>
            @if ($crawlSettings->online_ordering_active)
                <li><a href="{{ route('menu.delivery') }}">Delivery menu</a></li>
            @endif
        </ul>

        @if ($crawlMenu !== [])
            <h2>Menu</h2>
            @foreach ($crawlMenu as $section)
                <h3>{{ $section['name'] }}</h3>
                <ul>
                    @foreach ($section['items'] as $item)
                        <li>{{ $item['name'] }}@if ($item['price'] !== null) — ${{ $item['price'] }}@endif</li>
                    @endforeach
                </ul>
            @endforeach
        @endif
    </noscript>
@endif
