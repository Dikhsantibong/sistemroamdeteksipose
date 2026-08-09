<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Device;
use App\Models\PeopleCount;
use App\Models\Pose;
use App\Services\ContentVersion;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the administrator overview.
     */
    public function index(ContentVersion $contentVersion): Response
    {
        $posesByPeopleCount = Pose::query()
            ->active()
            ->selectRaw('people_count, count(*) as total')
            ->groupBy('people_count')
            ->pluck('total', 'people_count');

        $coverage = PeopleCount::query()
            ->active()
            ->ordered()
            ->get()
            ->map(fn (PeopleCount $peopleCount): array => [
                'count' => $peopleCount->count,
                'label' => $peopleCount->label,
                'poses' => (int) ($posesByPeopleCount[$peopleCount->count] ?? 0),
            ])
            ->values();

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'poses' => Pose::query()->count(),
                'activePoses' => Pose::query()->active()->count(),
                'categories' => Category::query()->count(),
                'peopleCounts' => PeopleCount::query()->count(),
                'devicesOnline' => Device::query()
                    ->where('last_seen_at', '>', now()->subMinutes(Device::ONLINE_THRESHOLD_MINUTES))
                    ->count(),
                'devices' => Device::query()->count(),
            ],
            'coverage' => $coverage,
            'contentVersion' => $contentVersion->current(),
        ]);
    }
}
