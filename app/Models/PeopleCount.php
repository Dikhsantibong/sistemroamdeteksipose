<?php

namespace App\Models;

use Database\Factories\PeopleCountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $count
 * @property string $label
 * @property bool $active
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['count', 'label', 'active', 'sort_order'])]
class PeopleCount extends Model
{
    /** @use HasFactory<PeopleCountFactory> */
    use HasFactory;

    /**
     * Get the poses recorded for this group size.
     *
     * @return HasMany<Pose, $this>
     */
    public function poses(): HasMany
    {
        return $this->hasMany(Pose::class, 'people_count', 'count');
    }

    /**
     * Scope the query to group sizes that are active.
     *
     * @param  Builder<PeopleCount>  $query
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('active', true);
    }

    /**
     * Scope the query to the display order used across the application.
     *
     * @param  Builder<PeopleCount>  $query
     */
    #[Scope]
    protected function ordered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('count');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'count' => 'integer',
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
