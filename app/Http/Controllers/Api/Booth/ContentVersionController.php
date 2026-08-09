<?php

namespace App\Http\Controllers\Api\Booth;

use App\Http\Controllers\Controller;
use App\Services\ContentVersion;
use Illuminate\Http\JsonResponse;

class ContentVersionController extends Controller
{
    /**
     * Return the current content fingerprint.
     *
     * The tablet polls this cheap endpoint and only downloads poses and settings
     * again when the fingerprint differs from its cached copy.
     */
    public function __invoke(ContentVersion $contentVersion): JsonResponse
    {
        return response()->json([
            'content_version' => $contentVersion->current(),
        ]);
    }
}
