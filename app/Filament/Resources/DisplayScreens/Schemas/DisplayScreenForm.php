<?php

namespace App\Filament\Resources\DisplayScreens\Schemas;

use App\Enums\OrderType;
use App\Enums\ScreenLayout;
use App\Enums\ScreenOrientation;
use App\Enums\SimpleScreenStyle;
use App\Models\Category;
use App\Models\DisplayScreen;
use App\Models\Product;
use Filament\Forms\Components\Radio;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Text;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Relations\Relation;

class DisplayScreenForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('The screen')
                    ->description('Name it after where it hangs — the name becomes its address, and that address is what you type into the set once.')
                    ->columnSpanFull()
                    ->columns(2)
                    ->components([
                        TextInput::make('name')
                            ->label('Name')
                            ->required()
                            ->maxLength(80)
                            ->live(onBlur: true)
                            ->helperText('For example "Counter TV" or "Window tablet".'),

                        Radio::make('order_type')
                            ->label('Which menu it quotes')
                            ->options([
                                OrderType::DineIn->value => OrderType::DineIn->getLabel(),
                                OrderType::Delivery->value => OrderType::Delivery->getLabel(),
                            ])
                            ->descriptions([
                                OrderType::DineIn->value => 'What can be eaten in. The usual choice for a screen in the room.',
                                OrderType::Delivery->value => 'What can be sent out. For a screen at the takeaway hatch.',
                            ])
                            ->default(OrderType::DineIn->value)
                            ->required(),

                        Select::make('categories')
                            ->label('Categories to show')
                            ->relationship('categories', 'title')
                            ->multiple()
                            ->preload()
                            ->placeholder('The whole menu')
                            ->helperText('Leave empty and the screen shows every category, in the menu\'s own order. Choose some and it shows only those, in the order you pick them.')
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get))
                            ->columnSpanFull(),

                        // Not `->relationship()`: that syncs the ids and
                        // forgets the order they were picked in, and on this
                        // board the order is the layout.
                        Select::make('products')
                            ->label('Dishes to show')
                            ->multiple()
                            ->searchable()
                            ->options(fn (): array => self::productOptions())
                            ->placeholder('Choose the dishes for this screen')
                            ->helperText('The screen shows exactly these, in the order you pick them, all at once. Up to about twelve reads well from across a room; every one you add makes each of them smaller.')
                            ->visible(fn (Get $get): bool => self::isHandPicked($get))
                            ->dehydrated(false)
                            ->loadStateFromRelationshipsUsing(function (Select $component, DisplayScreen $record): void {
                                $component->state($record->products()->pluck('products.id')->all());
                            })
                            ->saveRelationshipsUsing(function (DisplayScreen $record, ?array $state): void {
                                $record->products()->sync(
                                    collect($state ?? [])
                                        ->values()
                                        ->mapWithKeys(fn (int|string $id, int $position): array => [
                                            (int) $id => ['sort_order' => $position],
                                        ])
                                        ->all(),
                                );
                            })
                            ->columnSpanFull(),

                        Toggle::make('is_active')
                            ->label('Live')
                            ->helperText('Turn off and the address stops answering, so a set left on in a back room cannot go on quoting old prices.')
                            ->default(true)
                            ->columnSpanFull(),
                    ]),

                Section::make('How it looks')
                    ->description('Every layout shows the same dishes at the same prices. What changes is how much room each one gets.')
                    ->columnSpanFull()
                    ->columns(2)
                    ->components([
                        Radio::make('orientation')
                            ->label('How it is hung')
                            ->options(ScreenOrientation::class)
                            ->descriptions(collect(ScreenOrientation::cases())
                                ->mapWithKeys(fn (ScreenOrientation $case): array => [
                                    $case->value => $case->getDescription(),
                                ])
                                ->all())
                            ->default(ScreenOrientation::Landscape->value)
                            ->required(),

                        Radio::make('layout')
                            ->label('Layout')
                            ->options(ScreenLayout::class)
                            ->descriptions(collect(ScreenLayout::cases())
                                ->mapWithKeys(fn (ScreenLayout $case): array => [
                                    $case->value => $case->getDescription(),
                                ])
                                ->all())
                            ->default(ScreenLayout::Board->value)
                            ->live()
                            ->required(),

                        TextInput::make('rotation_seconds')
                            ->label('Seconds per page')
                            ->numeric()
                            ->minValue(3)
                            ->maxValue(600)
                            ->default(12)
                            ->required()
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get))
                            ->helperText('How long one page holds before the next takes its place. Ten to fifteen suits a queue; longer suits a table.'),

                        TextInput::make('refresh_minutes')
                            ->label('Reload every (minutes)')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(1440)
                            ->default(30)
                            ->placeholder('Never')
                            ->helperText('How often the screen fetches the menu again, so a price you change here reaches it on its own. Leave empty to leave the set alone.'),

                        Toggle::make('show_prices')
                            ->label('Show prices')
                            ->default(true),

                        Toggle::make('show_names')
                            ->label('Show names')
                            ->helperText('Turn off and each tile is the photograph and its price alone.')
                            ->visible(fn (Get $get): bool => self::isHandPicked($get))
                            ->default(true),

                        Toggle::make('show_logo')
                            ->label('Show the logo')
                            ->default(true),

                        Toggle::make('show_slides')
                            ->label('Deal in the slider\'s offers')
                            ->helperText('The same slides that run above the online menu, spread through the categories.')
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get))
                            ->default(true),

                        Toggle::make('show_qr')
                            ->label('Show a code to scan')
                            ->helperText('Puts a QR in the corner that opens this menu on a phone.')
                            ->default(false),
                    ]),

                Section::make('Where to point the set')
                    ->description('Open this address in the screen\'s browser once and leave it there. Everything above can be changed afterwards without touching the set again.')
                    ->columnSpanFull()
                    ->visible(fn (?DisplayScreen $record): bool => $record !== null)
                    ->components([
                        Text::make(fn (?DisplayScreen $record): string => $record === null
                            ? ''
                            : route('screen.show', $record))
                            ->color('primary'),

                        Text::make(fn (?DisplayScreen $record): string => $record === null
                            ? ''
                            : 'For an older television that cannot run the full board, add ?simple=still, ?simple=cycle or ?simple=crawl to that address: '
                                .collect(SimpleScreenStyle::cases())
                                    ->map(fn (SimpleScreenStyle $style): string => $style->getLabel().' — '.$style->getDescription())
                                    ->implode(' '))
                            ->color('gray'),
                    ]),
            ]);
    }

    /**
     * Whether the form is on the layout that shows chosen dishes rather than
     * categories, which is what decides which of its fields mean anything.
     */
    private static function isHandPicked(Get $get): bool
    {
        $layout = $get('layout');

        return ($layout instanceof ScreenLayout ? $layout : ScreenLayout::tryFrom((string) $layout)) === ScreenLayout::Picks;
    }

    /**
     * Every dish on the menu, grouped under its category so a long menu can be
     * read down rather than searched blind.
     *
     * @return array<string, array<int, string>>
     */
    private static function productOptions(): array
    {
        return Category::query()
            ->with(['products' => fn (Relation $query): Relation => $query->where('is_active', true)->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get()
            ->filter(fn (Category $category): bool => $category->products->isNotEmpty())
            ->mapWithKeys(fn (Category $category): array => [
                $category->title => $category->products
                    ->mapWithKeys(fn (Product $product): array => [$product->id => $product->title])
                    ->all(),
            ])
            ->all();
    }
}
