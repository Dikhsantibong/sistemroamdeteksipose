<?php

namespace Database\Factories;

use App\Models\Booth;
use App\Models\Device;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Device>
 */
class DeviceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booth_id' => Booth::factory(),
            'name' => 'Booth Tablet '.fake()->unique()->numberBetween(1, 99),
            'uuid' => (string) Str::uuid(),
            'token_hash' => Device::hashToken(Device::generateToken()),
            'last_seen_at' => now(),
            'app_version' => '1.0.0',
            'content_version' => null,
            'active' => true,
        ];
    }

    /**
     * Indicate that the device has not sent a heartbeat recently.
     */
    public function offline(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_seen_at' => now()->subHour(),
        ]);
    }
}
