import { Head, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import admin from '@/routes/admin';
import type { Booth, Device } from '@/types';

export default function DeviceIndex({
    devices,
    contentVersion,
}: {
    devices: Device[];
    booths: Booth[];
    contentVersion: string;
}) {
    const toggleActive = (device: Device) => {
        router.put(
            admin.devices.update(device.id).url,
            {
                name: device.name,
                booth_id: device.booth_id,
                active: !device.active,
            },
            { preserveScroll: true },
        );
    };

    const destroy = (device: Device) => {
        if (
            window.confirm(
                `Remove "${device.name}"? It registers again the next time it syncs.`,
            )
        ) {
            router.delete(admin.devices.destroy(device.id).url, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Devices" />

            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Devices"
                    description="Tablets running booth mode. A device is online when it sent a heartbeat in the last few minutes."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Registered tablets</CardTitle>
                        <CardDescription>
                            Current content version:{' '}
                            <code className="font-mono">{contentVersion}</code>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        {devices.length === 0 ? (
                            <p className="py-6 text-sm text-muted-foreground">
                                No tablets have registered yet. Open{' '}
                                <code className="font-mono">/install</code> on a
                                tablet to get started.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">
                                            Device
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Booth
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Status
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Last seen
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            App version
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Content version
                                        </th>
                                        <th className="py-2 font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {devices.map((device) => (
                                        <tr
                                            key={device.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-2 pr-4 font-medium">
                                                {device.name}
                                            </td>
                                            <td className="py-2 pr-4 text-muted-foreground">
                                                {device.booth?.name ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Badge
                                                    variant={
                                                        device.is_online
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {device.is_online
                                                        ? 'Online'
                                                        : 'Offline'}
                                                </Badge>
                                                {!device.active && (
                                                    <Badge
                                                        variant="outline"
                                                        className="ml-2"
                                                    >
                                                        Disabled
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 text-muted-foreground">
                                                {device.last_seen_at
                                                    ? new Date(
                                                          device.last_seen_at,
                                                      ).toLocaleString()
                                                    : 'Never'}
                                            </td>
                                            <td className="py-2 pr-4 font-mono text-xs">
                                                {device.app_version ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4 font-mono text-xs">
                                                {device.content_version ?? '—'}
                                            </td>
                                            <td className="flex gap-2 py-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        toggleActive(device)
                                                    }
                                                >
                                                    {device.active
                                                        ? 'Disable'
                                                        : 'Enable'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        destroy(device)
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

DeviceIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: admin.dashboard() },
        { title: 'Devices', href: admin.devices.index() },
    ],
};
