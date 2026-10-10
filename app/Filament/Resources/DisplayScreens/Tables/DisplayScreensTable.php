<?php

namespace App\Filament\Resources\DisplayScreens\Tables;

use App\Enums\ScreenLayout;
use App\Enums\SimpleScreenStyle;
use App\Models\DisplayScreen;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class DisplayScreensTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->reorderable('sort_order')
            ->defaultSort('sort_order')
            ->columns([
                TextColumn::make('name')
                    ->label('Screen')
                    // The address under the name, because that is the thing
                    // somebody came to this page to copy into a television.
                    ->description(fn (DisplayScreen $record): string => route('screen.show', $record))
                    ->searchable()
                    ->sortable(),

                TextColumn::make('layout')
                    ->label('Layout')
                    ->badge(),

                TextColumn::make('orientation')
                    ->label('Hung')
                    ->badge(),

                TextColumn::make('categories_count')
                    ->label('Shows')
                    ->counts('categories')
                    ->formatStateUsing(fn (int $state, DisplayScreen $record): string => match (true) {
                        // A hand-picked screen runs no categories at all, so
                        // counting them would call it the whole menu.
                        $record->layout === ScreenLayout::Picks => $record->products()->count().' chosen',
                        $state === 0 => 'Whole menu',
                        $state === 1 => '1 category',
                        default => $state.' categories',
                    })
                    ->badge()
                    ->color('gray'),

                TextColumn::make('rotation_seconds')
                    ->label('Page hold')
                    ->suffix('s')
                    ->sortable()
                    ->toggleable(),

                ToggleColumn::make('is_active')
                    ->label('Live')
                    ->sortable(),
            ])
            ->filters([
                TernaryFilter::make('is_active')->label('Live'),
            ])
            ->recordActions([
                // The one thing anybody opens this page to do: see the board.
                Action::make('open')
                    ->label('Open')
                    ->icon(Heroicon::OutlinedArrowTopRightOnSquare)
                    ->url(fn (DisplayScreen $record): string => route('screen.show', $record))
                    ->openUrlInNewTab(),

                // The plain boards, for a set whose browser cannot run the
                // other one. Grouped, because most shops will never need them.
                ActionGroup::make(array_map(
                    fn (SimpleScreenStyle $style): Action => Action::make('simple_'.$style->value)
                        ->label($style->getLabel())
                        ->icon($style->getIcon())
                        ->url(fn (DisplayScreen $record): string => route('screen.show', $record).'?simple='.$style->value)
                        ->openUrlInNewTab(),
                    SimpleScreenStyle::cases(),
                ))
                    ->label('Older TV')
                    ->icon(Heroicon::OutlinedTv)
                    ->button()
                    ->color('gray'),

                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->emptyStateHeading('No screens yet')
            ->emptyStateDescription('A screen is a menu board with an address of its own: create one, open that address on the television or tablet, and leave it there.');
    }
}
