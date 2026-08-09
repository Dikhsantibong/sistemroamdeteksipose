<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\PeopleCount;
use App\Models\Pose;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PoseManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->user = User::factory()->create();
        PeopleCount::factory()->create(['count' => 3]);
        PeopleCount::factory()->create(['count' => 4]);
    }

    public function test_guests_cannot_list_poses()
    {
        $this->get(route('admin.poses.index'))->assertRedirect(route('login'));
    }

    public function test_an_administrator_can_list_poses()
    {
        Pose::factory()->count(3)->forPeopleCount(4)->create();

        $this->actingAs($this->user)
            ->get(route('admin.poses.index'))
            ->assertOk();
    }

    public function test_poses_can_be_filtered_by_group_size()
    {
        Pose::factory()->count(2)->forPeopleCount(4)->create();
        Pose::factory()->count(3)->forPeopleCount(3)->create();

        $this->actingAs($this->user)
            ->get(route('admin.poses.index', ['people_count' => 4]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('poses.data', 2));
    }

    public function test_poses_can_be_searched_by_name()
    {
        Pose::factory()->forPeopleCount(4)->create(['name' => 'Side By Side']);
        Pose::factory()->forPeopleCount(4)->create(['name' => 'Back To Back']);

        $this->actingAs($this->user)
            ->get(route('admin.poses.index', ['search' => 'Side']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('poses.data', 1));
    }

    public function test_poses_can_be_filtered_by_status()
    {
        Pose::factory()->count(2)->forPeopleCount(4)->create();
        Pose::factory()->count(4)->forPeopleCount(4)->inactive()->create();

        $this->actingAs($this->user)
            ->get(route('admin.poses.index', ['status' => 'inactive']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('poses.data', 4));
    }

    public function test_an_administrator_can_update_a_pose()
    {
        $pose = Pose::factory()->forPeopleCount(4)->create();
        $category = Category::factory()->create();

        $this->actingAs($this->user)
            ->put(route('admin.poses.update', $pose), [
                'name' => 'Leaning In',
                'people_count' => 3,
                'category_id' => $category->id,
                'instruction' => 'Lean toward the center.',
                'active' => false,
                'sort_order' => 5,
            ])
            ->assertRedirect(route('admin.poses.index'));

        $pose->refresh();

        $this->assertSame('Leaning In', $pose->name);
        $this->assertSame(3, $pose->people_count);
        $this->assertSame($category->id, $pose->category_id);
        $this->assertFalse($pose->active);
        $this->assertSame(5, $pose->sort_order);
    }

    public function test_an_inactive_pose_is_never_recommended()
    {
        $pose = Pose::factory()->forPeopleCount(4)->create();

        $this->actingAs($this->user)->put(route('admin.poses.update', $pose), [
            'name' => $pose->name,
            'people_count' => 4,
            'category_id' => null,
            'instruction' => null,
            'active' => false,
            'sort_order' => 0,
        ]);

        $this->getJson(route('api.booth.poses'))
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->assertDatabaseHas('poses', ['id' => $pose->id]);
    }

    public function test_deleting_a_pose_removes_its_stored_images()
    {
        $pose = Pose::factory()->forPeopleCount(4)->create();

        Storage::disk('public')->put($pose->image_path, 'image');
        Storage::disk('public')->put($pose->thumbnail_path, 'thumbnail');

        $this->actingAs($this->user)
            ->delete(route('admin.poses.destroy', $pose))
            ->assertRedirect();

        $this->assertDatabaseMissing('poses', ['id' => $pose->id]);
        Storage::disk('public')->assertMissing($pose->image_path);
        Storage::disk('public')->assertMissing($pose->thumbnail_path);
    }

    public function test_poses_can_be_activated_in_bulk()
    {
        $poses = Pose::factory()->count(3)->forPeopleCount(4)->inactive()->create();

        $this->actingAs($this->user)
            ->post(route('admin.poses.bulk-action'), [
                'action' => 'activate',
                'ids' => $poses->modelKeys(),
            ])
            ->assertRedirect();

        $this->assertSame(3, Pose::query()->where('active', true)->count());
    }

    public function test_poses_can_be_deactivated_in_bulk()
    {
        $poses = Pose::factory()->count(3)->forPeopleCount(4)->create();

        $this->actingAs($this->user)->post(route('admin.poses.bulk-action'), [
            'action' => 'deactivate',
            'ids' => $poses->modelKeys(),
        ]);

        $this->assertSame(0, Pose::query()->where('active', true)->count());
    }

    public function test_poses_can_be_deleted_in_bulk()
    {
        $poses = Pose::factory()->count(3)->forPeopleCount(4)->create();

        foreach ($poses as $pose) {
            Storage::disk('public')->put($pose->image_path, 'image');
        }

        $this->actingAs($this->user)->post(route('admin.poses.bulk-action'), [
            'action' => 'delete',
            'ids' => $poses->modelKeys(),
        ]);

        $this->assertSame(0, Pose::query()->count());
        Storage::disk('public')->assertMissing($poses->first()->image_path);
    }

    public function test_an_unknown_bulk_action_is_rejected()
    {
        $pose = Pose::factory()->forPeopleCount(4)->create();

        $this->actingAs($this->user)
            ->post(route('admin.poses.bulk-action'), [
                'action' => 'explode',
                'ids' => [$pose->id],
            ])
            ->assertSessionHasErrors('action');
    }
}
