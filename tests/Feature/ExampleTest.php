<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The application root is booth mode and is reserved for the installed
     * tablet app, so the public smoke test uses the install page instead.
     * Access to the root itself is covered by BoothAccessTest.
     */
    public function test_returns_a_successful_response()
    {
        $response = $this->get(route('install'));

        $response->assertOk();
    }
}
