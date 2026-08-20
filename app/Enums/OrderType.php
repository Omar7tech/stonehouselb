<?php

namespace App\Enums;

enum OrderType: string
{
    case DineIn = 'dine_in';
    case Delivery = 'delivery';

    public function getLabel(): string
    {
        return match ($this) {
            self::DineIn => 'Dine In',
            self::Delivery => 'Delivery',
        };
    }
}
