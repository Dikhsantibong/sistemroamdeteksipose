import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function Remote({ token }: { token: string }) {
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const sendAction = async (action: 'NEXT_POSE' | 'PREVIOUS_POSE') => {
        setStatus('sending');
        try {
            const response = await fetch(`/api/remote/${token}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ action }),
            });

            if (response.ok) {
                setStatus('sent');
                setTimeout(() => setStatus('idle'), 500);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <>
            <Head title="Remote Control" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-50 select-none">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Remote Booth</h1>
                    <p className="text-sm text-zinc-400">Gunakan tombol di bawah untuk mengganti pose di layar tablet.</p>
                </div>

                <div className="flex w-full max-w-sm flex-col gap-4">
                    <button
                        onClick={() => sendAction('NEXT_POSE')}
                        disabled={status === 'sending'}
                        className="group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-3xl bg-blue-600 font-medium text-white shadow-lg transition-all active:scale-95 active:bg-blue-700 disabled:opacity-50"
                    >
                        <div className="flex items-center gap-2 text-2xl font-bold">
                            Lanjut Pose <ChevronRight className="size-8" />
                        </div>
                    </button>

                    <button
                        onClick={() => sendAction('PREVIOUS_POSE')}
                        disabled={status === 'sending'}
                        className="group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-3xl bg-zinc-800 font-medium text-white shadow-lg transition-all active:scale-95 active:bg-zinc-700 disabled:opacity-50"
                    >
                        <div className="flex items-center gap-2 text-2xl font-bold">
                            <ChevronLeft className="size-8" /> Pose Sebelumnya
                        </div>
                    </button>
                </div>

                <div className="mt-8 h-8">
                    {status === 'sent' && (
                        <div className="flex items-center gap-2 text-emerald-400 animate-in fade-in zoom-in">
                            <Check className="size-5" />
                            <span className="text-sm font-medium">Perintah terkirim</span>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="text-red-400 animate-in fade-in zoom-in text-sm font-medium">
                            Gagal mengirim perintah. Token mungkin sudah tidak berlaku.
                        </div>
                    )}
                </div>
                
                <div className="mt-auto pt-8 text-center text-xs text-zinc-500">
                    Sesi akan berakhir secara otomatis saat Anda keluar dari photobooth.
                </div>
            </div>
        </>
    );
}
