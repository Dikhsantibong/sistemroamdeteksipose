<?php

namespace Database\Seeders;

use App\Models\Booth;
use Illuminate\Database\Seeder;

class BoothSeeder extends Seeder
{
    /**
     * Seed the single booth the MVP is deployed to.
     */
    public function run(): void
    {
        Booth::query()->firstOrCreate(
            ['slug' => 'booth-01'],
            ['name' => 'Booth 01', 'location' => null, 'active' => true],
        );
    }
}
