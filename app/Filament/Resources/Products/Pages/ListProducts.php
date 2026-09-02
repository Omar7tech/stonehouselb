<?php

namespace App\Filament\Resources\Products\Pages;

use App\Filament\Resources\Products\ProductResource;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Icons\Heroicon;

class ListProducts extends ListRecords
{
    protected static string $resource = ProductResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // The paper menu, set from these same rows. It opens in its own tab
            // rather than replacing the admin: printing is a detour, and
            // whoever is doing it is usually halfway through editing something.
            Action::make('printMenu')
                ->label('Print menu')
                ->icon(Heroicon::OutlinedPrinter)
                ->color('gray')
                ->url(fn (): string => route('menu.print'), shouldOpenInNewTab: true),

            CreateAction::make(),
        ];
    }
}
