<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PoseUpdateRequest;
use App\Models\Category;
use App\Models\PeopleCount;
use App\Models\Pose;
use App\Services\PoseImageProcessor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PoseController extends Controller
{
    public function __construct(protected PoseImageProcessor $images) {}

    /**
     * List the poses with search and filter support.
     */
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search')) ?: null,
            'people_count' => $request->filled('people_count') ? (int) $request->query('people_count') : null,
            'category_id' => $request->filled('category_id') ? (int) $request->query('category_id') : null,
            'status' => in_array($request->query('status'), ['active', 'inactive'], true) ? $request->query('status') : null,
        ];

        $poses = Pose::query()
            ->with('category:id,name')
            ->when($filters['search'], fn ($query, string $search) => $query->where('name', 'like', "%{$search}%"))
            ->when($filters['people_count'], fn ($query, int $count) => $query->where('people_count', $count))
            ->when($filters['category_id'], fn ($query, int $categoryId) => $query->where('category_id', $categoryId))
            ->when($filters['status'], fn ($query, string $status) => $query->where('active', $status === 'active'))
            ->orderBy('people_count')
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('admin/poses/index', [
            'poses' => $poses,
            'filters' => $filters,
            'categories' => Category::query()->ordered()->get(['id', 'name']),
            'peopleCounts' => PeopleCount::query()->ordered()->get(['count', 'label']),
        ]);
    }

    /**
     * Show the edit form for a single pose.
     */
    public function edit(Pose $pose): Response
    {
        return Inertia::render('admin/poses/edit', [
            'pose' => $pose->load('category:id,name'),
            'categories' => Category::query()->ordered()->get(['id', 'name']),
            'peopleCounts' => PeopleCount::query()->ordered()->get(['count', 'label']),
        ]);
    }

    /**
     * Update a pose.
     */
    public function update(PoseUpdateRequest $request, Pose $pose): RedirectResponse
    {
        $pose->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pose updated.')]);

        return to_route('admin.poses.index');
    }

    /**
     * Delete a pose along with its stored images.
     */
    public function destroy(Pose $pose): RedirectResponse
    {
        $this->images->delete($pose->image_path, $pose->thumbnail_path);

        $pose->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pose deleted.')]);

        return back();
    }
}
