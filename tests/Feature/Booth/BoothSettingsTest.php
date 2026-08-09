<?php

namespace Tests\Feature\Booth;

use App\Models\Setting;
use App\Services\BoothSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoothSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected BoothSettings $settings;

    protected function setUp(): void
    {
        parent::setUp();

        $this->settings = $this->app->make(BoothSettings::class);
        $this->settings->flush();
    }

    public function test_it_falls_back_to_the_configured_defaults()
    {
        $this->assertSame(10, $this->settings->get('recommendation_count'));
        $this->assertTrue($this->settings->get('manual_navigation_enabled'));
        $this->assertSame('en-US', $this->settings->get('voice_language'));
    }

    public function test_it_casts_stored_values_to_the_declared_type()
    {
        $this->settings->update([
            'recommendation_count' => '15',
            'voice_enabled' => false,
            'gesture_confidence' => '0.85',
        ]);

        $this->assertSame(15, $this->settings->get('recommendation_count'));
        $this->assertFalse($this->settings->get('voice_enabled'));
        $this->assertSame(0.85, $this->settings->get('gesture_confidence'));
    }

    public function test_it_ignores_keys_that_are_not_defined()
    {
        $this->settings->update(['not_a_real_setting' => 'value']);

        $this->assertDatabaseMissing('settings', ['key' => 'not_a_real_setting']);
    }

    public function test_it_refreshes_the_cache_after_an_update()
    {
        $this->assertSame(10, $this->settings->get('recommendation_count'));

        $this->settings->update(['recommendation_count' => 20]);

        $this->assertSame(20, $this->settings->get('recommendation_count'));
    }

    public function test_it_stores_booleans_in_a_reloadable_format()
    {
        $this->settings->update(['hand_gesture_enabled' => false]);

        $this->assertSame('0', Setting::query()->where('key', 'hand_gesture_enabled')->value('value'));
        $this->assertFalse($this->settings->get('hand_gesture_enabled'));
    }
}
