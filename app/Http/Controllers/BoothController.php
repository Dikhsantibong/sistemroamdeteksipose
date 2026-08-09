<?php

namespace App\Http\Controllers;

use App\Models\PeopleCount;
use App\Services\BoothSettings;
use App\Services\ContentVersion;
use Inertia\Inertia;
use Inertia\Response;

class BoothController extends Controller
{
    /**
     * Show the booth interface used by customers on the tablet.
     *
     * Booth mode is the application root, so the "welcome" page component is the
     * booth. Only the initial configuration is rendered server side: poses are
     * fetched and cached by the client so the booth works without a connection.
     */
    public function show(BoothSettings $settings, ContentVersion $contentVersion): Response
    {
        return Inertia::render('welcome', [
            'settings' => $settings->all(),
            'contentVersion' => $contentVersion->current(),
            'peopleCounts' => PeopleCount::query()
                ->active()
                ->ordered()
                ->get(['count', 'label']),
            'endpoints' => [
                'configuration' => route('api.booth.configuration'),
                'poses' => route('api.booth.poses'),
                'contentVersion' => route('api.booth.content-version'),
                'deviceRegister' => route('api.booth.devices.register'),
                'deviceHeartbeat' => route('api.booth.devices.heartbeat'),
            ],
        ]);
    }
}
