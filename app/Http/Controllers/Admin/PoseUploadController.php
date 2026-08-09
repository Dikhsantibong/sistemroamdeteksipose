<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PoseUploadRequest;
use App\Models\Category;
use App\Models\PeopleCount;
use App\Models\Pose;
use App\Services\PoseImageProcessor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PoseUploadController extends Controller
{
    public function __construct(protected PoseImageProcessor $images) {}

    /**
     * Show the bulk upload screen.
     */
    public function create(): Response
    {
        return Inertia::render('admin/poses/upload', [
            'categories' => Category::query()->ordered()->get(['id', 'name']),
            'peopleCounts' => PeopleCount::query()->ordered()->get(['count', 'label']),
            'limits' => [
                'maxFiles' => config('booth.images.max_batch_files'),
                'maxKilobytes' => config('booth.images.max_upload_kilobytes'),
            ],
        ]);
    }

    /**
     * Process a batch of uploaded images into pose records.
     *
     * The batch metadata (group size, category, instruction) is applied to every
     * file. A failure on one file never aborts the rest of the batch: the admin
     * is told exactly which files did not make it.
     */
    public function store(PoseUploadRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $uploaded = 0;
        $failed = [];
        $sortOrder = (int) Pose::query()->where('people_count', $validated['people_count'])->max('sort_order');

        /** @var UploadedFile $file */
        foreach ($request->file('images') as $file) {
            try {
                $stored = $this->images->store($file);

                Pose::query()->create([
                    ...$stored,
                    'category_id' => $validated['category_id'] ?? null,
                    'name' => $this->nameFor($file),
                    'people_count' => $validated['people_count'],
                    'instruction' => $validated['instruction'] ?? null,
                    'original_filename' => $file->getClientOriginalName(),
                    'active' => $validated['active'],
                    'sort_order' => ++$sortOrder,
                ]);

                $uploaded++;
            } catch (Throwable $exception) {
                Log::warning('Pose upload failed.', [
                    'file' => $file->getClientOriginalName(),
                    'message' => $exception->getMessage(),
                ]);

                $failed[] = $file->getClientOriginalName();
            }
        }

        Inertia::flash('toast', [
            'type' => $failed === [] ? 'success' : 'warning',
            'message' => $failed === []
                ? __(':count uploaded successfully.', ['count' => $uploaded])
                : __(':uploaded uploaded successfully, :failed failed: :names', [
                    'uploaded' => $uploaded,
                    'failed' => count($failed),
                    'names' => implode(', ', $failed),
                ]),
        ]);

        return to_route('admin.poses.index', ['people_count' => $validated['people_count']]);
    }

    /**
     * Derive a readable pose name from the uploaded file name.
     */
    protected function nameFor(UploadedFile $file): string
    {
        $name = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
            ->replaceMatches('/[_\-]+/', ' ')
            ->squish()
            ->limit(110, '')
            ->title()
            ->value();

        return $name === '' ? 'Untitled Pose' : $name;
    }
}
