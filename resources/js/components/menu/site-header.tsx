import { Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';

import { StoneHouseLogo } from '@/components/stone-house-logo';

/**
 * Wordmark and the nav trigger, sitting straight on the stone wall. Nothing is
 * behind it: the backdrop's light pools in the middle of the page, so the wall
 * is already at its darkest up here and the orange reads cleanly against it.
 */
export function SiteHeader() {
    return (
        <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-6">
            <Link href="/" aria-label="Stone House — home">
                <StoneHouseLogo className="w-28 select-none sm:w-36" />
            </Link>

            <button
                type="button"
                aria-label="Open menu"
                className="-mr-1 rounded-lg p-1 text-primary transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <Menu className="size-9" strokeWidth={3} />
            </button>
        </header>
    );
}
