<?php

namespace App\Filament\Resources\Products\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\RepeatableEntry\TableColumn;
use Filament\Infolists\Components\SpatieMediaLibraryImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ProductInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Details')
                    ->columnSpanFull()
                    ->columns(2)
                    ->components([
                        SpatieMediaLibraryImageEntry::make('image')
                            ->label('Image')
                            ->collection('image')
                            ->conversion('webp')
                            ->placeholder('-')
                            ->columnSpanFull(),
                        TextEntry::make('title'),
                        TextEntry::make('subtitle')->placeholder('-'),
                        TextEntry::make('category.title')->label('Category'),
                        TextEntry::make('order_type')
                            ->label('Order type')
                            ->badge(),
                        TextEntry::make('description')
                            ->placeholder('-')
                            ->columnSpanFull(),
                    ]),

                Section::make('Pricing & status')
                    ->columnSpanFull()
                    ->columns(2)
                    ->components([
                        TextEntry::make('price')->money('USD'),
                        TextEntry::make('discount_price')
                            ->money('USD')
                            ->placeholder('-'),
                        IconEntry::make('is_active')
                            ->label('Active')
                            ->boolean(),
                        IconEntry::make('is_featured')
                            ->label('Featured')
                            ->boolean(),
                    ]),

                Section::make('Variants')
                    ->columnSpanFull()
                    ->components([
                        RepeatableEntry::make('variants')
                            ->hiddenLabel()
                            ->placeholder('No variants.')
                            ->table([
                                TableColumn::make('Name'),
                                TableColumn::make('Price')->width('160px'),
                                TableColumn::make('Discount price')->width('160px'),
                            ])
                            ->schema([
                                TextEntry::make('name'),
                                TextEntry::make('price')->money('USD'),
                                TextEntry::make('discount_price')
                                    ->money('USD')
                                    ->placeholder('-'),
                            ]),
                    ]),

                Section::make('Meta')
                    ->columnSpanFull()
                    ->columns(2)
                    ->collapsed()
                    ->components([
                        TextEntry::make('created_at')
                            ->dateTime()
                            ->placeholder('-'),
                        TextEntry::make('updated_at')
                            ->dateTime()
                            ->placeholder('-'),
                    ]),
            ]);
    }
}
