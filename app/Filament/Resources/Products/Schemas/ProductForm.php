<?php

namespace App\Filament\Resources\Products\Schemas;

use App\Enums\OrderType;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Repeater\TableColumn;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make()
                    ->columnSpanFull()
                    ->tabs([
                        Tab::make('Details')
                            ->icon(Heroicon::OutlinedInformationCircle)
                            ->columns(2)
                            ->schema([
                                TextInput::make('title')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('subtitle')
                                    ->maxLength(255),
                                Select::make('category_id')
                                    ->relationship('category', 'title')
                                    ->searchable()
                                    ->preload()
                                    ->required(),
                                Select::make('order_type')
                                    ->options(OrderType::class)
                                    ->default(OrderType::Both)
                                    ->native(false)
                                    ->required(),
                                Textarea::make('description')
                                    ->rows(3)
                                    ->columnSpanFull(),
                                TextInput::make('preparation_time')
                                    ->label('Preparation time')
                                    ->helperText('Roughly how long the item takes, shown on its details.')
                                    ->numeric()
                                    ->minValue(0)
                                    ->suffix('min'),
                                TextInput::make('calories')
                                    ->label('Calories')
                                    ->helperText('Leave empty if uncounted — the menu then shows nothing rather than a zero.')
                                    ->numeric()
                                    ->integer()
                                    ->minValue(0)
                                    ->maxValue(65535)
                                    ->suffix('kcal'),
                                SpatieMediaLibraryFileUpload::make('image')
                                    ->collection('image')
                                    ->disk('public')
                                    ->visibility('public')
                                    ->image()
                                    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                                    ->maxSize(5120)
                                    ->conversion('webp')
                                    ->responsiveImages()
                                    ->imageEditor()
                                    ->columnSpanFull(),
                            ]),

                        Tab::make('Pricing & status')
                            ->icon(Heroicon::OutlinedCurrencyDollar)
                            ->columns(2)
                            ->schema([
                                TextInput::make('price')
                                    ->required()
                                    ->numeric()
                                    ->minValue(0)
                                    ->prefix('$'),
                                TextInput::make('discount_price')
                                    ->numeric()
                                    ->minValue(0)
                                    ->lte('price')
                                    ->prefix('$'),
                                Toggle::make('is_active')
                                    ->label('Active')
                                    ->default(true)
                                    ->inline(false),
                                Toggle::make('is_featured')
                                    ->label('Featured')
                                    ->default(false)
                                    ->inline(false),
                                Toggle::make('is_spicy')
                                    ->label('Spicy')
                                    ->default(false)
                                    ->inline(false),
                                Toggle::make('is_vegan')
                                    ->label('Vegan')
                                    ->default(false)
                                    ->inline(false),
                            ]),

                        Tab::make('Ingredients')
                            ->icon(Heroicon::OutlinedListBullet)
                            ->schema([
                                Repeater::make('ingredients')
                                    ->hiddenLabel()
                                    ->helperText('What is in the dish, listed in the order it should be read. Leave empty to say nothing about it.')
                                    ->defaultItems(0)
                                    ->table([
                                        TableColumn::make('Ingredient')->markAsRequired(),
                                    ])
                                    ->compact()
                                    ->addActionLabel('Add ingredient')
                                    ->reorderable()
                                    ->schema([
                                        TextInput::make('name')
                                            ->placeholder('Grilled halloumi')
                                            ->required()
                                            ->maxLength(255),
                                    ]),
                            ]),

                        Tab::make('Variants')
                            ->icon(Heroicon::OutlinedRectangleStack)
                            ->schema([
                                Repeater::make('variants')
                                    ->hiddenLabel()
                                    ->defaultItems(0)
                                    ->table([
                                        TableColumn::make('Name')->markAsRequired(),
                                        TableColumn::make('Price')->markAsRequired(),
                                        TableColumn::make('Discount price'),
                                    ])
                                    ->compact()
                                    ->addActionLabel('Add variant')
                                    ->reorderable()
                                    ->schema([
                                        TextInput::make('name')
                                            ->required()
                                            ->maxLength(255),
                                        TextInput::make('price')
                                            ->required()
                                            ->numeric()
                                            ->minValue(0),
                                        TextInput::make('discount_price')
                                            ->numeric()
                                            ->minValue(0)
                                            ->lte('price'),
                                    ]),
                            ]),
                    ]),
            ]);
    }
}
