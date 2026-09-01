<?php

namespace App\Filament\Pages;

use App\Enums\CategoryLayout;
use App\Enums\PriceDisplay;
use App\Enums\VariantStyle;
use App\Settings\GeneralSettings;
use BackedEnum;
use Filament\Forms\Components\Radio;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Repeater\TableColumn;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Pages\SettingsPage;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use UnitEnum;

class ManageGeneral extends SettingsPage
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedCog6Tooth;

    protected static ?string $navigationLabel = 'General';

    protected static string|UnitEnum|null $navigationGroup = 'Settings';

    protected static string $settings = GeneralSettings::class;

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make()
                    ->columnSpanFull()
                    ->tabs([
                        Tab::make('Pricing')
                            ->icon(Heroicon::OutlinedBanknotes)
                            ->schema([
                                Toggle::make('show_lbp_prices')
                                    ->label('Enable LBP pricing')
                                    ->helperText('Turn on to allow prices to be shown in Lebanese Pounds.')
                                    ->default(false)
                                    ->columnSpanFull()
                                    ->live()
                                    ->afterStateUpdated(function (bool $state, callable $set): void {
                                        // Fall back to USD-only when LBP pricing is turned off.
                                        if (! $state) {
                                            $set('price_display', PriceDisplay::Usd->value);
                                        }
                                    }),

                                TextInput::make('lbp_exchange_rate')
                                    ->label('LBP exchange rate')
                                    ->helperText('How many Lebanese Pounds one US Dollar is worth, e.g. 90000.')
                                    ->numeric()
                                    ->minValue(0)
                                    ->suffix('LBP')
                                    ->live(onBlur: true)
                                    ->requiredIf('show_lbp_prices', true)
                                    ->columnSpanFull()
                                    ->visibleJs(<<<'JS'
                                        $get('show_lbp_prices')
                                        JS),

                                Radio::make('price_display')
                                    ->label('Price display')
                                    ->helperText('LBP and Both need LBP pricing enabled with a rate above zero.')
                                    ->options(PriceDisplay::class)
                                    ->default(PriceDisplay::Usd->value)
                                    ->required()
                                    ->columnSpanFull()
                                    ->disableOptionWhen(function (string $value, Get $get): bool {
                                        $lbpReady = $get('show_lbp_prices') && (float) $get('lbp_exchange_rate') > 0;

                                        return $value !== PriceDisplay::Usd->value && ! $lbpReady;
                                    }),
                            ]),

                        Tab::make('Appearance')
                            ->icon(Heroicon::OutlinedSwatch)
                            ->schema([
                                Radio::make('category_layout')
                                    ->label('Category layout')
                                    ->helperText('How the menu\'s opening screen lists its categories. Every layout shows the same categories in the same order.')
                                    ->options(CategoryLayout::class)
                                    ->descriptions(collect(CategoryLayout::cases())
                                        ->mapWithKeys(fn (CategoryLayout $layout): array => [
                                            $layout->value => $layout->getDescription(),
                                        ])
                                        ->all())
                                    ->default(CategoryLayout::Grid->value)
                                    ->required()
                                    ->columnSpanFull(),

                                Radio::make('variant_style')
                                    ->label('Size picker')
                                    ->helperText('How a product\'s sizes are offered, on the card and in the sheet. Products sold in one size only never show it.')
                                    ->options(VariantStyle::class)
                                    ->descriptions(collect(VariantStyle::cases())
                                        ->mapWithKeys(fn (VariantStyle $style): array => [
                                            $style->value => $style->getDescription(),
                                        ])
                                        ->all())
                                    ->default(VariantStyle::Cards->value)
                                    ->required()
                                    ->columnSpanFull(),
                            ]),

                        Tab::make('Delivery')
                            ->icon(Heroicon::OutlinedTruck)
                            ->schema([
                                Toggle::make('online_ordering_active')
                                    ->label('Delivery menu active')
                                    ->helperText('Turn off to make the storefront dine-in only. The delivery menu redirects back to dine-in.')
                                    ->default(true)
                                    ->columnSpanFull(),

                                TextInput::make('whatsapp_number')
                                    ->label('WhatsApp number')
                                    ->helperText('Where finished orders are sent, in full international form, e.g. 96171123456. Without one, customers can browse but not order.')
                                    ->tel()
                                    ->maxLength(255)
                                    ->columnSpanFull(),

                                Toggle::make('charge_delivery')
                                    ->label('Charge for delivery')
                                    ->helperText('Adds a flat fee to the order total.')
                                    ->default(false)
                                    ->columnSpanFull()
                                    ->live(),

                                TextInput::make('delivery_fee')
                                    ->label('Delivery fee')
                                    ->helperText('The flat charge added to every order, in USD.')
                                    ->numeric()
                                    ->minValue(0)
                                    ->prefix('$')
                                    ->requiredIf('charge_delivery', true)
                                    ->columnSpanFull()
                                    ->visibleJs(<<<'JS'
                                        $get('charge_delivery')
                                        JS),
                            ]),

                        Tab::make('Checkout')
                            ->icon(Heroicon::OutlinedClipboardDocumentCheck)
                            ->schema([
                                Toggle::make('require_full_name')
                                    ->label('Ask for a name')
                                    ->helperText('The customer must give a name before the order can be sent.')
                                    ->default(false)
                                    ->columnSpanFull(),

                                Toggle::make('require_phone_number')
                                    ->label('Ask for a phone number')
                                    ->helperText('The customer must give a phone number before the order can be sent.')
                                    ->default(false)
                                    ->columnSpanFull(),

                                Toggle::make('get_client_location')
                                    ->label('Ask for their location')
                                    ->helperText('Attaches a map pin to the order. The customer is asked by their browser and can decline, in which case they are told to share it in the chat.')
                                    ->default(false)
                                    ->columnSpanFull(),
                            ]),

                        Tab::make('Footer')
                            ->icon(Heroicon::OutlinedLink)
                            ->schema([
                                Repeater::make('social_links')
                                    ->label('Footer links')
                                    ->helperText('Listed at the foot of the menu, in this order. Rows missing a name or an address are not shown.')
                                    ->defaultItems(0)
                                    ->table([
                                        TableColumn::make('Name')->markAsRequired(),
                                        TableColumn::make('Address')->markAsRequired(),
                                    ])
                                    ->compact()
                                    ->addActionLabel('Add link')
                                    ->reorderable()
                                    ->columnSpanFull()
                                    ->schema([
                                        TextInput::make('label')
                                            ->placeholder('Instagram')
                                            ->required()
                                            ->maxLength(255),
                                        TextInput::make('url')
                                            ->placeholder('https://instagram.com/stonehouselb')
                                            ->url()
                                            ->required()
                                            ->maxLength(255),
                                    ]),
                            ]),
                    ]),
            ]);
    }
}
