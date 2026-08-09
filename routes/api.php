<?php

use App\Http\Controllers\Api\Booth\ConfigurationController;
use App\Http\Controllers\Api\Booth\ContentVersionController;
use App\Http\Controllers\Api\Booth\DeviceHeartbeatController;
use App\Http\Controllers\Api\Booth\DeviceRegistrationController;
use App\Http\Controllers\Api\Booth\PoseController;
use App\Http\Middleware\AuthenticateDevice;
use Illuminate\Support\Facades\Route;

/**
 * Endpoints consumed by the booth tablet. Nothing here is customer data: the
 * tablet only pulls pose content and configuration, and reports that it is alive.
 */
Route::prefix('booth')->name('api.booth.')->group(function () {
    Route::middleware('throttle:60,1')->group(function () {
        Route::get('configuration', ConfigurationController::class)->name('configuration');
        Route::get('poses', PoseController::class)->name('poses');
        Route::get('content-version', ContentVersionController::class)->name('content-version');
        Route::post('devices/register', DeviceRegistrationController::class)->name('devices.register');
    });

    Route::post('devices/heartbeat', DeviceHeartbeatController::class)
        ->middleware([AuthenticateDevice::class, 'throttle:30,1'])
        ->name('devices.heartbeat');
});
