<?php

/**
 * Temporary cache-clearing script for production debugging.
 *
 * Access via: https://studioroam.site/clear-cache.php
 *
 * IMPORTANT: Delete this file after use!
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "<pre>\n";
echo "=== Clearing Laravel Caches ===\n\n";

Illuminate\Support\Facades\Artisan::call('config:clear');
echo "✅ Config cache cleared\n";

Illuminate\Support\Facades\Artisan::call('route:clear');
echo "✅ Route cache cleared\n";

Illuminate\Support\Facades\Artisan::call('view:clear');
echo "✅ View cache cleared\n";

Illuminate\Support\Facades\Artisan::call('cache:clear');
echo "✅ Application cache cleared\n";

// Show current APP_URL to verify
$appUrl = config('app.url');
echo "\n=== Verification ===\n";
echo "APP_URL = {$appUrl}\n";

$storageUrl = Illuminate\Support\Facades\Storage::disk('public')->url('test.jpg');
echo "Storage URL example = {$storageUrl}\n";

echo "\n⚠️  DELETE THIS FILE AFTER USE!\n";
echo "</pre>\n";
