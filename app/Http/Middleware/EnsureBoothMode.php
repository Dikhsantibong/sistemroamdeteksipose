<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keep booth mode to the installed tablet application.
 *
 * The booth immediately asks for the camera, which is the wrong first
 * impression for somebody who reached the site in an ordinary browser. Only a
 * visit that came through the installed app opens booth mode; everyone else is
 * sent to sign in.
 *
 * The marker is the query string the PWA manifest launches with. It is copied
 * into a long lived cookie on the first launch so later navigations inside the
 * installed app, including offline ones served by the service worker, still
 * resolve to booth mode.
 */
class EnsureBoothMode
{
    /**
     * The query parameter the manifest start_url carries.
     */
    public const QUERY = 'mode';

    /**
     * The value that marks a request as coming from the installed app.
     */
    public const VALUE = 'booth';

    /**
     * The cookie that remembers the marker between launches.
     */
    public const COOKIE = 'booth_mode';

    /**
     * The cookie lifetime in minutes. A booth tablet is set up once.
     */
    protected const COOKIE_MINUTES = 60 * 24 * 365;

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $launched = $request->query(self::QUERY) === self::VALUE;
        $remembered = $request->cookie(self::COOKIE) === self::VALUE;

        if (! $launched && ! $remembered) {
            return $request->user() !== null
                ? redirect()->route('admin.dashboard')
                : redirect()->route('login');
        }

        $response = $next($request);

        if ($launched && ! $remembered) {
            $response->headers->setCookie(
                Cookie::make(self::COOKIE, self::VALUE, self::COOKIE_MINUTES),
            );
        }

        return $response;
    }
}
