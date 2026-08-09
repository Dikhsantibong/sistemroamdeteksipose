<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DeviceController;
use App\Http\Controllers\Admin\PeopleCountController;
use App\Http\Controllers\Admin\PoseBulkActionController;
use App\Http\Controllers\Admin\PoseController;
use App\Http\Controllers\Admin\PoseUploadController;
use App\Http\Controllers\Admin\SettingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('poses', [PoseController::class, 'index'])->name('poses.index');
    Route::get('poses/upload', [PoseUploadController::class, 'create'])->name('poses.upload');
    Route::post('poses/upload', [PoseUploadController::class, 'store'])
        ->middleware('throttle:30,1')
        ->name('poses.upload.store');
    Route::post('poses/bulk-action', [PoseBulkActionController::class, 'store'])->name('poses.bulk-action');
    Route::get('poses/{pose}/edit', [PoseController::class, 'edit'])->name('poses.edit');
    Route::put('poses/{pose}', [PoseController::class, 'update'])->name('poses.update');
    Route::delete('poses/{pose}', [PoseController::class, 'destroy'])->name('poses.destroy');

    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('people-counts', [PeopleCountController::class, 'index'])->name('people-counts.index');
    Route::post('people-counts', [PeopleCountController::class, 'store'])->name('people-counts.store');
    Route::put('people-counts/{peopleCount}', [PeopleCountController::class, 'update'])->name('people-counts.update');
    Route::delete('people-counts/{peopleCount}', [PeopleCountController::class, 'destroy'])->name('people-counts.destroy');

    Route::get('settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');

    Route::get('devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::put('devices/{device}', [DeviceController::class, 'update'])->name('devices.update');
    Route::delete('devices/{device}', [DeviceController::class, 'destroy'])->name('devices.destroy');
});
