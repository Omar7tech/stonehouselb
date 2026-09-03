{{--
    Maintenance mode: `php artisan down`.

    The framework never boots far enough to render an Inertia page here, so the
    branded error page cannot be used. This is the plain one.
--}}
@include('errors.layout', [
    'status' => 503,
    'heading' => 'Back in a moment',
    'body' => 'The site is closed for a short while — a clean-down, nothing more. It will be open again shortly.',
])
