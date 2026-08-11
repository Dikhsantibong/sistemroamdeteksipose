<?php

namespace Tests\Feature\Booth;

use App\Http\Middleware\EnsureBoothMode;
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

    /**
     * The URL the installed application launches with.
     */
    protected function boothUrl(): string
    {
        return route('home', [EnsureBoothMode::QUERY => EnsureBoothMode::VALUE]);
    }

    public function test_the_install_page_is_public()
    {
        $this->get(route('install'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('install')->has('boothUrl'));
    }

    public function test_the_install_page_links_to_the_booth_launch_url()
    {
        $this->get(route('install'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('boothUrl', $this->boothUrl()));
    }

    public function test_the_launch_url_opens_booth_mode()
    {
        PeopleCount::factory()->create(['count' => 2]);

        $this->get($this->boothUrl())
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('welcome')
                ->has('settings.recommendation_count')
                ->has('settings.voice_confidence')
                ->has('contentVersion')
                ->has('peopleCounts', 1)
                ->has('endpoints.poses')
                ->has('endpoints.deviceHeartbeat'));
    }

    public function test_the_legacy_booth_url_forwards_to_the_launch_url()
    {
        $this->get(route('booth'))->assertRedirect('/?mode=booth');
    }

    public function test_the_manifest_launches_the_installed_app_in_booth_mode()
    {
        $manifest = json_decode(
            (string) file_get_contents(public_path('manifest.webmanifest')),
            true,
        );

        $this->assertSame('/?mode=booth', $manifest['start_url']);
        $this->assertSame('standalone', $manifest['display']);
        $this->assertSame('landscape', $manifest['orientation']);
    }

    public function test_the_service_worker_caches_the_booth_launch_url()
    {
        $serviceWorker = (string) file_get_contents(public_path('sw.js'));

        $this->assertStringContainsString("BOOTH_URL = '/?mode=booth'", $serviceWorker);
    }
}
