<?php

namespace App\Http\Middleware;

use App\Settings\GeneralSettings;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $settings = app(GeneralSettings::class);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'pricing' => [
                'display' => $settings->resolvedPriceDisplay()->value,
                'lbpRate' => $settings->usableLbpRate(),
                'deliveryFeeUsd' => $settings->deliveryFeeUsd(),
            ],
            // Null closes checkout: an order with nowhere to go is worse than
            // no checkout button at all.
            'whatsappNumber' => $settings->canReceiveOrders()
                ? $settings->whatsapp_number
                : null,
            // What the customer has to provide before an order can be sent.
            'checkout' => [
                'requireFullName' => $settings->require_full_name,
                'requirePhoneNumber' => $settings->require_phone_number,
                'getClientLocation' => $settings->get_client_location,
            ],
        ];
    }
}
