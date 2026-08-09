<?php

namespace App\Http\Resources\Booth;

use App\Models\Pose;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Pose
 */
class PoseResource extends JsonResource
{
    /**
     * Transform the resource into the payload cached by the booth tablet.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'people_count' => $this->people_count,
            'instruction' => $this->instruction,
            'image_url' => $this->image_url,
            'thumbnail_url' => $this->thumbnail_url,
            'category' => $this->whenLoaded('category', fn (): ?array => $this->category === null ? null : [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ]),
            'sort_order' => $this->sort_order,
        ];
    }
}
