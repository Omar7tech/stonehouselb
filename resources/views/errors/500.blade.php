{{--
    The last resort.

    In normal service a 500 is drawn as the storefront by the Inertia error
    page. This is what is served when even that could not be rendered — a
    missing build, a broken shared prop, a database that is not answering.
--}}
@include('errors.layout', [
    'status' => 500,
    'heading' => 'Something burned',
    'body' => 'Something went wrong on our end, and it is being looked at. Try again in a moment.',
])
