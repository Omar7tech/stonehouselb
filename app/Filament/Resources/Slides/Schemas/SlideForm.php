<?php

namespace App\Filament\Resources\Slides\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Builder;

class SlideForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Slide')
                    ->description('A wide picture for the carousel above the menu, with an optional dish behind it.')
                    ->columnSpanFull()
                    ->columns(2)
                    ->components([
                        SpatieMediaLibraryFileUpload::make('image')
                            ->label('Picture')
                            ->collection('image')
                            ->disk('public')
                            ->visibility('public')
                            ->image()
                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                            ->maxSize(5120)
                            ->conversion('slider')
                            ->imageEditor()
                            ->imageEditorAspectRatios(['16:9'])
                            ->helperText('Wide, roughly 16:9. Leave empty to use the linked dish\'s own photo.')
                            ->columnSpanFull(),

                        Select::make('product_id')
                            ->label('Opens dish')
                            ->relationship('product', 'title', fn (Builder $query): Builder => $query->orderBy('title'))
                            ->searchable()
                            ->preload()
                            ->placeholder('Nothing — just a picture')
                            ->helperText('Tapping the slide opens this dish. Leave empty for a plain picture.'),

                        TextInput::make('text')
                            ->label('Caption')
                            ->maxLength(255)
                            ->helperText('Optional line laid over the picture. The dish\'s name is already shown.'),

                        Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->inline(false),
                    ]),
            ]);
    }
}
