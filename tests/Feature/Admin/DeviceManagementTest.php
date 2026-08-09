<?php

namespace Tests\Feature\Admin;

use App\Models\Booth;
use App\Models\Device;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_guests_cannot_list_devices()
    {
        $this->get(route('admin.devices.index'))->assertRedirect(route('login'));
    }

    public function test_an_administrator_sees_the_registered_devices()
    {
        Device::factory()->create(['name' => 'Booth Tablet 01']);

        $this->actingAs($this->user)
            ->get(route('admin.devices.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('devices', 1));
    }

    public function test_a_device_is_online_only_while_its_heartbeat_is_recent()
    {
        $online = Device::factory()->create();
        $offline = Device::factory()->offline()->create();

        $this->assertTrue($online->is_online);
        $this->assertFalse($offline->is_online);
    }

    public function test_a_device_can_be_renamed_and_assigned_to_a_booth()
    {
        $device = Device::factory()->create();
        $booth = Booth::factory()->create();

        $this->actingAs($this->user)
            ->put(route('admin.devices.update', $device), [
                'name' => 'Front Tablet',
                'booth_id' => $booth->id,
                'active' => true,
            ])
            ->assertRedirect();

        $device->refresh();

        $this->assertSame('Front Tablet', $device->name);
        $this->assertSame($booth->id, $device->booth_id);
    }

    public function test_a_disabled_device_can_no_longer_send_a_heartbeat()
    {
        $token = Device::generateToken();
        $device = Device::factory()->create(['token_hash' => Device::hashToken($token)]);

        $this->actingAs($this->user)->put(route('admin.devices.update', $device), [
            'name' => $device->name,
            'booth_id' => null,
            'active' => false,
        ]);

        $this->withToken($token)
            ->postJson(route('api.booth.devices.heartbeat'), [])
            ->assertUnauthorized();
    }

    public function test_a_device_can_be_removed()
    {
        $device = Device::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('admin.devices.destroy', $device))
            ->assertRedirect();

        $this->assertDatabaseMissing('devices', ['id' => $device->id]);
    }

    public function test_the_device_token_hash_is_never_exposed()
    {
        $device = Device::factory()->create();

        $this->assertArrayNotHasKey('token_hash', $device->toArray());
    }
}
