<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DeviceUpdateRequest;
use App\Models\Booth;
use App\Models\Device;
use App\Services\ContentVersion;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    /**
     * List the registered booth tablets.
     */
    public function index(ContentVersion $contentVersion): Response
    {
        return Inertia::render('admin/devices/index', [
            'devices' => Device::query()
                ->with('booth:id,name')
                ->orderByDesc('last_seen_at')
                ->get(),
            'booths' => Booth::query()->orderBy('name')->get(['id', 'name']),
            'contentVersion' => $contentVersion->current(),
        ]);
    }

    /**
     * Update the editable details of a device.
     */
    public function update(DeviceUpdateRequest $request, Device $device): RedirectResponse
    {
        $device->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Device updated.')]);

        return back();
    }

    /**
     * Remove a device. It will register again the next time it syncs.
     */
    public function destroy(Device $device): RedirectResponse
    {
        $device->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Device removed.')]);

        return back();
    }
}
