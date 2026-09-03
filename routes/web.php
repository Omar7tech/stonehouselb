<?php

use App\Http\Controllers\DisplayScreenController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\PrintMenuController;
use App\Http\Controllers\SeoController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Served from code rather than sat in `public/`, so every URL they carry points
// at the domain the site is actually running on, and the sitemap only lists
// pages that exist right now.
Route::get('/robots.txt', [SeoController::class, 'robots'])->name('seo.robots');
Route::get('/sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');

Route::get('/menu/dine-in', [MenuController::class, 'dineIn'])->name('menu.dine-in');
Route::get('/menu/delivery', [MenuController::class, 'delivery'])->name('menu.delivery');

// The same menu on paper, for the tables and the delivery flyers. Public
// because it shows nothing the menu itself doesn't, and kept out of search
// results by the page's own robots tag.
Route::get('/menu/print', PrintMenuController::class)->name('menu.print');

// A screen hung in the shop, addressed by its own name: a television over the
// counter, a tablet on a table. `?simple=still|cycle|crawl` serves the plain
// HTML board instead, for sets whose browser cannot run the other one.
Route::get('/screen/{displayScreen}', DisplayScreenController::class)->name('screen.show');
