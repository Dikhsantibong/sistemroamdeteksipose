<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SettingUpdateRequest;
use App\Services\BoothSettings;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(protected BoothSettings $settings) {}

    /**
     * Show the booth settings form.
     */
    public function edit(): Response
    {
        return Inertia::render('admin/settings', [
            'values' => $this->settings->all(),
            'definitions' => collect($this->settings->definitions())
                ->map(fn (array $definition, string $key): array => [
                    'key' => $key,
                    'type' => $definition['type'],
                    'group' => $definition['group'],
                    'label' => $definition['label'],
                    'description' => $definition['description'],
                ])
                ->values(),
        ]);
    }

    /**
     * Persist the booth settings.
     */
    public function update(SettingUpdateRequest $request): RedirectResponse
    {
        $this->settings->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings saved.')]);

        return to_route('admin.settings.edit');
    }
}
