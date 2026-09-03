{{--
    The error page of last resort.

    Everything a customer normally sees is drawn by the app, and the app is
    exactly what is unavailable on the two pages that use this layout: a 503 is
    served while the site is down for maintenance, with the framework bypassed
    entirely, and the Blade 500 is what is left when even the error page could
    not be rendered.

    So this file assumes nothing. No bundle, no webfont, no shared props, no
    database — one SVG from `public/`, some inline CSS, and the brand's own
    colours written out by hand. If it cannot render, nothing can.
--}}
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $heading }} — {{ config('app.name', 'Stone House') }}</title>

    <link rel="icon" type="image/svg+xml" href="/favicon.svg">

    <style>
        :root {
            color-scheme: dark;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1.5rem;
            box-sizing: border-box;
            background: #131313;
            color: #f5f5f5;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
            /* The wall, cheaply: two soft pools of light on dark stone, which
               is the same read as the app's own backdrop without its machinery. */
            background-image:
                radial-gradient(60rem 40rem at 50% -10%, rgba(249, 159, 62, 0.16), transparent 70%),
                radial-gradient(40rem 30rem at 50% 110%, rgba(249, 159, 62, 0.08), transparent 70%);
        }

        .card {
            width: 100%;
            max-width: 34rem;
            padding: 2.5rem;
            border-radius: 2rem;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            text-align: center;
        }

        .logo {
            width: 11rem;
            max-width: 60%;
            height: auto;
        }

        .status {
            display: inline-block;
            margin: 1.75rem 0 0;
            padding: 0.35rem 0.9rem;
            border-radius: 999px;
            background: #f99f3e;
            color: #131313;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
        }

        h1 {
            margin: 1rem 0 0;
            font-size: clamp(1.6rem, 6vw, 2.4rem);
            line-height: 1.05;
            letter-spacing: 0.02em;
            text-transform: uppercase;
        }

        p {
            margin: 0.9rem 0 0;
            font-size: 1rem;
            line-height: 1.6;
            color: rgba(245, 245, 245, 0.65);
        }

        a.button {
            display: inline-block;
            margin-top: 1.75rem;
            padding: 0.95rem 1.75rem;
            border-radius: 999px;
            background: #f99f3e;
            color: #131313;
            font-size: 0.85rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            text-decoration: none;
        }

        a.button:hover {
            background: #ffb055;
        }
    </style>
</head>

<body>
    <main class="card">
        <img class="logo" src="/logos/logo.svg" alt="{{ config('app.name', 'Stone House') }}">

        <span class="status">Error {{ $status }}</span>

        <h1>{{ $heading }}</h1>
        <p>{{ $body }}</p>

        <a class="button" href="{{ url('/') }}">Back to the start</a>
    </main>
</body>

</html>
