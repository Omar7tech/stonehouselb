<?php

namespace App\Support;

use App\Settings\GeneralSettings;

/**
 * Prices formatted in PHP, for the pages that cannot format their own.
 *
 * The storefront does this in the browser with `Intl`, which is the right place
 * for it — the price follows the customer's own settings and nothing has to be
 * rendered twice. The plain screens cannot: they run on televisions whose
 * JavaScript predates `Intl` by years, and their whole point is that they ask
 * nothing of the set they are shown on.
 *
 * The rules are the storefront's, kept in step deliberately: the same rounding
 * to the nearest 5,000 LBP, the same fallback to dollars when no rate is set,
 * the same choice of which currencies lead.
 */
class MenuPrice
{
    /** LBP is rounded to the nearest multiple of this, as in the browser. */
    private const LBP_STEP = 5000;

    private readonly bool $showUsd;

    private readonly bool $showLbp;

    private readonly ?float $rate;

    public function __construct(GeneralSettings $settings)
    {
        $display = $settings->resolvedPriceDisplay()->value;

        $this->rate = $settings->usableLbpRate();
        $this->showUsd = $display === 'usd' || $display === 'both';
        $this->showLbp = ($display === 'lbp' || $display === 'both') && $this->rate !== null;
    }

    /**
     * One amount as it should be read off a screen across the room — every
     * currency the shop quotes, separated by a middot.
     */
    public function format(float $usd): string
    {
        $parts = [];

        if ($this->showUsd) {
            $parts[] = '$'.number_format($usd, 2);
        }

        if ($this->showLbp && $this->rate !== null) {
            $lbp = round(($usd * $this->rate) / self::LBP_STEP) * self::LBP_STEP;
            $parts[] = number_format($lbp).' LBP';
        }

        // A shop quoting nothing at all still has to print something, or the
        // line reads as a dish given away free.
        return $parts === [] ? '$'.number_format($usd, 2) : implode(' · ', $parts);
    }
}
