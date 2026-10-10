<?php

namespace App\Filament\Resources\DisplayScreens\Schemas;

use App\Enums\OrderType;
use App\Enums\ScreenLabelStyle;
use App\Enums\ScreenLayout;
use App\Enums\ScreenOrientation;
use App\Enums\SimpleScreenStyle;
use App\Models\Category;
use App\Models\DisplayScreen;
use App\Models\Product;
use Filament\Forms\Components\Radio;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\ToggleButtons;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Text;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\HtmlString;

/**
 * The form is asked in the order the decisions are made in: where the screen
 * hangs, what kind of board it is, what goes on it, and only then the small
 * print. The layout comes before the content because it decides what the
 * content is — whole categories turned over on a timer, or a handful of dishes
 * chosen by hand — and every field that means nothing to the chosen layout is
 * taken off the page rather than left there to be wondered about.
 */
class DisplayScreenForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Where to point the set')
                    ->description('Open this address in the screen\'s browser once and leave it there. Everything below can be changed afterwards without touching the set again.')
                    ->icon(Heroicon::OutlinedLink)
                    ->columnSpanFull()
                    ->visible(fn (?DisplayScreen $record): bool => $record !== null)
                    ->components([
                        Text::make(fn (?DisplayScreen $record): string => $record === null
                            ? ''
                            : route('screen.show', $record))
                            ->color('primary')
                            ->copyable()
                            ->copyMessage('Address copied')
                            ->tooltip('Click to copy'),

                        // The plain boards print categories, so they have
                        // nothing to offer a screen that runs none.
                        Text::make(fn (?DisplayScreen $record): string => $record === null
                            ? ''
                            : 'For an older television that cannot run the full board, add ?simple=still, ?simple=cycle or ?simple=crawl to that address: '
                                .collect(SimpleScreenStyle::cases())
                                    ->map(fn (SimpleScreenStyle $style): string => $style->getLabel().' — '.$style->getDescription())
                                    ->implode(' '))
                            ->color('gray')
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get)),
                    ]),

                Section::make('The screen')
                    ->description('Name it after where it hangs — the name becomes its address, and that address is what you type into the set once.')
                    ->icon(Heroicon::OutlinedTv)
                    ->columnSpanFull()
                    ->columns(2)
                    ->components([
                        TextInput::make('name')
                            ->label('Name')
                            ->required()
                            ->maxLength(80)
                            ->live(onBlur: true)
                            ->autofocus()
                            ->placeholder('Counter TV')
                            ->helperText('For example "Counter TV" or "Window tablet".'),

                        Toggle::make('is_active')
                            ->label('Live')
                            ->helperText('Turn off and the address stops answering, so a set left on in a back room cannot go on quoting old prices.')
                            ->default(true)
                            ->inline(false),
                    ]),

                Section::make('Layout')
                    ->description('Pick the kind of board first: it decides what the rest of this page asks you.')
                    ->icon(Heroicon::OutlinedSquares2x2)
                    ->columnSpanFull()
                    ->components([
                        Radio::make('layout')
                            ->hiddenLabel()
                            ->options(self::layoutOptions())
                            ->descriptions(collect(ScreenLayout::cases())
                                ->mapWithKeys(fn (ScreenLayout $case): array => [
                                    $case->value => $case->getDescription(),
                                ])
                                ->all())
                            ->default(ScreenLayout::Board->value)
                            ->columns(['md' => 2, 'xl' => 3])
                            ->live()
                            ->required(),

                        // The hand-picked board measures the set itself, so
                        // it has no use for being told which way up it is.
                        ToggleButtons::make('orientation')
                            ->label('How it is hung')
                            ->options(ScreenOrientation::class)
                            ->default(ScreenOrientation::Landscape->value)
                            ->inline()
                            ->required()
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get))
                            ->helperText('A television or tablet on its side is landscape; a screen stood upright, as by a till or a door, is portrait.'),
                    ]),

                Section::make('What it shows')
                    ->description(fn (Get $get): string => self::isHandPicked($get)
                        ? 'Exactly the dishes you list here, all on the screen at once.'
                        : 'Whole categories, turned over one page at a time.')
                    ->icon(Heroicon::OutlinedQueueList)
                    ->columnSpanFull()
                    ->components([
                        // On a board that runs categories this decides which
                        // dishes it may quote. The hand-picked board asks the
                        // same question further down, under the code, because
                        // there the code is the only thing it changes.
                        self::menuChoice()
                            ->label('Which menu it quotes')
                            ->helperText('Dine-in is what can be eaten in, the usual choice for a screen in the room. Delivery is what can be sent out, for a screen at the takeaway hatch.')
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get)),

                        Select::make('categories')
                            ->label('Categories')
                            ->relationship('categories', 'title')
                            ->multiple()
                            ->preload()
                            ->placeholder('The whole menu')
                            ->helperText('Leave empty and the screen shows every category, in the menu\'s own order. Choose some and it shows only those.')
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get)),

                        // A list rather than a multi-select, and saved by hand
                        // rather than through `->relationship()`: on this
                        // board the order is the layout, so it has to be
                        // something you can drag, and something that is kept.
                        Repeater::make('products')
                            ->label('Dishes')
                            ->simple(
                                Select::make('product_id')
                                    ->options(fn (): array => self::productOptions())
                                    ->searchable()
                                    ->required()
                                    ->placeholder('Choose a dish')
                                    ->disableOptionsWhenSelectedInSiblingRepeaterItems(),
                            )
                            ->defaultItems(0)
                            ->grid(['md' => 2, 'xl' => 3])
                            ->reorderable()
                            ->addActionLabel('Add a dish')
                            ->helperText('Drag to reorder: the screen reads left to right, top to bottom, in this order. Up to about twelve reads well from across a room; every one you add makes each of them smaller.')
                            ->visible(fn (Get $get): bool => self::isHandPicked($get))
                            ->dehydrated(false)
                            ->afterStateHydrated(function (Repeater $component, ?DisplayScreen $record): void {
                                if ($record?->exists) {
                                    $component->rawState($record->products()->pluck('products.id')->all());
                                }

                                $component->hydrateItems();
                            })
                            ->saveRelationshipsUsing(function (Repeater $component, DisplayScreen $record): void {
                                $items = $component->getRawState();
                                $chosen = [];

                                foreach (is_array($items) ? $items : [] as $item) {
                                    $id = is_array($item) ? ($item['product_id'] ?? null) : $item;

                                    // A row left blank is skipped, and a dish
                                    // listed twice keeps its first place.
                                    if (is_numeric($id) && ! isset($chosen[(int) $id])) {
                                        $chosen[(int) $id] = ['sort_order' => count($chosen)];
                                    }
                                }

                                $record->products()->sync($chosen);
                            }),
                    ]),

                // Its own section, and only on the board that has labels: the
                // other layouts set their names and prices in the layout
                // itself, and have nothing here to choose between.
                Section::make('Label')
                    ->description('How the name and the price are set on each photo. All three are white with black figures; pick the one that suits your photographs.')
                    ->icon(Heroicon::OutlinedTag)
                    ->columnSpanFull()
                    ->visible(fn (Get $get): bool => self::isHandPicked($get))
                    ->components([
                        Radio::make('label_style')
                            ->hiddenLabel()
                            ->options(ScreenLabelStyle::class)
                            ->descriptions(collect(ScreenLabelStyle::cases())
                                ->mapWithKeys(fn (ScreenLabelStyle $case): array => [
                                    $case->value => $case->getDescription(),
                                ])
                                ->all())
                            ->default(ScreenLabelStyle::Notch->value)
                            ->columns(['md' => 3])
                            ->required(),
                    ]),

                Section::make('Details')
                    ->description('What is printed on the board besides the dishes, and how often it changes.')
                    ->icon(Heroicon::OutlinedAdjustmentsHorizontal)
                    ->columnSpanFull()
                    ->columns(['md' => 2, 'xl' => 4])
                    ->components([
                        Toggle::make('show_prices')
                            ->label('Prices')
                            ->default(true),

                        Toggle::make('show_names')
                            ->label('Dish names')
                            ->helperText('Off, and each tile is the photograph and its price alone.')
                            ->visible(fn (Get $get): bool => self::isHandPicked($get))
                            ->default(true),

                        Toggle::make('show_logo')
                            ->label('Logo')
                            ->default(true),

                        Toggle::make('show_slides')
                            ->label('Slider offers')
                            ->helperText('The slides from above the online menu, dealt in between the categories.')
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get))
                            ->default(true),

                        Toggle::make('show_qr')
                            ->label('Code to scan')
                            ->helperText('A QR that opens the menu on a phone.')
                            ->live()
                            ->default(false),

                        self::menuChoice()
                            ->label('Which menu the code opens')
                            ->helperText('The menu a customer\'s phone lands on when they scan it.')
                            ->visible(fn (Get $get): bool => self::isHandPicked($get) && (bool) $get('show_qr'))
                            ->columnSpanFull(),

                        TextInput::make('rotation_seconds')
                            ->label('Seconds per page')
                            ->numeric()
                            ->minValue(3)
                            ->maxValue(600)
                            ->default(12)
                            ->suffix('sec')
                            ->required()
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get))
                            ->helperText('How long one page holds before the next takes its place. Ten to fifteen suits a queue; longer suits a table.')
                            ->columnSpan(['md' => 1, 'xl' => 2]),

                        TextInput::make('refresh_minutes')
                            ->label('Reload every')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(1440)
                            ->default(30)
                            ->suffix('min')
                            ->placeholder('Never')
                            ->hidden(fn (Get $get): bool => self::isHandPicked($get))
                            ->helperText('How often the screen fetches the menu again, so a price you change here reaches it on its own. Leave empty to leave the set alone.')
                            ->columnSpan(['md' => 1, 'xl' => 2]),

                        // Said here, where the reload setting would have been,
                        // so nobody changes a price and waits for a board that
                        // is not going to notice.
                        Text::make('This board never reloads on its own. After changing its dishes or a price, refresh the screen once by hand.')
                            ->color('gray')
                            ->visible(fn (Get $get): bool => self::isHandPicked($get))
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    /**
     * The layouts, each under its own name — with a badge beside the one that
     * was added last, so somebody who set their screens up months ago can see
     * there is something on this list they have not tried.
     *
     * @return array<string, string|HtmlString>
     */
    private static function layoutOptions(): array
    {
        $options = [];

        foreach (ScreenLayout::cases() as $layout) {
            $options[$layout->value] = $layout === ScreenLayout::Picks
                ? new HtmlString(
                    '<span style="display: inline-flex; align-items: center; gap: 0.5rem;">'
                    .e($layout->getLabel())
                    .Blade::render('<x-filament::badge color="success" size="sm">New</x-filament::badge>')
                    .'</span>'
                )
                : $layout->getLabel();
        }

        return $options;
    }

    /**
     * The dine-in or delivery choice. Asked in one of two places, never both,
     * depending on what the answer changes on the layout in hand.
     */
    private static function menuChoice(): ToggleButtons
    {
        return ToggleButtons::make('order_type')
            ->options([
                OrderType::DineIn->value => OrderType::DineIn->getLabel(),
                OrderType::Delivery->value => OrderType::Delivery->getLabel(),
            ])
            ->icons([
                OrderType::DineIn->value => Heroicon::OutlinedBuildingStorefront,
                OrderType::Delivery->value => Heroicon::OutlinedTruck,
            ])
            ->default(OrderType::DineIn->value)
            ->inline()
            ->required();
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
