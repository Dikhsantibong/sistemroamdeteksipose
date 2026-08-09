import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import admin from '@/routes/admin';

type Stats = {
    poses: number;
    activePoses: number;
    categories: number;
    peopleCounts: number;
    devicesOnline: number;
    devices: number;
};

type Coverage = {
    count: number;
    label: string;
    poses: number;
};

export default function AdminDashboard({
    stats,
    coverage,
    contentVersion,
}: {
    stats: Stats;
    coverage: Coverage[];
    contentVersion: string;
}) {
    const summary = [
        {
            label: 'Active poses',
            value: `${stats.activePoses} / ${stats.poses}`,
        },
        { label: 'Categories', value: stats.categories },
        { label: 'Group sizes', value: stats.peopleCounts },
        {
            label: 'Devices online',
            value: `${stats.devicesOnline} / ${stats.devices}`,
        },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <Heading
                        title="Pose assistant"
                        description="Manage the pose library the booth tablet shows to customers."
                    />
                    <Button asChild>
                        <Link href={admin.poses.upload()}>Upload poses</Link>
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summary.map((item) => (
                        <Card key={item.label}>
                            <CardHeader>
                                <CardDescription>{item.label}</CardDescription>
                                <CardTitle className="text-2xl">
                                    {item.value}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pose coverage</CardTitle>
                        <CardDescription>
                            Active poses available for each group size. A group
                            size with no poses shows an empty state on the
                            tablet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {coverage.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No group sizes configured yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-2 pr-4 font-medium">
                                                Group size
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Active poses
                                            </th>
                                            <th className="py-2 font-medium">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coverage.map((row) => (
                                            <tr
                                                key={row.count}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-2 pr-4">
                                                    {row.label}
                                                </td>
                                                <td className="py-2 pr-4 tabular-nums">
                                                    {row.poses}
                                                </td>
                                                <td className="py-2">
                                                    {row.poses === 0 ? (
                                                        <Link
                                                            className="text-destructive underline underline-offset-4"
                                                            href={admin.poses.upload()}
                                                        >
                                                            No poses yet
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            Ready
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Content version</CardTitle>
                        <CardDescription>
                            Tablets compare this value against their cached copy
                            and re-sync when it changes. No reinstall is needed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <code className="rounded-md border px-2 py-1 font-mono text-sm">
                            {contentVersion}
                        </code>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: admin.dashboard() }],
};
