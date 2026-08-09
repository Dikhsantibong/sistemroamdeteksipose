import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { usePwaInstall, useServiceWorker } from '@/hooks/use-pwa';

const MANUAL_STEPS = [
    'Open the browser menu.',
    'Choose "Install app" or "Add to Home screen".',
    'Confirm the installation.',
];

export default function Install({ boothUrl }: { boothUrl: string }) {
    const { state, install } = usePwaInstall();

    useServiceWorker();

    return (
        <>
            <Head title="Install" />

            <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-100">
                <main className="w-full max-w-xl">
                    <h1 className="text-3xl leading-tight font-semibold tracking-tight uppercase sm:text-4xl">
                        Self Photo Booth
                        <span className="block">Pose Assistant</span>
                    </h1>

                    <p className="mt-6 text-lg text-neutral-300">
                        Install the application on this tablet.
                    </p>

                    <div className="mt-10">
                        {state === 'checking' && (
                            <p className="text-lg text-neutral-400">
                                Checking installation status…
                            </p>
                        )}

                        {state === 'ready' && (
                            <Button
                                size="lg"
                                className="h-16 w-full text-lg"
                                onClick={install}
                            >
                                Install App
                            </Button>
                        )}

                        {state === 'installing' && (
                            <p className="text-lg text-neutral-400">
                                Installing…
                            </p>
                        )}

                        {state === 'installed' && (
                            <div className="space-y-6">
                                <p className="text-lg">
                                    Application already installed.
                                </p>
                                <Button
                                    size="lg"
                                    className="h-16 w-full text-lg"
                                    asChild
                                >
                                    <a href={boothUrl}>Open Booth</a>
                                </Button>
                            </div>
                        )}

                        {state === 'unsupported' && (
                            <div className="space-y-6">
                                <p className="text-lg text-neutral-300">
                                    This browser does not offer an install
                                    button. Install the app manually:
                                </p>
                                <ol className="space-y-2 text-lg text-neutral-300">
                                    {MANUAL_STEPS.map((step, index) => (
                                        <li key={step}>
                                            {index + 1}. {step}
                                        </li>
                                    ))}
                                </ol>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-16 w-full border-neutral-700 bg-transparent text-lg text-neutral-100 hover:bg-neutral-900 hover:text-neutral-100"
                                    asChild
                                >
                                    <a href={boothUrl}>Open Booth</a>
                                </Button>
                            </div>
                        )}
                    </div>

                    <p className="mt-10 text-base text-neutral-400">
                        After the application is installed, open it to enter
                        booth mode.
                    </p>
                </main>
            </div>
        </>
    );
}
