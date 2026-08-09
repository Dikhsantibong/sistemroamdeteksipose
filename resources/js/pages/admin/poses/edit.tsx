import { Head, Link, router, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import admin from '@/routes/admin';
import type { Category, PeopleCount, Pose } from '@/types';

const NO_CATEGORY = 'none';

export default function PoseEdit({
    pose,
    categories,
    peopleCounts,
}: {
    pose: Pose;
    categories: Pick<Category, 'id' | 'name'>[];
    peopleCounts: Pick<PeopleCount, 'count' | 'label'>[];
}) {
    const { data, setData, put, processing, errors, transform } = useForm({
        name: pose.name,
        people_count: String(pose.people_count),
        category_id: pose.category_id ? String(pose.category_id) : NO_CATEGORY,
        instruction: pose.instruction ?? '',
        active: pose.active,
        sort_order: String(pose.sort_order),
    });

    const submit = () => {
        transform((payload) => ({
            ...payload,
            category_id:
                payload.category_id === NO_CATEGORY ? '' : payload.category_id,
        }));

        put(admin.poses.update(pose.id).url);
    };

    const destroy = () => {
        if (
            window.confirm(
                'Delete this pose? The stored image is removed as well.',
            )
        ) {
            router.delete(admin.poses.destroy(pose.id).url);
        }
    };

    return (
        <>
            <Head title={`Edit ${pose.name}`} />

            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Edit pose"
                    description="Change the details the booth shows alongside this photo."
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Photo</CardTitle>
                            <CardDescription>
                                {pose.width} × {pose.height} px
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <img
                                src={pose.image_url}
                                alt={pose.name}
                                className="w-full rounded-lg border object-cover"
                            />
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(event) =>
                                        setData('name', event.target.value)
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Group size</Label>
                                    <Select
                                        value={data.people_count}
                                        onValueChange={(value) =>
                                            setData('people_count', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {peopleCounts.map((peopleCount) => (
                                                <SelectItem
                                                    key={peopleCount.count}
                                                    value={String(
                                                        peopleCount.count,
                                                    )}
                                                >
                                                    {peopleCount.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.people_count} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={data.category_id}
                                        onValueChange={(value) =>
                                            setData('category_id', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NO_CATEGORY}>
                                                No category
                                            </SelectItem>
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
                                    <InputError message={errors.category_id} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="instruction">Instruction</Label>
                                <textarea
                                    id="instruction"
                                    rows={3}
                                    value={data.instruction}
                                    onChange={(event) =>
                                        setData(
                                            'instruction',
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError message={errors.instruction} />
                            </div>

                            <div className="grid gap-2 sm:w-40">
                                <Label htmlFor="sort_order">Sort order</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min={0}
                                    value={data.sort_order}
                                    onChange={(event) =>
                                        setData(
                                            'sort_order',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError message={errors.sort_order} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={(checked) =>
                                        setData('active', checked === true)
                                    }
                                />
                                <Label htmlFor="active">
                                    Active — shown to customers
                                </Label>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    onClick={submit}
                                    disabled={processing}
                                >
                                    Save changes
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={admin.poses.index()}>
                                        Cancel
                                    </Link>
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="ml-auto"
                                    onClick={destroy}
                                >
                                    Delete pose
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

PoseEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: admin.dashboard() },
        { title: 'Poses', href: admin.poses.index() },
        { title: 'Edit', href: admin.poses.index() },
    ],
};
