<?php

namespace Tests\Feature\Admin;

use App\Models\PeopleCount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeopleCountManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_guests_cannot_manage_group_sizes()
    {
        $this->get(route('admin.people-counts.index'))->assertRedirect(route('login'));
    }

    public function test_an_administrator_can_add_a_group_size_beyond_the_seeded_range()
    {
        $this->actingAs($this->user)
            ->post(route('admin.people-counts.store'), [
                'count' => 9,
                'label' => '9 people',
                'active' => true,
                'sort_order' => 9,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('people_counts', ['count' => 9, 'label' => '9 people']);
    }

    public function test_group_sizes_must_be_unique()
    {
        PeopleCount::factory()->create(['count' => 4]);

        $this->actingAs($this->user)
            ->post(route('admin.people-counts.store'), [
                'count' => 4,
                'label' => '4 people',
                'active' => true,
                'sort_order' => 4,
            ])
            ->assertSessionHasErrors('count');
    }

    public function test_a_group_size_can_be_deactivated()
    {
        $peopleCount = PeopleCount::factory()->create(['count' => 6]);

        $this->actingAs($this->user)
            ->put(route('admin.people-counts.update', $peopleCount), [
                'count' => 6,
                'label' => '6 people',
                'active' => false,
                'sort_order' => 6,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertFalse($peopleCount->fresh()->active);
    }

    public function test_only_active_group_sizes_reach_the_booth()
    {
        PeopleCount::factory()->create(['count' => 2]);
        PeopleCount::factory()->create(['count' => 7])->update(['active' => false]);

        $this->getJson(route('api.booth.configuration'))
            ->assertOk()
            ->assertJsonCount(1, 'people_counts');
    }

    public function test_a_group_size_can_be_deleted()
    {
        $peopleCount = PeopleCount::factory()->create(['count' => 8]);

        $this->actingAs($this->user)
            ->delete(route('admin.people-counts.destroy', $peopleCount))
            ->assertRedirect();

        $this->assertDatabaseMissing('people_counts', ['id' => $peopleCount->id]);
    }
}
