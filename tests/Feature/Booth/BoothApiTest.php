<?php

namespace Tests\Feature\Booth;

use App\Models\Booth;
use App\Models\Device;
use App\Models\PeopleCount;
use App\Models\Pose;
use App\Services\BoothSettings;
use App\Services\ContentVersion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class BoothApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->make(BoothSettings::class)->flush();
    }

    public function test_the_configuration_endpoint_returns_settings_and_group_sizes()
    {
        PeopleCount::factory()->create(['count' => 1]);
        PeopleCount::factory()->create(['count' => 2]);

        $this->getJson(route('api.booth.configuration'))
            ->assertOk()
            ->assertJsonStructure(['content_version', 'settings', 'people_counts'])
            ->assertJsonPath('settings.recommendation_count', 10)
            ->assertJsonCount(2, 'people_counts');
    }

    public function test_the_poses_endpoint_only_returns_active_poses()
    {
        Pose::factory()->count(3)->forPeopleCount(4)->create();
        Pose::factory()->count(2)->forPeopleCount(4)->inactive()->create();

        $this->getJson(route('api.booth.poses'))
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'content_version',
                'data' => [['id', 'name', 'people_count', 'instruction', 'image_url', 'thumbnail_url']],
            ]);
    }

    public function test_the_poses_endpoint_can_be_filtered_by_group_size()
    {
        Pose::factory()->count(3)->forPeopleCount(4)->create();
        Pose::factory()->count(2)->forPeopleCount(2)->create();

        $this->getJson(route('api.booth.poses', ['people_count' => 2]))
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_the_content_version_changes_when_a_pose_is_added()
    {
        $before = $this->app->make(ContentVersion::class)->current();

        Pose::factory()->forPeopleCount(4)->create();

        $this->getJson(route('api.booth.content-version'))
            ->assertOk()
            ->assertJsonMissing(['content_version' => $before]);
    }

    public function test_a_tablet_can_register_and_receives_a_token()
    {
        Booth::factory()->create();

        $response = $this->postJson(route('api.booth.devices.register'), [
            'uuid' => (string) Str::uuid(),
            'name' => 'Booth Tablet 01',
            'app_version' => '1.0.0',
        ]);

        $response->assertCreated()->assertJsonStructure(['token', 'device' => ['id', 'uuid', 'name']]);

        $this->assertDatabaseHas('devices', [
            'name' => 'Booth Tablet 01',
            'token_hash' => Device::hashToken($response->json('token')),
        ]);
    }

    public function test_registering_twice_with_the_same_uuid_reuses_the_device()
    {
        $uuid = (string) Str::uuid();

        $this->postJson(route('api.booth.devices.register'), ['uuid' => $uuid, 'name' => 'Tablet']);
        $this->postJson(route('api.booth.devices.register'), ['uuid' => $uuid, 'name' => 'Tablet']);

        $this->assertSame(1, Device::query()->count());
    }

    public function test_registration_requires_a_valid_uuid()
    {
        $this->postJson(route('api.booth.devices.register'), ['uuid' => 'not-a-uuid', 'name' => 'Tablet'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('uuid');
    }

    public function test_a_heartbeat_updates_the_device_and_returns_the_content_version()
    {
        $token = Device::generateToken();
        $device = Device::factory()->offline()->create(['token_hash' => Device::hashToken($token)]);

        $this->withToken($token)
            ->postJson(route('api.booth.devices.heartbeat'), [
                'app_version' => '1.2.0',
                'content_version' => 'abc123',
            ])
            ->assertOk()
            ->assertJsonStructure(['content_version']);

        $device->refresh();

        $this->assertTrue($device->is_online);
        $this->assertSame('1.2.0', $device->app_version);
        $this->assertSame('abc123', $device->content_version);
    }

    public function test_a_heartbeat_without_a_token_is_rejected()
    {
        $this->postJson(route('api.booth.devices.heartbeat'), [])->assertUnauthorized();
    }

    public function test_a_heartbeat_with_an_unknown_token_is_rejected()
    {
        Device::factory()->create();

        $this->withToken('not-a-real-token')
            ->postJson(route('api.booth.devices.heartbeat'), [])
            ->assertUnauthorized();
    }
}
