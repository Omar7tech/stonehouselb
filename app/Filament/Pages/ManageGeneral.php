<?php

namespace App\Filament\Pages;

use App\Enums\BannerMode;
use App\Enums\CategoryLayout;
use App\Enums\PriceDisplay;
use App\Enums\ProductCardStyle;
use App\Enums\ShopStatusMode;
use App\Enums\VariantStyle;
use App\Enums\Weekday;
use App\Settings\GeneralSettings;
use BackedEnum;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Radio;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Repeater\TableColumn;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\TimePicker;
use Filament\Forms\Components\Toggle;
use Filament\Pages\SettingsPage;
use Filament\Schemas\Components\Section;
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
                        Tab::make('Shop status')
                            ->icon(Heroicon::OutlinedBuildingStorefront)
                            ->schema([
                                Radio::make('status_mode')
                                    ->label('How the shop opens and closes')
                                    ->options(ShopStatusMode::class)
                                    ->descriptions(collect(ShopStatusMode::cases())
                                        ->mapWithKeys(fn (ShopStatusMode $mode): array => [
                                            $mode->value => $mode->getDescription(),
                                        ])
                                        ->all())
                                    ->default(ShopStatusMode::Manual->value)
                                    ->required()
                                    ->columnSpanFull(),

                                Toggle::make('is_open')
                                    ->label('The shop is open')
                                    ->helperText('Turn off to close the storefront: the menu stays readable, but orders cannot be sent.')
                                    ->default(true)
                                    ->columnSpanFull()
                                    ->visibleJs(<<<'JS'
                                        $get('status_mode') === 'manual'
                                        JS),

                                Repeater::make('opening_hours')
                                    ->label('Weekly opening hours')
                                    ->helperText('A closing time earlier than the opening time runs past midnight — open 18:00, close 02:00 keeps the shop open until two in the morning.')
                                    ->default(GeneralSettings::defaultOpeningHours())
                                    ->addable(false)
                                    ->deletable(false)
                                    ->reorderable(false)
                                    ->collapsible()
                                    ->collapsed()
                                    ->columnSpanFull()
                                    ->itemLabel(fn (array $state): ?string => Weekday::tryFrom($state['day'] ?? -1)?->getLabel())
                                    ->schema([
                                        Hidden::make('day'),

                                        Toggle::make('is_closed')
                                            ->label('Closed all day')
                                            ->default(false)
                                            ->live()
                                            ->columnSpanFull(),

                                        TimePicker::make('opens_at')
                                            ->label('Opens at')
                                            ->seconds(false)
                                            ->default('09:00')
                                            ->required()
                                            ->visibleJs(<<<'JS'
                                                ! $get('is_closed')
                                                JS),

                                        TimePicker::make('closes_at')
                                            ->label('Closes at')
                                            ->seconds(false)
                                            ->default('17:00')
                                            ->required()
                                            ->visibleJs(<<<'JS'
                                                ! $get('is_closed')
                                                JS),
                                    ])
                                    ->columns(2)
                                    ->visibleJs(<<<'JS'
                                        $get('status_mode') === 'automatic'
                                        JS),
                            ]),

                        Tab::make('Banner')
                            ->icon(Heroicon::OutlinedMegaphone)
                            ->schema([
                                Toggle::make('show_banner')
                                    ->label('Show the banner')
                                    ->helperText('A strip across the very top of the storefront, above the logo.')
                                    ->default(false)
                                    ->columnSpanFull(),

                                Radio::make('banner_mode')
                                    ->label('How the line is picked')
                                    ->options(BannerMode::class)
                                    ->descriptions(collect(BannerMode::cases())
                                        ->mapWithKeys(fn (BannerMode $mode): array => [
                                            $mode->value => $mode->getDescription(),
                                        ])
                                        ->all())
                                    ->default(BannerMode::Fixed->value)
                                    ->required()
                                    ->columnSpanFull()
                                    ->visibleJs(<<<'JS'
                                        $get('show_banner')
                                        JS),

                                TextInput::make('banner_text')
                                    ->label('Banner line')
                                    ->helperText('Kept short: it is one line across the top of a phone.')
                                    ->default('Welcome to Stone House')
                                    ->requiredIf('show_banner', true)
                                    ->maxLength(120)
                                    ->columnSpanFull()
                                    ->visibleJs(<<<'JS'
                                        $get('show_banner') && $get('banner_mode') === 'fixed'
                                        JS),

                                Repeater::make('banner_schedule')
                                    ->label('A line per day')
                                    ->helperText('Each day shows its own line. Leave a day empty to show no banner at all that day.')
                                    ->default(GeneralSettings::defaultBannerSchedule())
                                    ->addable(false)
                                    ->deletable(false)
                                    ->reorderable(false)
                                    ->columnSpanFull()
                                    ->itemLabel(fn (array $state): ?string => Weekday::tryFrom($state['day'] ?? -1)?->getLabel())
                                    ->schema([
                                        Hidden::make('day'),

                                        TextInput::make('text')
                                            ->label('Line')
                                            ->maxLength(120)
                                            ->columnSpanFull(),
                                    ])
                                    ->visibleJs(<<<'JS'
                                        $get('show_banner') && $get('banner_mode') === 'scheduled'
                                        JS),
                            ]),

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

                        /**
                         * Three pickers, each with three or four options and a
                         * paragraph under every one — laid out flat that is a
                         * wall of prose to scroll before reaching the one
                         * choice you came to change.
                         *
                         * So each is a section of its own, folded shut by
                         * default and remembering what you left open. The
                         * headings alone are then the whole tab: three lines
                         * naming what can be changed, and the reading only
                         * appears once you have asked for it.
                         */
                        Tab::make('Appearance')
                            ->icon(Heroicon::OutlinedSwatch)
                            ->schema([
                                Section::make('Category layout')
                                    ->description('How the menu\'s opening screen lists its categories. Every layout shows the same categories in the same order.')
                                    ->icon(Heroicon::OutlinedSquares2x2)
                                    ->collapsible()
                                    ->collapsed()
                                    ->persistCollapsed()
                                    ->id('appearance-category-layout')
                                    ->schema([
                                        Radio::make('category_layout')
                                            // The section heading names it, and
                                            // a label repeating that under it
                                            // is the crowding this was meant to
                                            // undo.
                                            ->hiddenLabel()
                                            ->options(CategoryLayout::class)
                                            ->descriptions(collect(CategoryLayout::cases())
                                                ->mapWithKeys(fn (CategoryLayout $layout): array => [
                                                    $layout->value => $layout->getDescription(),
                                                ])
                                                ->all())
                                            ->default(CategoryLayout::Grid->value)
                                            ->required(),
                                    ]),

                                Section::make('Product card')
                                    ->description('How one dish is drawn once a category is open. Every style opens the same details sheet.')
                                    ->icon(Heroicon::OutlinedRectangleStack)
                                    ->collapsible()
                                    ->collapsed()
                                    ->persistCollapsed()
                                    ->id('appearance-product-card')
                                    ->schema([
                                        Radio::make('product_card_style')
                                            ->hiddenLabel()
                                            ->options(ProductCardStyle::class)
                                            ->descriptions(collect(ProductCardStyle::cases())
                                                ->mapWithKeys(fn (ProductCardStyle $style): array => [
                                                    $style->value => $style->getDescription(),
                                                ])
                                                ->all())
                                            ->default(ProductCardStyle::Row->value)
                                            ->required(),
                                    ]),

                                Section::make('Variant selector')
                                    ->description('How a product\'s sizes are offered, on the card and in the sheet. Products sold in one size only never show it.')
                                    ->icon(Heroicon::OutlinedTag)
                                    ->collapsible()
                                    ->collapsed()
                                    ->persistCollapsed()
                                    ->id('appearance-variant-selector')
                                    ->schema([
                                        Radio::make('variant_style')
                                            ->hiddenLabel()
                                            ->options(VariantStyle::class)
                                            ->descriptions(collect(VariantStyle::cases())
                                                ->mapWithKeys(fn (VariantStyle $style): array => [
                                                    $style->value => $style->getDescription(),
                                                ])
                                                ->all())
                                            ->default(VariantStyle::Cards->value)
                                            ->required(),
                                    ]),
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
                                TextInput::make('location_url')
                                    ->label('Location link')
                                    ->helperText('Where the shop is on a map, e.g. a Google Maps link. Leave empty to hide the footer\'s location button.')
                                    ->placeholder('https://maps.app.goo.gl/...')
                                    ->url()
                                    ->maxLength(255)
                                    ->columnSpanFull(),

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
