<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Pose;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    public function test_guests_cannot_manage_categories()
    {
        $this->get(route('admin.categories.index'))->assertRedirect(route('login'));
    }

    public function test_an_administrator_can_add_a_category_without_a_developer()
    {
        $this->actingAs($this->user)
            ->post(route('admin.categories.store'), [
                'name' => 'Group Funny',
                'active' => true,
                'sort_order' => 3,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('categories', [
            'name' => 'Group Funny',
            'slug' => 'group-funny',
            'sort_order' => 3,
        ]);
    }

    public function test_category_names_must_be_unique()
    {
        Category::factory()->create(['name' => 'Casual']);

        $this->actingAs($this->user)
            ->post(route('admin.categories.store'), [
                'name' => 'Casual',
                'active' => true,
                'sort_order' => 0,
            ])
            ->assertSessionHasErrors('name');
    }

    public function test_an_administrator_can_rename_a_category()
    {
        $category = Category::factory()->create(['name' => 'Casual']);

        $this->actingAs($this->user)
            ->put(route('admin.categories.update', $category), [
                'name' => 'Everyday',
                'active' => false,
                'sort_order' => 1,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $category->refresh();

        $this->assertSame('Everyday', $category->name);
        $this->assertSame('everyday', $category->slug);
        $this->assertFalse($category->active);
    }

    public function test_deleting_a_category_leaves_its_poses_intact()
    {
        $category = Category::factory()->create();
        $pose = Pose::factory()->create(['category_id' => $category->id]);

        $this->actingAs($this->user)
            ->delete(route('admin.categories.destroy', $category))
            ->assertRedirect();

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
        $this->assertNull($pose->fresh()->category_id);
    }
}
