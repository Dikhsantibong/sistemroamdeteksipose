<?php

use App\Http\Controllers\BoothController;
use App\Http\Controllers\InstallController;
use Illuminate\Support\Facades\Route;

/**
 * The application root is booth mode: a tablet that opens the app lands on the
 * pose assistant with no address to type and nothing to navigate.
 */
Route::get('/', [BoothController::class, 'show'])->name('home');

Route::get('install', [InstallController::class, 'show'])->name('install');

/** Kept so older bookmarks and installed shortcuts still reach booth mode. */
Route::redirect('booth', '/')->name('booth');

/**
 * Fortify and the starter kit link to the "dashboard" route after authenticating.
 * The administrator dashboard lives at /admin, so this simply forwards there.
 */
Route::redirect('dashboard', '/admin')->name('dashboard');

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
