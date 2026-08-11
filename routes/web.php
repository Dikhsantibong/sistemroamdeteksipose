<?php

use App\Http\Controllers\BoothController;
use App\Http\Controllers\InstallController;
use App\Http\Middleware\EnsureBoothMode;
use Illuminate\Support\Facades\Route;

/**
 * The application root is booth mode, but only for the installed tablet app.
 * An ordinary browser visit lands on the sign in page instead of being asked
 * for the camera. See EnsureBoothMode.
 */
Route::get('/', [BoothController::class, 'show'])
    ->middleware(EnsureBoothMode::class)
    ->name('home');

/** Public: this is how an operator installs the app onto a tablet. */
Route::get('install', [InstallController::class, 'show'])->name('install');

/** Kept so older bookmarks and installed shortcuts still reach booth mode. */
Route::redirect('booth', '/?'.EnsureBoothMode::QUERY.'='.EnsureBoothMode::VALUE)
    ->name('booth');

/**
 * Fortify and the starter kit link to the "dashboard" route after authenticating.
 * The administrator dashboard lives at /admin, so this simply forwards there.
 */
Route::redirect('dashboard', '/admin')->name('dashboard');

require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
