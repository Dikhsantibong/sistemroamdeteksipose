<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PeopleCountRequest;
use App\Models\PeopleCount;
use App\Models\Pose;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PeopleCountController extends Controller
{
    /**
     * List the supported group sizes.
     */
    public function index(): Response
    {
        $poseTotals = Pose::query()
            ->selectRaw('people_count, count(*) as total')
            ->groupBy('people_count')
            ->pluck('total', 'people_count');

        $peopleCounts = PeopleCount::query()
            ->ordered()
            ->get()
            ->map(fn (PeopleCount $peopleCount): array => [
                ...$peopleCount->toArray(),
                'poses_count' => (int) ($poseTotals[$peopleCount->count] ?? 0),
            ]);

        return Inertia::render('admin/people-counts/index', [
            'peopleCounts' => $peopleCounts,
        ]);
    }

    /**
     * Add a supported group size.
     */
    public function store(PeopleCountRequest $request): RedirectResponse
    {
        PeopleCount::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Group size added.')]);

        return back();
    }

    /**
     * Update a supported group size.
     */
    public function update(PeopleCountRequest $request, PeopleCount $peopleCount): RedirectResponse
    {
        $peopleCount->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Group size updated.')]);

        return back();
    }

    /**
     * Delete a supported group size. Existing poses are left untouched.
     */
    public function destroy(PeopleCount $peopleCount): RedirectResponse
    {
        $peopleCount->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Group size deleted.')]);

        return back();
    }
}
