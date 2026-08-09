<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Services\BoothSettings;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function __construct(protected BoothSettings $settings) {}

    /**
     * Seed the booth settings with the defaults declared in config/booth.php.
     */
    public function run(): void
    {
        foreach ($this->settings->definitions() as $key => $definition) {
            Setting::query()->firstOrCreate(
                ['key' => $key],
                [
                    'value' => match ($definition['type']) {
                        'boolean' => $definition['default'] ? '1' : '0',
                        'json' => (string) json_encode($definition['default']),
                        default => (string) $definition['default'],
                    },
                    'type' => $definition['type'],
                    'group' => $definition['group'],
                ],
            );
        }

        $this->settings->flush();
    }
}
