<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Services\BoothSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoothSettingsManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected BoothSettings $settings;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->settings = $this->app->make(BoothSettings::class);
        $this->settings->flush();
    }

    /**
     * Build a full settings payload with the given overrides applied.
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function payload(array $overrides = []): array
    {
        return [...$this->settings->all(), ...$overrides];
    }

    public function test_guests_cannot_reach_the_settings_screen()
    {
        $this->get(route('admin.settings.edit'))->assertRedirect(route('login'));
    }

    public function test_an_administrator_can_open_the_settings_screen()
    {
        $this->actingAs($this->user)
            ->get(route('admin.settings.edit'))
            ->assertOk();
    }

    public function test_the_recommendation_count_can_be_changed_without_a_developer()
    {
        $this->actingAs($this->user)
            ->put(route('admin.settings.update'), $this->payload(['recommendation_count' => 20]))
            ->assertRedirect(route('admin.settings.edit'));

        $this->assertSame(20, $this->settings->get('recommendation_count'));
    }

    public function test_voice_gesture_and_manual_navigation_can_be_toggled()
    {
        $this->actingAs($this->user)->put(route('admin.settings.update'), $this->payload([
            'voice_enabled' => false,
            'hand_gesture_enabled' => false,
            'manual_navigation_enabled' => true,
        ]));

        $this->assertFalse($this->settings->get('voice_enabled'));
        $this->assertFalse($this->settings->get('hand_gesture_enabled'));
        $this->assertTrue($this->settings->get('manual_navigation_enabled'));
    }

    public function test_the_voice_language_can_be_changed()
    {
        $this->actingAs($this->user)
            ->put(route('admin.settings.update'), $this->payload(['voice_language' => 'id-ID']));

        $this->assertSame('id-ID', $this->settings->get('voice_language'));
    }

    public function test_an_unsupported_voice_language_is_rejected()
    {
        $this->actingAs($this->user)
            ->put(route('admin.settings.update'), $this->payload(['voice_language' => 'fr-FR']))
            ->assertSessionHasErrors('voice_language');
    }

    public function test_detection_settings_are_validated()
    {
        $this->actingAs($this->user)
            ->put(route('admin.settings.update'), $this->payload([
                'detection_confidence' => 2,
                'detection_smoothing' => 0,
            ]))
            ->assertSessionHasErrors(['detection_confidence', 'detection_smoothing']);
    }

    public function test_a_recommendation_count_below_one_is_rejected()
    {
        $this->actingAs($this->user)
            ->put(route('admin.settings.update'), $this->payload(['recommendation_count' => 0]))
            ->assertSessionHasErrors('recommendation_count');
    }

    public function test_saved_settings_reach_the_booth_api()
    {
        $this->actingAs($this->user)->put(route('admin.settings.update'), $this->payload([
            'recommendation_count' => 15,
            'voice_enabled' => false,
        ]));

        $this->getJson(route('api.booth.configuration'))
            ->assertOk()
            ->assertJsonPath('settings.recommendation_count', 15)
            ->assertJsonPath('settings.voice_enabled', false);
    }
}
