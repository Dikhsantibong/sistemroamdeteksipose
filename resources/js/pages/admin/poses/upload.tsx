import { Head, useForm } from '@inertiajs/react';
import { UploadCloud, X } from 'lucide-react';
import type { DragEvent } from 'react';
import { useRef, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import admin from '@/routes/admin';
import type { Category, PeopleCount } from '@/types';

const NO_CATEGORY = 'none';

type UploadForm = {
    images: File[];
    people_count: string;
    category_id: string;
    instruction: string;
    active: boolean;
};

function formatBytes(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function PoseUpload({
    categories,
    peopleCounts,
    limits,
}: {
    categories: Pick<Category, 'id' | 'name'>[];
    peopleCounts: Pick<PeopleCount, 'count' | 'label'>[];
    limits: { maxFiles: number; maxKilobytes: number };
}) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const {
        data,
        setData,
        post,
        processing,
        progress,
        errors,
        reset,
        transform,
    } = useForm<UploadForm>({
        images: [],
        people_count: peopleCounts[0]?.count.toString() ?? '',
        category_id: NO_CATEGORY,
        instruction: '',
        active: true,
    });

    const addFiles = (files: FileList | null) => {
        if (!files) {
            return;
        }

        const incoming = Array.from(files).filter((file) =>
            file.type.startsWith('image/'),
        );

        setData(
            'images',
            [...data.images, ...incoming].slice(0, limits.maxFiles),
        );
    };

    const removeFile = (index: number) => {
        setData(
            'images',
            data.images.filter((_, current) => current !== index),
        );
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingOver(false);
        addFiles(event.dataTransfer.files);
    };

    const submit = () => {
        // An empty string is converted to null by Laravel, which is what the
        // nullable category_id rule expects.
        transform((payload) => ({
            ...payload,
            category_id:
                payload.category_id === NO_CATEGORY ? '' : payload.category_id,
        }));

        post(admin.poses.upload.store().url, {
            forceFormData: true,
            onSuccess: () => reset('images', 'instruction'),
        });
    };

    const fileErrors = Object.entries(errors)
        .filter(([key]) => key.startsWith('images.'))
        .map(([, message]) => message);

    return (
        <>
            <Head title="Upload poses" />

            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Upload poses"
                    description="Drop several photos at once. The group size and category you pick below are applied to the whole batch."
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Images</CardTitle>
                            <CardDescription>
                                Up to {limits.maxFiles} images,{' '}
                                {Math.round(limits.maxKilobytes / 1024)} MB
                                each. Photos are resized and converted before
                                they are stored.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div
                                onDragOver={(event) => {
                                    event.preventDefault();
                                    setIsDraggingOver(true);
                                }}
                                onDragLeave={() => setIsDraggingOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInput.current?.click()}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                                    isDraggingOver
                                        ? 'border-primary bg-accent'
                                        : 'border-input'
                                }`}
                            >
                                <UploadCloud className="size-8 text-muted-foreground" />
                                <p className="font-medium">
                                    Drag and drop images here
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    or click to browse
                                </p>
                                <input
                                    ref={fileInput}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(event) => {
                                        addFiles(event.target.files);
                                        event.target.value = '';
                                    }}
                                />
                            </div>

                            <InputError message={errors.images} />
                            {fileErrors.map((message) => (
                                <InputError key={message} message={message} />
                            ))}

                            {data.images.length > 0 && (
                                <ul className="divide-y rounded-lg border">
                                    {data.images.map((file, index) => (
                                        <li
                                            key={`${file.name}-${index}`}
                                            className="flex items-center justify-between gap-3 p-2 text-sm"
                                        >
                                            <span className="truncate">
                                                {file.name}
                                            </span>
                                            <span className="shrink-0 text-muted-foreground">
                                                {formatBytes(file.size)}
                                            </span>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                aria-label={`Remove ${file.name}`}
                                                onClick={() =>
                                                    removeFile(index)
                                                }
                                            >
                                                <X />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {progress && (
                                <div className="grid gap-1">
                                    <progress
                                        className="w-full"
                                        value={progress.percentage}
                                        max="100"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Uploading… {progress.percentage}%
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Batch details</CardTitle>
                            <CardDescription>
                                Applied to every image in this upload.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Group size</Label>
                                <Select
                                    value={data.people_count}
                                    onValueChange={(value) =>
                                        setData('people_count', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a group size" />
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

                            <div className="grid gap-2">
                                <Label htmlFor="instruction">
                                    Instruction (optional)
                                </Label>
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
                                    placeholder="Stand next to each other and lean slightly toward the center."
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError message={errors.instruction} />
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
                                    Activate immediately
                                </Label>
                            </div>

                            <Button
                                type="button"
                                onClick={submit}
                                disabled={
                                    processing || data.images.length === 0
                                }
                            >
                                {processing
                                    ? 'Processing…'
                                    : `Upload ${data.images.length} image(s)`}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

PoseUpload.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: admin.dashboard() },
        { title: 'Poses', href: admin.poses.index() },
        { title: 'Upload', href: admin.poses.upload() },
    ],
};
