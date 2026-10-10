<?php

namespace App\Filament\Resources\DisplayScreens\Tables;

use App\Enums\ScreenLayout;
use App\Enums\SimpleScreenStyle;
use App\Models\DisplayScreen;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ReplicateAction;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Support\Js;

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
                    ->badge()
                    ->toggleable(),

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
                    // A hand-picked board holds one page for ever, so a number
                    // of seconds against it would be a setting it ignores.
                    ->formatStateUsing(fn (int $state, DisplayScreen $record): string => $record->layout === ScreenLayout::Picks
                        ? 'Still'
                        : $state.'s')
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

                EditAction::make(),

                // Everything done once in a while, kept off the row so the two
                // things done every day are the only two buttons on it.
                ActionGroup::make([
                    // Copied in the browser, with no trip to the server: the
                    // address is what gets typed into the set, and reading it
                    // off the row and across a room is where the typos start.
                    Action::make('copyAddress')
                        ->label('Copy address')
                        ->icon(Heroicon::OutlinedClipboardDocument)
                        ->alpineClickHandler(fn (DisplayScreen $record): string => 'window.navigator.clipboard.writeText('
                            .Js::from(route('screen.show', $record))
                            .'); $tooltip('.Js::from('Address copied').', { timeout: 1500 }); close()'),

                    // A second set that should show what the first one does is
                    // the commonest reason to make a screen at all.
                    ReplicateAction::make()
                        ->label('Duplicate')
                        ->icon(Heroicon::OutlinedDocumentDuplicate)
                        ->excludeAttributes(['slug', 'categories_count'])
                        ->beforeReplicaSaved(function (DisplayScreen $replica): void {
                            $replica->name .= ' copy';
                        })
                        ->afterReplicaSaved(function (DisplayScreen $record, DisplayScreen $replica): void {
                            $replica->categories()->sync(self::inOrder($record->categories()->pluck('categories.id')->all()));
                            $replica->products()->sync(self::inOrder($record->products()->pluck('products.id')->all()));
                        })
                        ->successNotificationTitle('Screen duplicated'),

                    // The plain boards, for a set whose browser cannot run the
                    // other one. Most shops will never need them.
                    ActionGroup::make(array_map(
                        fn (SimpleScreenStyle $style): Action => Action::make('simple_'.$style->value)
                            ->label('Older TV — '.$style->getLabel())
                            ->icon($style->getIcon())
                            ->url(fn (DisplayScreen $record): string => route('screen.show', $record).'?simple='.$style->value)
                            ->openUrlInNewTab()
                            ->hidden(fn (DisplayScreen $record): bool => $record->layout === ScreenLayout::Picks),
                        SimpleScreenStyle::cases(),
                    ))->dropdown(false),

                    DeleteAction::make(),
                ]),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->emptyStateHeading('No screens yet')
            ->emptyStateDescription('A screen is a menu board with an address of its own: create one, open that address on the television or tablet, and leave it there.');
    }

    /**
     * A list of ids as a sync payload that keeps the order they came in.
     *
     * @param  array<int, mixed>  $ids
     * @return array<int, array{sort_order: int}>
     */
    private static function inOrder(array $ids): array
    {
        $payload = [];

        foreach (array_values($ids) as $position => $id) {
            if (is_numeric($id)) {
                $payload[(int) $id] = ['sort_order' => $position];
            }
        }

        return $payload;
    }
}
