{{--
    The head a crawler reads.

    The storefront is an Inertia app with no SSR, so React never runs for a bot
    that does not execute JavaScript — everything below is resolved on the
    server from the current route and printed before the app boots.

    @see App\Support\Seo
--}}
@php
    $seoRoute = request()->route()?->getName();
    $seo = app(\App\Support\Seo::class);
    $meta = $seo->meta($seoRoute);
    $settings = app(\App\Settings\GeneralSettings::class);
    $coordinates = $settings->usableCoordinates();
    $graph = $seo->structuredData($seoRoute);
@endphp

{{-- The title lives in the Inertia head slot in the root template, so the app
     can retitle the tab on a client-side visit without leaving a second one. --}}
<meta name="description" content="{{ $meta['description'] }}">
@if (filled($meta['keywords']))
    <meta name="keywords" content="{{ $meta['keywords'] }}">
@endif
<meta name="robots" content="{{ $meta['robots'] }}">
<meta name="googlebot" content="{{ $meta['robots'] }}">
<meta name="author" content="{{ config('app.name') }}">
<link rel="canonical" href="{{ $meta['url'] }}">

{{-- Local search: where the shop is, for the crawlers that read it off the page
     rather than out of the graph below. Printed only once the shop has said. --}}
@if ($locality = $settings->address_locality)
    <meta name="geo.placename" content="{{ $locality }}, Lebanon">
@endif
@if ($coordinates !== null)
    <meta name="geo.position" content="{{ $coordinates['latitude'] }};{{ $coordinates['longitude'] }}">
    <meta name="ICBM" content="{{ $coordinates['latitude'] }}, {{ $coordinates['longitude'] }}">
    <meta property="place:location:latitude" content="{{ $coordinates['latitude'] }}">
    <meta property="place:location:longitude" content="{{ $coordinates['longitude'] }}">
@endif
@if ($locality)
    <meta property="business:contact_data:locality" content="{{ $locality }}">
@endif
@if ($region = $settings->address_region)
    <meta property="business:contact_data:region" content="{{ $region }}">
@endif
<meta property="business:contact_data:country_name" content="Lebanon">
@if ($phone = $settings->usablePhoneNumber())
    <meta property="business:contact_data:phone_number" content="{{ $phone }}">
@endif

{{-- Open Graph: what WhatsApp, Facebook and Instagram show when the link is
     shared. WhatsApp is where most of these links actually travel, which is why
     the image is declared with its dimensions — it renders the card from them
     before the photograph has finished downloading. --}}
<meta property="og:type" content="{{ $meta['type'] }}">
<meta property="og:site_name" content="{{ config('app.name') }}">
<meta property="og:title" content="{{ $meta['title'] }}">
<meta property="og:description" content="{{ $meta['description'] }}">
<meta property="og:url" content="{{ $meta['url'] }}">
<meta property="og:image" content="{{ $meta['image'] }}">
<meta property="og:image:secure_url" content="{{ $meta['image'] }}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="{{ $meta['imageWidth'] }}">
<meta property="og:image:height" content="{{ $meta['imageHeight'] }}">
<meta property="og:image:alt" content="{{ $meta['imageAlt'] }}">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="ar_LB">

{{-- Twitter / X --}}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ $meta['title'] }}">
<meta name="twitter:description" content="{{ $meta['description'] }}">
<meta name="twitter:image" content="{{ $meta['image'] }}">
<meta name="twitter:image:alt" content="{{ $meta['imageAlt'] }}">

{{-- The schema.org graph: the restaurant, the site, this page, its breadcrumb,
     and — on the menu pages — every dish with its price. --}}
@if ($graph !== null)
    <script type="application/ld+json">
{!! json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
    </script>
@endif
