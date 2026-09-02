<?php

use App\Http\Controllers\MenuController;
use App\Http\Controllers\PrintMenuController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/menu/dine-in', [MenuController::class, 'dineIn'])->name('menu.dine-in');
Route::get('/menu/delivery', [MenuController::class, 'delivery'])->name('menu.delivery');

// The same menu on paper, for the tables and the delivery flyers. Public
// because it shows nothing the menu itself doesn't, and kept out of search
// results by the page's own robots tag.
Route::get('/menu/print', PrintMenuController::class)->name('menu.print');
