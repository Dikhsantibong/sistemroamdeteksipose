<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Pose;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Pose>
 */
class PoseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word().' '.fake()->word();
        $slug = Str::slug($name);

        return [
            'category_id' => Category::factory(),
            'name' => Str::title($name),
            'people_count' => fake()->numberBetween(1, 5),
            'instruction' => fake()->sentence(),
            'image_path' => "poses/{$slug}.webp",
            'thumbnail_path' => "poses/thumbnails/{$slug}.webp",
            'original_filename' => "{$slug}.jpg",
            'width' => 1600,
            'height' => 1200,
            'file_size' => fake()->numberBetween(50_000, 400_000),
            'active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * Indicate that the pose is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'active' => false,
        ]);
    }

    /**
     * Indicate the group size the pose is intended for.
     */
    public function forPeopleCount(int $peopleCount): static
    {
        return $this->state(fn (array $attributes) => [
            'people_count' => $peopleCount,
        ]);
    }

    /**
     * Indicate that the pose has no category.
     */
    public function withoutCategory(): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => null,
        ]);
    }
}
