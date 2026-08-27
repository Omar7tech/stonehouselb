<?php

namespace App\Enums;

use BackedEnum;
use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasIcon;
use Filament\Support\Contracts\HasLabel;
use Filament\Support\Icons\Heroicon;

enum OrderType: string implements HasColor, HasIcon, HasLabel
{
    case DineIn = 'dine_in';
    case Delivery = 'delivery';

    /**
     * Only a product carries this — it is offered on both menus. A menu page
     * is always rendered for one of the two real order types.
     */
    case Both = 'both';

    public function getLabel(): string
    {
        return match ($this) {
            self::DineIn => 'Dine In',
            self::Delivery => 'Delivery',
            self::Both => 'Both',
        };
    }

    public function getColor(): string
    {
        return match ($this) {
            self::DineIn => 'info',
            self::Delivery => 'warning',
            self::Both => 'success',
        };
    }

    public function getIcon(): BackedEnum
    {
        return match ($this) {
            self::DineIn => Heroicon::BuildingStorefront,
            self::Delivery => Heroicon::Truck,
            self::Both => Heroicon::Squares2x2,
        };
    }
}
