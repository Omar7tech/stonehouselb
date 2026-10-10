<?php

namespace App\Filament\Resources\DisplayScreens\Pages;

use App\Filament\Resources\DisplayScreens\DisplayScreenResource;
use App\Models\DisplayScreen;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
use Filament\Support\Icons\Heroicon;

class EditDisplayScreen extends EditRecord
{
    protected static string $resource = DisplayScreenResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // Beside the form, because the next thing anybody does after
            // changing a board is go and look at it.
            Action::make('open')
                ->label('Open screen')
                ->icon(Heroicon::OutlinedArrowTopRightOnSquare)
                ->color('gray')
                ->url(fn (DisplayScreen $record): string => route('screen.show', $record))
                ->openUrlInNewTab(),

            DeleteAction::make(),
        ];
    }
}
