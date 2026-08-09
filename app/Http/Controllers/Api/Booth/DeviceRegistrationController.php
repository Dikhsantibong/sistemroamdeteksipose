<?php

namespace App\Http\Controllers\Api\Booth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\DeviceRegistrationRequest;
use App\Models\Booth;
use App\Models\Device;
use Illuminate\Http\JsonResponse;

class DeviceRegistrationController extends Controller
{
    /**
     * Register a booth tablet and issue the token it uses for heartbeats.
     *
     * Registration is idempotent per device UUID: a tablet that re-registers
     * after clearing its storage keeps its record and receives a fresh token.
     */
    public function __invoke(DeviceRegistrationRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $token = Device::generateToken();

        $device = Device::query()->updateOrCreate(
            ['uuid' => $validated['uuid']],
            [
                'name' => $validated['name'],
                'token_hash' => Device::hashToken($token),
                'app_version' => $validated['app_version'] ?? null,
                'last_seen_at' => now(),
                'booth_id' => Device::query()->where('uuid', $validated['uuid'])->value('booth_id')
                    ?? Booth::query()->where('active', true)->value('id'),
            ],
        );

        return response()->json([
            'token' => $token,
            'device' => [
                'id' => $device->id,
                'uuid' => $device->uuid,
                'name' => $device->name,
            ],
        ], 201);
    }
}
