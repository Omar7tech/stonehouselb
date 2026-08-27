<?php

namespace App\Filament\Pages;

use App\Enums\PriceDisplay;
use App\Settings\GeneralSettings;
use BackedEnum;
use Filament\Forms\Components\Radio;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Pages\SettingsPage;
use Filament\Schemas\Components\Section;
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
                Section::make('Pricing')
                    ->description('How menu prices are shown on the storefront.')
                    ->icon(Heroicon::OutlinedBanknotes)
                    ->columnSpanFull()
                    ->components([
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
            ]);
    }
}
