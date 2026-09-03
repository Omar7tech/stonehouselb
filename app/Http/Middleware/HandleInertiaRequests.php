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
            // The strip across the top of the storefront. One resolved line
            // rather than the settings behind it: which line today gets is the
            // server's answer, and the client has no business recomputing it.
            'banner' => $settings->usableBannerText(),
            // The open/closed state, plus everything the storefront needs to
            // work it out again itself: on the automatic schedule the client
            // re-checks as the clock runs, so a shop that opens while the menu
            // is on screen does not need a reload to say so.
            'shop' => [
                'isOpen' => $settings->isCurrentlyOpen(),
                'statusMode' => $settings->status_mode->value,
                'isManuallyOpen' => $settings->is_open,
                'openingHours' => $settings->storefrontOpeningHours(),
            ],
            'pricing' => [
                'display' => $settings->resolvedPriceDisplay()->value,
                'lbpRate' => $settings->usableLbpRate(),
                'deliveryFeeUsd' => $settings->deliveryFeeUsd(),
            ],
            // How the landing view draws its category boxes. A look only, but
            // shared everywhere so the menu never has to ask for it.
            'categoryLayout' => $settings->category_layout->value,
            // How one product is drawn in an open category.
            'productCardStyle' => $settings->product_card_style->value,
            // How a product's sizes are offered, wherever the picker appears.
            'variantStyle' => $settings->variant_style->value,
            // Null closes checkout: an order with nowhere to go is worse than
            // no checkout button at all.
            'whatsappNumber' => $settings->canReceiveOrders()
                ? $settings->whatsapp_number
                : null,
            // Where to find the shop once you are off the menu. Empty simply
            // leaves the footer's list out.
            'socialLinks' => $settings->usableSocialLinks(),
            // The map link behind the footer's location button. Null leaves
            // the button out.
            'locationUrl' => $settings->usableLocationUrl(),
            // What the customer has to provide before an order can be sent.
            'checkout' => [
                'requireFullName' => $settings->require_full_name,
                'requirePhoneNumber' => $settings->require_phone_number,
                'getClientLocation' => $settings->get_client_location,
            ],
        ];
    }
}
