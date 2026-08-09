<?php

namespace App\Http\Controllers\Api\Booth;

use App\Http\Controllers\Controller;
use App\Models\PeopleCount;
use App\Services\BoothSettings;
use App\Services\ContentVersion;
use Illuminate\Http\JsonResponse;

class ConfigurationController extends Controller
{
    /**
     * Return the runtime configuration the booth tablet caches.
     */
    public function __invoke(BoothSettings $settings, ContentVersion $contentVersion): JsonResponse
    {
        return response()->json([
            'content_version' => $contentVersion->current(),
            'settings' => $settings->all(),
            'people_counts' => PeopleCount::query()
                ->active()
                ->ordered()
                ->get(['count', 'label']),
        ]);
    }
}
