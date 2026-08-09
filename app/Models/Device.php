<?php

namespace App\Models;

use Database\Factories\DeviceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int|null $booth_id
 * @property string $name
 * @property string $uuid
 * @property string $token_hash
 * @property Carbon|null $last_seen_at
 * @property string|null $app_version
 * @property string|null $content_version
 * @property bool $active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read bool $is_online
 * @property-read Booth|null $booth
 */
#[Fillable(['booth_id', 'name', 'uuid', 'token_hash', 'last_seen_at', 'app_version', 'content_version', 'active'])]
#[Hidden(['token_hash'])]
class Device extends Model
{
    /** @use HasFactory<DeviceFactory> */
    use HasFactory;

    /**
     * The number of minutes a device is considered online after its last heartbeat.
     */
    public const ONLINE_THRESHOLD_MINUTES = 5;

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = ['is_online'];

    /**
     * Generate a new plain-text device token.
     */
    public static function generateToken(): string
    {
        return Str::random(60);
    }

    /**
     * Hash a plain-text device token for storage and lookup.
     */
    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * Get the booth the device is installed in.
     *
     * @return BelongsTo<Booth, $this>
     */
    public function booth(): BelongsTo
    {
        return $this->belongsTo(Booth::class);
    }

    /**
     * Determine whether the device sent a heartbeat recently.
     *
     * @return Attribute<bool, never>
     */
    protected function isOnline(): Attribute
    {
        return Attribute::get(fn (): bool => $this->last_seen_at !== null
            && $this->last_seen_at->gt(now()->subMinutes(self::ONLINE_THRESHOLD_MINUTES)));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
            'active' => 'boolean',
        ];
    }
}
