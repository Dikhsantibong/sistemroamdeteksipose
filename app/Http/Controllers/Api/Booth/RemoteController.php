<?php

namespace App\Http\Controllers\Api\Booth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RemoteController extends Controller
{
    /**
     * Store the action from the mobile phone into the cache.
     */
    public function store(Request $request, string $token)
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:NEXT_POSE,PREVIOUS_POSE'],
        ]);

        // Store the action for 60 seconds.
        // It will be pulled by the tablet in its next polling cycle.
        Cache::put("remote_action_{$token}", $validated['action'], 60);

        return response()->json(['status' => 'accepted']);
    }

    /**
     * Retrieve and clear the action for the tablet.
     */
    public function pull(string $token)
    {
        $action = Cache::pull("remote_action_{$token}");

        return response()->json([
            'action' => $action,
        ]);
    }
}
