/** Mirrors `App\Enums\ScreenOrientation` — how the set is hung. */
export type ScreenOrientation = 'landscape' | 'portrait';

/** Mirrors `App\Enums\ScreenLayout` — how a screen draws its pages. */
export type ScreenLayout =
    'board' | 'spotlight' | 'split' | 'showcase' | 'strip' | 'picks';

/**
 * The layouts that turn pages: everything but the hand-picked board, which
 * shows its own list, all at once, and never moves.
 */
export type DeckLayout = Exclude<ScreenLayout, 'picks'>;

/**
 * Mirrors `App\Enums\ScreenLabelStyle` — how a hand-picked tile sets its name
 * and price on the photograph.
 */
export type ScreenLabelStyle = 'notch' | 'pill' | 'band';

/** Mirrors `App\Enums\ScreenTone` — the sheet a hand-picked board is drawn on. */
export type ScreenTone = 'light' | 'dark';

/** Mirrors `App\Enums\ScreenTileCorners`. */
export type ScreenTileCorners = 'square' | 'soft' | 'round';

/** Mirrors `App\Enums\ScreenTileSpacing`. */
export type ScreenTileSpacing = 'tight' | 'regular' | 'airy';

/** Mirrors `App\Enums\ScreenLabelSize`. */
export type ScreenLabelSize = 'small' | 'regular' | 'large';

/** One screen in the shop, as the board page reads it. */
export type Screen = {
    /** The shop's own name for it, shown only where the logo is not. */
    name: string;
    orientation: ScreenOrientation;
    layout: ScreenLayout;
    /** How long one page holds before the next takes its place. */
    holdSeconds: number;
    showPrices: boolean;
    /** Whether a hand-picked tile names its dish. Read by that layout only. */
    showNames: boolean;
    /** How a hand-picked tile draws its label. Read by that layout only. */
    labelStyle: ScreenLabelStyle;
    /**
     * The rest of a hand-picked board's dress: a line across the top, the
     * sheet it is drawn on, and how its photographs and labels are cut. Read
     * by that layout only.
     */
    heading: string | null;
    tone: ScreenTone;
    tileCorners: ScreenTileCorners;
    tileSpacing: ScreenTileSpacing;
    labelSize: ScreenLabelSize;
    /** Whether the favourite, spicy and vegan marks are drawn on a tile. */
    showMarks: boolean;
    showLogo: boolean;
    /** Whether a code to open the menu on a phone is drawn in the corner. */
    showQr: boolean;
    /** Where that code points: the menu this screen is quoting. */
    menuUrl: string;
    /** How often the page fetches itself again, or null to leave it alone. */
    refreshMinutes: number | null;
};
