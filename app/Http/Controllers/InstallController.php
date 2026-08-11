<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureBoothMode;
use Inertia\Inertia;
use Inertia\Response;

class InstallController extends Controller
{
    /**
     * Show the public page an operator uses to install the PWA on a tablet.
     */
    public function show(): Response
    {
        return Inertia::render('install', [
            'boothUrl' => route('home', [EnsureBoothMode::QUERY => EnsureBoothMode::VALUE]),
        ]);
    }
}
