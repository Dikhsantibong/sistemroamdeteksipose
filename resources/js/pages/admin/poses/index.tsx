import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import admin from '@/routes/admin';
import type { Category, Paginated, PeopleCount, Pose } from '@/types';

type Filters = {
    search: string | null;
    people_count: number | null;
    category_id: number | null;
    status: 'active' | 'inactive' | null;
};

const ANY = 'any';

export default function PoseIndex({
    poses,
    filters,
    categories,
    peopleCounts,
}: {
    poses: Paginated<Pose>;
    filters: Filters;
    categories: Pick<Category, 'id' | 'name'>[];
    peopleCounts: Pick<PeopleCount, 'count' | 'label'>[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<number[]>([]);

    const applyFilters = (overrides: Partial<Filters>) => {
        const next = { ...filters, search, ...overrides };

        router.get(
            admin.poses.index().url,
            {
                search: next.search || undefined,
                people_count: next.people_count ?? undefined,
                category_id: next.category_id ?? undefined,
                status: next.status ?? undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const toggle = (id: number) => {
        setSelected((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
        );
    };

    const runBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
        if (selected.length === 0) {
            return;
        }

        if (
            action === 'delete' &&
            !window.confirm(
                `Delete ${selected.length} pose(s)? This also removes their images.`,
            )
        ) {
            return;
        }

        router.post(
            admin.poses.bulkAction().url,
            { action, ids: selected },
            { preserveScroll: true, onSuccess: () => setSelected([]) },
        );
    };

    return (
        <>
            <Head title="Poses" />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <Heading
                        title="Poses"
                        description="Every pose the booth can recommend. Inactive poses are never shown to customers."
                    />
                    <Button asChild>
                        <Link href={admin.poses.upload()}>Upload poses</Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="grid gap-4 md:grid-cols-4">
                        <div className="grid gap-2">
                            <Label htmlFor="search">Search</Label>
                            <Input
                                id="search"
                                value={search}
                                placeholder="Pose name"
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        applyFilters({});
                                    }
                                }}
                                onBlur={() => applyFilters({})}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Group size</Label>
                            <Select
                                value={
                                    filters.people_count
                                        ? String(filters.people_count)
                                        : ANY
                                }
                                onValueChange={(value) =>
                                    applyFilters({
                                        people_count:
                                            value === ANY
                                                ? null
                                                : Number(value),
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ANY}>All</SelectItem>
                                    {peopleCounts.map((peopleCount) => (
                                        <SelectItem
                                            key={peopleCount.count}
                                            value={String(peopleCount.count)}
                                        >
                                            {peopleCount.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select
                                value={
                                    filters.category_id
                                        ? String(filters.category_id)
                                        : ANY
                                }
                                onValueChange={(value) =>
                                    applyFilters({
                                        category_id:
                                            value === ANY
                                                ? null
                                                : Number(value),
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ANY}>All</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={filters.status ?? ANY}
                                onValueChange={(value) =>
                                    applyFilters({
                                        status:
                                            value === ANY
                                                ? null
                                                : (value as
                                                      'active' | 'inactive'),
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ANY}>All</SelectItem>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {selected.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                        <span className="text-sm">
                            {selected.length} selected
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runBulkAction('activate')}
                        >
                            Activate
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runBulkAction('deactivate')}
                        >
                            Deactivate
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => runBulkAction('delete')}
                        >
                            Delete
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelected([])}
                        >
                            Clear
                        </Button>
                    </div>
                )}

                {poses.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No poses match these filters.
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="w-10 py-2" />
                                        <th className="w-20 py-2 pr-4 font-medium">
                                            Preview
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Name
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Group size
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Category
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Status
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Created
                                        </th>
                                        <th className="py-2 font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poses.data.map((pose) => (
                                        <tr
                                            key={pose.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-2">
                                                <Checkbox
                                                    checked={selected.includes(
                                                        pose.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggle(pose.id)
                                                    }
                                                    aria-label={`Select ${pose.name}`}
                                                />
                                            </td>
                                            <td className="py-2 pr-4">
                                                <img
                                                    src={pose.thumbnail_url}
                                                    alt=""
                                                    loading="lazy"
                                                    className="h-12 w-12 rounded-md border object-cover"
                                                />
                                            </td>
                                            <td className="py-2 pr-4 font-medium">
                                                {pose.name}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
                                                {pose.people_count}
                                            </td>
                                            <td className="py-2 pr-4 text-muted-foreground">
                                                {pose.category?.name ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Badge
                                                    variant={
                                                        pose.active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {pose.active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="py-2 pr-4 text-muted-foreground">
                                                {new Date(
                                                    pose.created_at,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="py-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <Link
                                                        href={admin.poses.edit(
                                                            pose.id,
                                                        )}
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {poses.last_page > 1 && (
                    <div className="flex flex-wrap gap-1">
                        {poses.links.map((link, index) => (
                            <Button
                                key={index}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                                disabled={link.url === null}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        { preserveState: true },
                                    )
                                }
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

PoseIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: admin.dashboard() },
        { title: 'Poses', href: admin.poses.index() },
    ],
};
