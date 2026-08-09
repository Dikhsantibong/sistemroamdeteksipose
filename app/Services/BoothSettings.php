<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * Read and write the runtime configuration the booth tablet depends on.
 *
 * Definitions (type, group, default) live in config/booth.php while the values
 * live in the settings table so an administrator can change behaviour without
 * touching source code.
 */
class BoothSettings
{
    /**
     * The cache key holding the resolved settings map.
     */
    public const CACHE_KEY = 'booth.settings';

    /**
     * Get every setting, falling back to the configured default.
     *
     * @return array<string, bool|float|int|string|array<mixed>|null>
     */
    public function all(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function (): array {
            $stored = Setting::query()->get()->keyBy('key');

            $resolved = [];

            foreach ($this->definitions() as $key => $definition) {
                $resolved[$key] = $stored->has($key)
                    ? $stored->get($key)->typedValue()
                    : $definition['default'];
            }

            return $resolved;
        });
    }

    /**
     * Get a single setting value.
     *
     * @return array<mixed>|bool|float|int|string|null
     */
    public function get(string $key): bool|float|int|string|array|null
    {
        return $this->all()[$key] ?? $this->definitions()[$key]['default'] ?? null;
    }

    /**
     * Persist the given settings, ignoring any key that is not defined.
     *
     * @param  array<string, mixed>  $values
     */
    public function update(array $values): void
    {
        $definitions = $this->definitions();

        foreach ($values as $key => $value) {
            if (! isset($definitions[$key])) {
                continue;
            }

            Setting::query()->updateOrCreate(
                ['key' => $key],
                [
                    'value' => $this->serialize($value, $definitions[$key]['type']),
                    'type' => $definitions[$key]['type'],
                    'group' => $definitions[$key]['group'],
                ],
            );
        }

        $this->flush();
    }

    /**
     * Forget the cached settings map.
     */
    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Get the validation rules for every defined setting.
     *
     * @return array<string, array<int, string>>
     */
    public function validationRules(): array
    {
        $rules = [];

        foreach ($this->definitions() as $key => $definition) {
            $rules[$key] = $definition['rules'];
        }

        return $rules;
    }

    /**
     * Get the setting definitions declared in configuration.
     *
     * @return array<string, array{type: string, group: string, default: mixed, label: string, description: string, rules: array<int, string>}>
     */
    public function definitions(): array
    {
        return config('booth.settings');
    }

    /**
     * Convert a value into the string representation stored in the database.
     */
    protected function serialize(mixed $value, string $type): string
    {
        return match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => (string) json_encode($value),
            default => (string) $value,
        };
    }
}
