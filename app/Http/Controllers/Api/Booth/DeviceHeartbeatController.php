<?php

namespace App\Http\Controllers\Api\Booth;

use App\Http\Controllers\Controller;
use App\Http\Middleware\AuthenticateDevice;
use App\Http\Requests\Api\DeviceHeartbeatRequest;
use App\Models\Device;
use App\Services\ContentVersion;
use Illuminate\Http\JsonResponse;

class DeviceHeartbeatController extends Controller
{
    /**
     * Record that a booth tablet is still alive and tell it the content version.
     */
    public function __invoke(DeviceHeartbeatRequest $request, ContentVersion $contentVersion): JsonResponse
    {
        /** @var Device $device */
        $device = $request->attributes->get(AuthenticateDevice::ATTRIBUTE);

        $device->update([
            'last_seen_at' => now(),
            'app_version' => $request->validated('app_version') ?? $device->app_version,
            'content_version' => $request->validated('content_version') ?? $device->content_version,
        ]);

        return response()->json([
            'content_version' => $contentVersion->current(),
        ]);
    }
}
