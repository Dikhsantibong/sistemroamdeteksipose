<?php

namespace App\Http\Middleware;

use App\Models\Device;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolve the booth tablet behind a request from its bearer token.
 */
class AuthenticateDevice
{
    /**
     * The request attribute the resolved device is stored under.
     */
    public const ATTRIBUTE = 'booth_device';

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        $device = $token === null
            ? null
            : Device::query()
                ->where('token_hash', Device::hashToken($token))
                ->where('active', true)
                ->first();

        if ($device === null) {
            return response()->json(['message' => 'Unauthenticated device.'], 401);
        }

        $request->attributes->set(self::ATTRIBUTE, $device);

        return $next($request);
    }
}
