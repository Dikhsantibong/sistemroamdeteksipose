import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { BoothSettings, SettingDefinition } from '@/types';

const GROUP_TITLES: Record<string, string> = {
    recommendation: 'Recommendations',
    navigation: 'Navigation',
    detection: 'Detection',
    device: 'Devices',
};

const VOICE_LANGUAGES = [
    { value: 'en-US', label: 'English (United States)' },
    { value: 'id-ID', label: 'Bahasa Indonesia' },
];

export default function AdminSettings({
    values,
    definitions,
}: {
    values: BoothSettings;
    definitions: SettingDefinition[];
}) {
    const { data, setData, put, processing, errors } = useForm<
        Record<string, string | number | boolean>
    >({ ...values });

    const groups = definitions.reduce<Record<string, SettingDefinition[]>>(
        (carry, definition) => {
            carry[definition.group] = [
                ...(carry[definition.group] ?? []),
                definition,
            ];

            return carry;
        },
        {},
    );

    return (
        <>
            <Head title="Booth settings" />

            <div className="flex flex-col gap-6 p-4">
                <Heading
                    title="Booth settings"
                    description="Everything the tablet needs at runtime. Changes reach the booth on its next content sync."
                />

                <div className="grid gap-6 lg:grid-cols-2">
                    {Object.entries(groups).map(([group, items]) => (
                        <Card key={group}>
                            <CardHeader>
                                <CardTitle>
                                    {GROUP_TITLES[group] ?? group}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-5">
                                {items.map((definition) => (
                                    <div
                                        key={definition.key}
                                        className="grid gap-2"
                                    >
                                        {definition.type === 'boolean' ? (
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id={definition.key}
                                                    checked={
                                                        data[definition.key] ===
                                                        true
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        setData(
                                                            definition.key,
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                                <div className="grid gap-1">
                                                    <Label
                                                        htmlFor={definition.key}
                                                    >
                                                        {definition.label}
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        {definition.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : definition.key ===
                                          'voice_language' ? (
                                            <>
                                                <Label>
                                                    {definition.label}
                                                </Label>
                                                <Select
                                                    value={String(
                                                        data[definition.key],
                                                    )}
                                                    onValueChange={(value) =>
                                                        setData(
                                                            definition.key,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {VOICE_LANGUAGES.map(
                                                            (language) => (
                                                                <SelectItem
                                                                    key={
                                                                        language.value
                                                                    }
                                                                    value={
                                                                        language.value
                                                                    }
                                                                >
                                                                    {
                                                                        language.label
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-sm text-muted-foreground">
                                                    {definition.description}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Label htmlFor={definition.key}>
                                                    {definition.label}
                                                </Label>
                                                <Input
                                                    id={definition.key}
                                                    type="number"
                                                    step={
                                                        definition.type ===
                                                        'float'
                                                            ? '0.05'
                                                            : '1'
                                                    }
                                                    value={String(
                                                        data[definition.key],
                                                    )}
                                                    onChange={(event) =>
                                                        setData(
                                                            definition.key,
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    {definition.description}
                                                </p>
                                            </>
                                        )}
                                        <InputError
                                            message={errors[definition.key]}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div>
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={() => put(admin.settings.update().url)}
                    >
                        Save settings
                    </Button>
                </div>
            </div>
        </>
    );
}

AdminSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: admin.dashboard() },
        { title: 'Settings', href: admin.settings.edit() },
    ],
};
