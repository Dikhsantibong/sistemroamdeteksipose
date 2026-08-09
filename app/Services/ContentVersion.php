<?php

namespace App\Services;

use App\Models\Category;
use App\Models\PeopleCount;
use App\Models\Pose;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Model;

/**
 * Derive a fingerprint of the content the booth tablet caches offline.
 *
 * The tablet compares this value against its cached copy: when it changes the
 * tablet re-synchronises poses and settings. Nothing needs to be stored because
 * the fingerprint is derived from the data itself.
 */
class ContentVersion
{
    /**
     * The models whose state makes up the booth content.
     *
     * @var list<class-string<Model>>
     */
    protected const TRACKED_MODELS = [
        Pose::class,
        Category::class,
        PeopleCount::class,
        Setting::class,
    ];

    /**
     * Build the current content fingerprint.
     */
    public function current(): string
    {
        $parts = array_map(
            fn (string $model): string => $this->fingerprintFor($model),
            self::TRACKED_MODELS,
        );

        return substr(hash('sha256', implode('|', $parts)), 0, 16);
    }

    /**
     * Reduce a table to a "row count + latest change" fingerprint.
     *
     * @param  class-string<Model>  $model
     */
    protected function fingerprintFor(string $model): string
    {
        $count = $model::query()->count();
        $latest = $model::query()->max('updated_at');

        return $model.':'.$count.':'.((string) $latest);
    }
}
