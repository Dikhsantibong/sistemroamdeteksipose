<?php

namespace Database\Factories;

use App\Models\Booth;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Booth>
 */
class BoothFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'Booth '.fake()->unique()->numberBetween(1, 99);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'location' => fake()->city(),
            'active' => true,
        ];
    }
}
