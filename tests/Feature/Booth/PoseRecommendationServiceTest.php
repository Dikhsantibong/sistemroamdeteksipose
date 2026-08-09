<?php

namespace Tests\Feature\Booth;

use App\Models\Pose;
use App\Services\BoothSettings;
use App\Services\PoseRecommendationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PoseRecommendationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PoseRecommendationService $recommendations;

    protected function setUp(): void
    {
        parent::setUp();

        $this->recommendations = $this->app->make(PoseRecommendationService::class);
    }

    public function test_it_only_returns_poses_matching_the_people_count()
    {
        Pose::factory()->count(3)->forPeopleCount(4)->create();
        Pose::factory()->count(3)->forPeopleCount(2)->create();

        $result = $this->recommendations->getRecommendations(4);

        $this->assertCount(3, $result);
        $this->assertEqualsCanonicalizing([4], $result->pluck('people_count')->unique()->all());
    }

    public function test_it_excludes_inactive_poses()
    {
        Pose::factory()->count(2)->forPeopleCount(3)->create();
        Pose::factory()->count(5)->forPeopleCount(3)->inactive()->create();

        $result = $this->recommendations->getRecommendations(3);

        $this->assertCount(2, $result);
        $this->assertTrue($result->every(fn (Pose $pose): bool => $pose->active));
    }

    public function test_it_limits_the_result_to_the_configured_recommendation_count()
    {
        $this->app->make(BoothSettings::class)->update(['recommendation_count' => 5]);

        Pose::factory()->count(12)->forPeopleCount(4)->create();

        $this->assertCount(5, $this->recommendations->getRecommendations(4));
    }

    public function test_it_never_repeats_a_pose_within_a_session()
    {
        Pose::factory()->count(6)->forPeopleCount(4)->create();

        $result = $this->recommendations->getRecommendations(4, 10);

        $this->assertCount(6, $result);
        $this->assertCount(6, $result->pluck('id')->unique());
    }

    public function test_it_returns_nothing_when_no_poses_exist_for_the_group_size()
    {
        Pose::factory()->count(4)->forPeopleCount(2)->create();

        $this->assertCount(0, $this->recommendations->getRecommendations(5));
    }

    public function test_it_returns_nothing_when_no_people_are_detected()
    {
        Pose::factory()->count(4)->forPeopleCount(1)->create();

        $this->assertCount(0, $this->recommendations->getRecommendations(0));
    }

    public function test_it_returns_the_expected_poses_for_each_supported_group_size()
    {
        foreach (range(1, 5) as $peopleCount) {
            Pose::factory()->count($peopleCount + 1)->forPeopleCount($peopleCount)->create();
        }

        foreach (range(1, 5) as $peopleCount) {
            $result = $this->recommendations->getRecommendations($peopleCount);

            $this->assertCount($peopleCount + 1, $result, "Group size {$peopleCount} returned the wrong pose count.");
            $this->assertEquals([$peopleCount], $result->pluck('people_count')->unique()->values()->all());
        }
    }

    public function test_a_changed_group_size_produces_an_entirely_different_set()
    {
        Pose::factory()->count(5)->forPeopleCount(4)->create();
        Pose::factory()->count(5)->forPeopleCount(3)->create();

        $forFour = $this->recommendations->getRecommendations(4);
        $forThree = $this->recommendations->getRecommendations(3);

        $this->assertCount(5, $forFour);
        $this->assertCount(5, $forThree);
        $this->assertEmpty(array_intersect($forFour->modelKeys(), $forThree->modelKeys()));
    }

    public function test_it_counts_the_available_poses_for_a_group_size()
    {
        Pose::factory()->count(3)->forPeopleCount(4)->create();
        Pose::factory()->count(2)->forPeopleCount(4)->inactive()->create();

        $this->assertSame(3, $this->recommendations->availableFor(4));
    }
}
