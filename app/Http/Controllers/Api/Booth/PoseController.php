<?php

namespace App\Http\Controllers\Api\Booth;

use App\Http\Controllers\Controller;
use App\Http\Resources\Booth\PoseResource;
use App\Models\Pose;
use App\Services\ContentVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PoseController extends Controller
{
    /**
     * Return every active pose so the tablet can serve recommendations offline.
     */
    public function __invoke(Request $request, ContentVersion $contentVersion): JsonResponse
    {
        $poses = Pose::query()
            ->active()
            ->with('category:id,name')
            ->when(
                $request->filled('people_count'),
                fn ($query) => $query->where('people_count', (int) $request->query('people_count')),
            )
            ->orderBy('people_count')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'content_version' => $contentVersion->current(),
            'data' => PoseResource::collection($poses)->resolve($request),
        ]);
    }
}
