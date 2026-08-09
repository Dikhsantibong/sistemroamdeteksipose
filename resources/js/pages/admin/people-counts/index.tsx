import { Head, router, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import admin from '@/routes/admin';
import type { PeopleCount } from '@/types';

export default function PeopleCountIndex({
    peopleCounts,
}: {
    peopleCounts: PeopleCount[];
}) {
    const form = useForm({
        count: '',
        label: '',
        active: true,
        sort_order: '0',
    });

    const toggleActive = (peopleCount: PeopleCount) => {
        router.put(
            admin.peopleCounts.update(peopleCount.id).url,
            {
                count: peopleCount.count,
                label: peopleCount.label,
                sort_order: peopleCount.sort_order,
                active: !peopleCount.active,
            },
            { preserveScroll: true },
        );
    };

    const destroy = (peopleCount: PeopleCount) => {
        if (
            window.confirm(
                `Remove "${peopleCount.label}"? Existing poses keep their data but this size can no longer be selected.`,
            )
        ) {
            router.delete(admin.peopleCounts.destroy(peopleCount.id).url, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Group sizes" />

            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Group sizes"
                    description="The number of people the booth can recognise. Add more sizes here instead of changing code."
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add group size</CardTitle>
                            <CardDescription>
                                For example 7 people for a large group.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="count">People</Label>
                                <Input
                                    id="count"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={form.data.count}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        form.setData((current) => ({
                                            ...current,
                                            count: value,
                                            label:
                                                value === '1'
                                                    ? '1 person'
                                                    : value
                                                      ? `${value} people`
                                                      : '',
                                            sort_order: value || '0',
                                        }));
                                    }}
                                />
                                <InputError message={form.errors.count} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="label">Label</Label>
                                <Input
                                    id="label"
                                    value={form.data.label}
                                    onChange={(event) =>
                                        form.setData(
                                            'label',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="7 people"
                                />
                                <InputError message={form.errors.label} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="active"
                                    checked={form.data.active}
                                    onCheckedChange={(checked) =>
                                        form.setData('active', checked === true)
                                    }
                                />
                                <Label htmlFor="active">Active</Label>
                            </div>

                            <Button
                                type="button"
                                disabled={form.processing}
                                onClick={() =>
                                    form.post(admin.peopleCounts.store().url, {
                                        preserveScroll: true,
                                        onSuccess: () => form.reset(),
                                    })
                                }
                            >
                                Add group size
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Supported sizes</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            {peopleCounts.length === 0 ? (
                                <p className="py-6 text-sm text-muted-foreground">
                                    No group sizes configured. The booth cannot
                                    recommend anything yet.
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-2 pr-4 font-medium">
                                                People
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Label
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Poses
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Status
                                            </th>
                                            <th className="py-2 font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {peopleCounts.map((peopleCount) => (
                                            <tr
                                                key={peopleCount.id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="py-2 pr-4 tabular-nums">
                                                    {peopleCount.count}
                                                </td>
                                                <td className="py-2 pr-4 font-medium">
                                                    {peopleCount.label}
                                                </td>
                                                <td className="py-2 pr-4 tabular-nums">
                                                    {peopleCount.poses_count}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <Badge
                                                        variant={
                                                            peopleCount.active
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {peopleCount.active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="flex gap-2 py-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            toggleActive(
                                                                peopleCount,
                                                            )
                                                        }
                                                    >
                                                        {peopleCount.active
                                                            ? 'Deactivate'
                                                            : 'Activate'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            destroy(peopleCount)
                                                        }
                                                    >
                                                        Delete
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
            </div>
        </>
    );
}

PeopleCountIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: admin.dashboard() },
        { title: 'Group sizes', href: admin.peopleCounts.index() },
    ],
};
