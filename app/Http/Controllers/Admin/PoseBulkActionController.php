<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PoseBulkActionRequest;
use App\Models\Pose;
use App\Services\PoseImageProcessor;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class PoseBulkActionController extends Controller
{
    public function __construct(protected PoseImageProcessor $images) {}

    /**
     * Apply an activate, deactivate or delete action to many poses at once.
     */
    public function store(PoseBulkActionRequest $request): RedirectResponse
    {
        $ids = $request->poseIds();
        $poses = Pose::query()->whereIn('id', $ids)->get();

        $message = match ($request->action()) {
            'activate' => $this->setActiveState($ids, true),
            'deactivate' => $this->setActiveState($ids, false),
            'categorize' => $this->setCategory($ids, $request->categoryId()),
            default => $this->deletePoses($poses),
        };

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    /**
     * Activate or deactivate the given poses.
     *
     * @param  list<int>  $ids
     */
    protected function setActiveState(array $ids, bool $active): string
    {
        $affected = Pose::query()->whereIn('id', $ids)->update(['active' => $active]);

        return $active
            ? __(':count poses activated.', ['count' => $affected])
            : __(':count poses deactivated.', ['count' => $affected]);
    }

    /**
     * Move the given poses into a category, or out of every category.
     *
     * @param  list<int>  $ids
     */
    protected function setCategory(array $ids, ?int $categoryId): string
    {
        $affected = Pose::query()
            ->whereIn('id', $ids)
            ->update(['category_id' => $categoryId]);

        return $categoryId === null
            ? __(':count poses removed from their category.', ['count' => $affected])
            : __(':count poses moved.', ['count' => $affected]);
    }

    /**
     * Delete the given poses along with their stored images.
     *
     * @param  Collection<int, Pose>  $poses
     */
    protected function deletePoses(Collection $poses): string
    {
        foreach ($poses as $pose) {
            $this->images->delete($pose->image_path, $pose->thumbnail_path);
        }

        Pose::query()->whereIn('id', $poses->modelKeys())->delete();

        return __(':count poses deleted.', ['count' => $poses->count()]);
    }
}
