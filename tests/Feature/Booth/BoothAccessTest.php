<?php

namespace Tests\Feature\Booth;

use App\Http\Middleware\EnsureBoothMode;
use App\Models\User;
use App\Services\BoothSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Booth mode belongs to the installed tablet application. A browser visit must
 * never be dropped into a screen that immediately asks for the camera.
 */
class BoothAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->make(BoothSettings::class)->flush();
    }

    protected function boothUrl(): string
    {
        return route('home', [EnsureBoothMode::QUERY => EnsureBoothMode::VALUE]);
    }

    public function test_a_browser_visitor_lands_on_the_login_page()
    {
        $this->get(route('home'))->assertRedirect(route('login'));
    }

    public function test_a_signed_in_visitor_lands_on_the_admin_dashboard()
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('home'))->assertRedirect(route('admin.dashboard'));
    }

    public function test_the_installed_application_reaches_booth_mode()
    {
        $this->get($this->boothUrl())
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('welcome'));
    }

    public function test_the_launch_url_remembers_booth_mode_in_a_cookie()
    {
        $this->get($this->boothUrl())
            ->assertOk()
            ->assertCookie(EnsureBoothMode::COOKIE, EnsureBoothMode::VALUE);
    }

    public function test_a_remembered_tablet_reaches_booth_mode_without_the_query()
    {
        $this->withCookie(EnsureBoothMode::COOKIE, EnsureBoothMode::VALUE)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('welcome'));
    }

    public function test_an_unrelated_cookie_value_does_not_unlock_booth_mode()
    {
        $this->withCookie(EnsureBoothMode::COOKIE, 'anything-else')
            ->get(route('home'))
            ->assertRedirect(route('login'));
    }

    public function test_the_install_page_stays_reachable_from_a_browser()
    {
        $this->get(route('install'))->assertOk();
    }
}
