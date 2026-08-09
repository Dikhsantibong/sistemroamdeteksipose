import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
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
import type { Category } from '@/types';

export default function CategoryIndex({
    categories,
}: {
    categories: Category[];
}) {
    const [editing, setEditing] = useState<Category | null>(null);

    const createForm = useForm({ name: '', active: true, sort_order: '0' });
    const editForm = useForm({ name: '', active: true, sort_order: '0' });

    const startEditing = (category: Category) => {
        setEditing(category);
        editForm.setDefaults({
            name: category.name,
            active: category.active,
            sort_order: String(category.sort_order),
        });
        editForm.reset();
    };

    const destroy = (category: Category) => {
        if (
            window.confirm(
                `Delete "${category.name}"? Poses in it become uncategorised.`,
            )
        ) {
            router.delete(admin.categories.destroy(category.id).url, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Categories" />

            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Categories"
                    description="Group poses so they can be organised and, later, filtered."
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add category</CardTitle>
                            <CardDescription>
                                New categories are available immediately.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="new-name">Name</Label>
                                <Input
                                    id="new-name"
                                    value={createForm.data.name}
                                    onChange={(event) =>
                                        createForm.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Group Funny"
                                />
                                <InputError message={createForm.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="new-sort">Sort order</Label>
                                <Input
                                    id="new-sort"
                                    type="number"
                                    min={0}
                                    value={createForm.data.sort_order}
                                    onChange={(event) =>
                                        createForm.setData(
                                            'sort_order',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={createForm.errors.sort_order}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="new-active"
                                    checked={createForm.data.active}
                                    onCheckedChange={(checked) =>
                                        createForm.setData(
                                            'active',
                                            checked === true,
                                        )
                                    }
                                />
                                <Label htmlFor="new-active">Active</Label>
                            </div>

                            <Button
                                type="button"
                                disabled={createForm.processing}
                                onClick={() =>
                                    createForm.post(
                                        admin.categories.store().url,
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => createForm.reset(),
                                        },
                                    )
                                }
                            >
                                Add category
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>All categories</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            {categories.length === 0 ? (
                                <p className="py-6 text-sm text-muted-foreground">
                                    No categories yet.
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-2 pr-4 font-medium">
                                                Name
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Poses
                                            </th>
                                            <th className="py-2 pr-4 font-medium">
                                                Order
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
                                        {categories.map((category) => (
                                            <tr
                                                key={category.id}
                                                className="border-b last:border-0"
                                            >
                                                {editing?.id === category.id ? (
                                                    <>
                                                        <td className="py-2 pr-4">
                                                            <Input
                                                                value={
                                                                    editForm
                                                                        .data
                                                                        .name
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    editForm.setData(
                                                                        'name',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={
                                                                    editForm
                                                                        .errors
                                                                        .name
                                                                }
                                                            />
                                                        </td>
                                                        <td className="py-2 pr-4 tabular-nums">
                                                            {
                                                                category.poses_count
                                                            }
                                                        </td>
                                                        <td className="py-2 pr-4">
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                className="w-20"
                                                                value={
                                                                    editForm
                                                                        .data
                                                                        .sort_order
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    editForm.setData(
                                                                        'sort_order',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td className="py-2 pr-4">
                                                            <Checkbox
                                                                checked={
                                                                    editForm
                                                                        .data
                                                                        .active
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    editForm.setData(
                                                                        'active',
                                                                        checked ===
                                                                            true,
                                                                    )
                                                                }
                                                                aria-label="Active"
                                                            />
                                                        </td>
                                                        <td className="flex gap-2 py-2">
                                                            <Button
                                                                size="sm"
                                                                disabled={
                                                                    editForm.processing
                                                                }
                                                                onClick={() =>
                                                                    editForm.put(
                                                                        admin.categories.update(
                                                                            category.id,
                                                                        ).url,
                                                                        {
                                                                            preserveScroll: true,
                                                                            onSuccess:
                                                                                () =>
                                                                                    setEditing(
                                                                                        null,
                                                                                    ),
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    setEditing(
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="py-2 pr-4 font-medium">
                                                            {category.name}
                                                        </td>
                                                        <td className="py-2 pr-4 tabular-nums">
                                                            {
                                                                category.poses_count
                                                            }
                                                        </td>
                                                        <td className="py-2 pr-4 tabular-nums">
                                                            {
                                                                category.sort_order
                                                            }
                                                        </td>
                                                        <td className="py-2 pr-4">
                                                            <Badge
                                                                variant={
                                                                    category.active
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                {category.active
                                                                    ? 'Active'
                                                                    : 'Inactive'}
                                                            </Badge>
                                                        </td>
                                                        <td className="flex gap-2 py-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    startEditing(
                                                                        category,
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    destroy(
                                                                        category,
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </Button>
                                                        </td>
                                                    </>
                                                )}
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

CategoryIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: admin.dashboard() },
        { title: 'Categories', href: admin.categories.index() },
    ],
};
