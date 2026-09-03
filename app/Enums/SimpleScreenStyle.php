<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasDescription;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

/**
 * The plain-HTML boards, for televisions whose browser is a decade old.
 *
 * These are served instead of the React screen when a board is asked for with
 * `?simple=`, and they share one rule: no bundle, no webfont, no flexbox, no
 * grid, no `Intl`, and nothing newer than ES5. A 2013 smart television renders
 * them or it renders nothing at all.
 *
 * Three of them, because the sets they run on differ as much as the menus do:
 * a still page cannot fail, a cycling one holds a long menu on a small screen,
 * and a crawling one clears a menu too long for either.
 */
enum SimpleScreenStyle: string implements HasDescription, HasIcon, HasLabel
{
    /** Everything at once, drawn once, never touched again. */
    case Still = 'still';

    /** One page at a time, swapped by a timer. */
    case Cycle = 'cycle';

    /** The whole menu crawling upwards, forever. */
    case Crawl = 'crawl';

    public function getLabel(): string
    {
        return match ($this) {
            self::Still => 'Still',
            self::Cycle => 'Cycle',
            self::Crawl => 'Crawl',
        };
    }

    public function getDescription(): string
    {
        return match ($this) {
            self::Still => 'The whole menu printed once, with no movement at all. Nothing to go wrong.',
            self::Cycle => 'One category at a time, changed on a timer. For a menu too long to print at a readable size.',
            self::Crawl => 'The menu crawling slowly up the screen, over and over. For a very long menu on one screen.',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::Still => Heroicon::OutlinedDocumentText,
            self::Cycle => Heroicon::OutlinedArrowPath,
            self::Crawl => Heroicon::OutlinedBarsArrowUp,
        };
    }

    /**
     * The Blade view drawing this style.
     *
     * @return view-string
     */
    public function view(): string
    {
        return match ($this) {
            self::Still => 'screens.still',
            self::Cycle => 'screens.cycle',
            self::Crawl => 'screens.crawl',
        };
    }
}
