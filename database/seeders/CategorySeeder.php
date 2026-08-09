<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * The categories an operator starts with. More can be added from the dashboard.
     *
     * @var list<string>
     */
    protected const DEFAULT_CATEGORIES = [
        'Casual',
        'Funny',
        'Friendship',
        'Formal',
        'Creative',
        'Dynamic',
        'Aesthetic',
        'Group',
    ];

    /**
     * Seed the pose categories.
     */
    public function run(): void
    {
        foreach (self::DEFAULT_CATEGORIES as $index => $name) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'active' => true, 'sort_order' => $index],
            );
        }
    }
}
