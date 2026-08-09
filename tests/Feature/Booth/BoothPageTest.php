<?php

namespace Tests\Feature\Booth;

use App\Models\PeopleCount;
use App\Services\BoothSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoothPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->make(BoothSettings::class)->flush();
    }

    public function test_the_install_page_is_public()
    {
        $this->get(route('install'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('install')->has('boothUrl'));
    }

    public function test_the_install_page_points_at_the_application_root()
    {
        $this->get(route('install'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('boothUrl', route('home')));
    }

    public function test_the_application_root_is_booth_mode()
    {
        PeopleCount::factory()->create(['count' => 2]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('welcome')
                ->has('settings.recommendation_count')
                ->has('contentVersion')
                ->has('peopleCounts', 1)
                ->has('endpoints.poses')
                ->has('endpoints.deviceHeartbeat'));
    }

    public function test_the_legacy_booth_url_forwards_to_the_root()
    {
        $this->get(route('booth'))->assertRedirect('/');
    }

    public function test_the_manifest_starts_the_installed_app_in_booth_mode()
    {
        $manifest = json_decode(
            (string) file_get_contents(public_path('manifest.webmanifest')),
            true,
        );

        $this->assertSame('/', $manifest['start_url']);
        $this->assertSame('standalone', $manifest['display']);
        $this->assertSame('landscape', $manifest['orientation']);
    }

    public function test_the_service_worker_caches_the_booth_shell()
    {
        $serviceWorker = (string) file_get_contents(public_path('sw.js'));

        $this->assertFileExists(public_path('sw.js'));
        $this->assertStringNotContainsString("'/booth'", $serviceWorker);
    }
}
