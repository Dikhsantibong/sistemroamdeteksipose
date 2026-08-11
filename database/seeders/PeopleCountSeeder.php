<?php

namespace Database\Seeders;

use App\Models\PeopleCount;
use Illuminate\Database\Seeder;

class PeopleCountSeeder extends Seeder
{
    /**
     * The group sizes an operator starts with. More can be added from the dashboard.
     */
    protected const DEFAULT_MAX_PEOPLE = 6;

    /**
     * Seed the supported group sizes.
     */
    public function run(): void
    {
        foreach (range(1, self::DEFAULT_MAX_PEOPLE) as $count) {
            PeopleCount::query()->updateOrCreate(
                ['count' => $count],
                [
                    // Shown to customers on the booth, which is Indonesian.
                    'label' => "{$count} orang",
                    'active' => true,
                    'sort_order' => $count,
                ],
            );
        }
    }
}
