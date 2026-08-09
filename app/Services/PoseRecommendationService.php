<?php

namespace App\Services;

use App\Models\Pose;
use Illuminate\Database\Eloquent\Collection;

/**
 * Turn a stable people count into a list of pose recommendations.
 *
 * The engine is intentionally self contained: it takes a group size and returns
 * poses. Future ranking signals (category preference, popularity, difficulty)
 * can be layered on without touching the callers.
 */
class PoseRecommendationService
{
    public function __construct(protected BoothSettings $settings) {}

    /**
     * Get the recommended poses for the given group size.
     *
     * Poses are never repeated within a session: when fewer poses exist than
     * the configured recommendation count, the smaller set is returned as is.
     *
     * @return Collection<int, Pose>
     */
    public function getRecommendations(int $peopleCount, ?int $limit = null): Collection
    {
        $limit ??= (int) $this->settings->get('recommendation_count');

        if ($peopleCount < 1 || $limit < 1) {
            return new Collection;
        }

        return Pose::query()
            ->active()
            ->forPeopleCount($peopleCount)
            ->with('category:id,name,slug')
            ->inRandomOrder()
            ->limit($limit)
            ->get();
    }

    /**
     * Count the active poses available for the given group size.
     */
    public function availableFor(int $peopleCount): int
    {
        return Pose::query()
            ->active()
            ->forPeopleCount($peopleCount)
            ->count();
    }
}
