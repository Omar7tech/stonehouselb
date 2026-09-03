/** Mirrors `App\Enums\ScreenOrientation` — how the set is hung. */
export type ScreenOrientation = 'landscape' | 'portrait';

/** Mirrors `App\Enums\ScreenLayout` — how a screen draws its pages. */
export type ScreenLayout =
    'board' | 'spotlight' | 'split' | 'showcase' | 'strip';

/** One screen in the shop, as the board page reads it. */
export type Screen = {
    /** The shop's own name for it, shown only where the logo is not. */
    name: string;
    orientation: ScreenOrientation;
    layout: ScreenLayout;
    /** How long one page holds before the next takes its place. */
    holdSeconds: number;
    showPrices: boolean;
    showLogo: boolean;
    /** Whether a code to open the menu on a phone is drawn in the corner. */
    showQr: boolean;
    /** Where that code points: the menu this screen is quoting. */
    menuUrl: string;
    /** How often the page fetches itself again, or null to leave it alone. */
    refreshMinutes: number | null;
};
