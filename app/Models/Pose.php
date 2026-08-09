<?php

namespace App\Models;

use Database\Factories\PoseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int|null $category_id
 * @property string $name
 * @property int $people_count
 * @property string|null $instruction
 * @property string $image_path
 * @property string $thumbnail_path
 * @property string|null $original_filename
 * @property int|null $width
 * @property int|null $height
 * @property int|null $file_size
 * @property bool $active
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read string $image_url
 * @property-read string $thumbnail_url
 * @property-read Category|null $category
 */
#[Fillable([
    'category_id',
    'name',
    'people_count',
    'instruction',
    'image_path',
    'thumbnail_path',
    'original_filename',
    'width',
    'height',
    'file_size',
    'active',
    'sort_order',
])]
class Pose extends Model
{
    /** @use HasFactory<PoseFactory> */
    use HasFactory;

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = ['image_url', 'thumbnail_url'];

    /**
     * Get the category the pose belongs to.
     *
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the publicly accessible URL of the optimized pose image.
     *
     * @return Attribute<string, never>
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::get(fn (): string => Storage::disk('public')->url($this->image_path));
    }

    /**
     * Get the publicly accessible URL of the pose thumbnail.
     *
     * @return Attribute<string, never>
     */
    protected function thumbnailUrl(): Attribute
    {
        return Attribute::get(fn (): string => Storage::disk('public')->url($this->thumbnail_path));
    }

    /**
     * Scope the query to poses that are active.
     *
     * @param  Builder<Pose>  $query
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('active', true);
    }

    /**
     * Scope the query to poses matching the given group size.
     *
     * @param  Builder<Pose>  $query
     */
    #[Scope]
    protected function forPeopleCount(Builder $query, int $peopleCount): void
    {
        $query->where('people_count', $peopleCount);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'people_count' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'file_size' => 'integer',
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
