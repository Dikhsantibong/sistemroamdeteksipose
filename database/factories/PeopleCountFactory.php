<?php

namespace Database\Factories;

use App\Models\PeopleCount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PeopleCount>
 */
class PeopleCountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $count = fake()->unique()->numberBetween(1, 20);

        return [
            'count' => $count,
            'label' => "{$count} orang",
            'active' => true,
            'sort_order' => $count,
        ];
    }

    /**
     * Indicate that the group size is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => false,
        ]);
    }
}
