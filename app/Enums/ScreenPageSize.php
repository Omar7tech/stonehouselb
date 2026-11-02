<?php

namespace App\Enums;

use Filament\Support\Contracts\HasLabel;

/**
 * How many dishes the brick board sets on one page. Fewer makes each of them
 * larger; a list longer than this simply carries on onto the next page.
 */
enum ScreenPageSize: int implements HasLabel
{
    case Six = 6;
    case Four = 4;
    case Two = 2;

    public function getLabel(): string
    {
        return $this->value.' dishes';
    }
}
