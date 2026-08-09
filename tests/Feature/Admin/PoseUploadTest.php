<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\PeopleCount;
use App\Models\Pose;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PoseUploadTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->user = User::factory()->create();
        PeopleCount::factory()->create(['count' => 4]);
    }

    /**
     * Build a real image so the GD based processor has something to work with.
     */
    protected function image(string $name = 'pose.jpg'): UploadedFile
    {
        return UploadedFile::fake()->image($name, 1600, 1200);
    }

    public function test_guests_cannot_reach_the_upload_screen()
    {
        $this->get(route('admin.poses.upload'))->assertRedirect(route('login'));
    }

    public function test_an_administrator_can_upload_a_single_pose()
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->user)->post(route('admin.poses.upload.store'), [
            'images' => [$this->image('side by side.jpg')],
            'people_count' => 4,
            'category_id' => $category->id,
            'instruction' => 'Lean toward the center.',
            'active' => true,
        ]);

        $response->assertRedirect();

        $pose = Pose::query()->sole();

        $this->assertSame('Side By Side', $pose->name);
        $this->assertSame(4, $pose->people_count);
        $this->assertSame($category->id, $pose->category_id);
        $this->assertSame('Lean toward the center.', $pose->instruction);
        $this->assertTrue($pose->active);
        Storage::disk('public')->assertExists($pose->image_path);
        Storage::disk('public')->assertExists($pose->thumbnail_path);
    }

    public function test_batch_metadata_is_applied_to_every_uploaded_image()
    {
        $category = Category::factory()->create();

        $this->actingAs($this->user)->post(route('admin.poses.upload.store'), [
            'images' => [$this->image('a.jpg'), $this->image('b.jpg'), $this->image('c.jpg')],
            'people_count' => 4,
            'category_id' => $category->id,
            'active' => true,
        ])->assertRedirect();

        $poses = Pose::query()->get();

        $this->assertCount(3, $poses);
        $this->assertEquals([4], $poses->pluck('people_count')->unique()->values()->all());
        $this->assertEquals([$category->id], $poses->pluck('category_id')->unique()->values()->all());
        $this->assertEquals([1, 2, 3], $poses->pluck('sort_order')->sort()->values()->all());
    }

    public function test_uploaded_images_are_converted_and_given_a_thumbnail()
    {
        $this->actingAs($this->user)->post(route('admin.poses.upload.store'), [
            'images' => [$this->image()],
            'people_count' => 4,
            'active' => true,
        ]);

        $pose = Pose::query()->sole();

        $this->assertStringEndsWith('.webp', $pose->image_path);
        $this->assertStringEndsWith('.webp', $pose->thumbnail_path);
        $this->assertLessThanOrEqual(config('booth.images.max_width'), $pose->width);
        $this->assertLessThanOrEqual(config('booth.images.max_height'), $pose->height);
        $this->assertGreaterThan(0, $pose->file_size);
    }

    public function test_it_rejects_files_that_are_not_images()
    {
        $this->actingAs($this->user)
            ->post(route('admin.poses.upload.store'), [
                'images' => [UploadedFile::fake()->create('malware.php', 20, 'application/x-php')],
                'people_count' => 4,
                'active' => true,
            ])
            ->assertSessionHasErrors('images.0');

        $this->assertSame(0, Pose::query()->count());
    }

    public function test_it_rejects_images_that_are_too_large()
    {
        $oversized = UploadedFile::fake()->create(
            'huge.jpg',
            config('booth.images.max_upload_kilobytes') + 1024,
            'image/jpeg',
        );

        $this->actingAs($this->user)
            ->post(route('admin.poses.upload.store'), [
                'images' => [$oversized],
                'people_count' => 4,
                'active' => true,
            ])
            ->assertSessionHasErrors('images.0');
    }

    public function test_it_rejects_an_unknown_group_size()
    {
        $this->actingAs($this->user)
            ->post(route('admin.poses.upload.store'), [
                'images' => [$this->image()],
                'people_count' => 99,
                'active' => true,
            ])
            ->assertSessionHasErrors('people_count');
    }

    public function test_it_rejects_a_batch_larger_than_the_configured_limit()
    {
        $images = array_map(
            fn (int $index): UploadedFile => $this->image("pose-{$index}.jpg"),
            range(1, config('booth.images.max_batch_files') + 1),
        );

        $this->actingAs($this->user)
            ->post(route('admin.poses.upload.store'), [
                'images' => $images,
                'people_count' => 4,
                'active' => true,
            ])
            ->assertSessionHasErrors('images');
    }

    public function test_uploading_the_same_file_twice_creates_two_independent_poses()
    {
        $this->actingAs($this->user)->post(route('admin.poses.upload.store'), [
            'images' => [$this->image('duplicate.jpg'), $this->image('duplicate.jpg')],
            'people_count' => 4,
            'active' => true,
        ]);

        $poses = Pose::query()->get();

        $this->assertCount(2, $poses);
        $this->assertCount(2, $poses->pluck('image_path')->unique());
    }
}
