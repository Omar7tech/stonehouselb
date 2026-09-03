import { usePage } from '@inertiajs/react';

/**
 * The shop's one line, across the top of the storefront above everything else.
 *
 * The line arrives already chosen — a fixed sentence, or the one behind today
 * on the weekly schedule — so there is nothing here to decide. Null is a shop
 * with nothing to say, and draws no strip at all rather than an empty band of
 * orange above the logo.
 */
export function SiteBanner() {
    const { banner } = usePage().props;

    if (!banner) {
        return null;
    }

    return (
        // Full width of the window, like the footer's slab: it is the top edge
        // of the page rather than something sitting inside the menu's column.
        <div className="bg-primary text-primary-foreground">
            <p className="mx-auto max-w-2xl px-5 py-2 text-center text-[0.7rem] leading-relaxed font-semibold tracking-[0.14em] uppercase lg:max-w-5xl xl:max-w-6xl">
                {banner}
            </p>
        </div>
    );
}
