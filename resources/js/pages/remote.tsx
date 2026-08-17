import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export default function Remote({ token }: { token: string }) {
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const sendAction = async (action: 'NEXT_POSE' | 'PREVIOUS_POSE') => {
        setStatus('sending');
        try {
            const response = await fetch(`/api/booth/remote/${token}/action`, {
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

            <div className="flex h-screen w-screen flex-col overflow-hidden bg-black select-none">
                {/* Lanjut Button - White Background, Black Text (Top Half) */}
                <button
                    onClick={() => sendAction('NEXT_POSE')}
                    disabled={status === 'sending'}
                    className="flex flex-1 items-center justify-center bg-white text-black transition-colors active:bg-gray-200"
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-5xl font-black uppercase tracking-wider">Lanjut</span>
                        <ChevronRight className="size-16" />
                    </div>
                </button>

                {/* Status Indicator Bar in the middle */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    {status === 'sent' && (
                        <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-white shadow-xl animate-in fade-in zoom-in">
                            <Check className="size-5" />
                            <span className="text-sm font-bold uppercase tracking-widest">Terkirim</span>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-1 rounded-3xl bg-red-600 px-6 py-3 text-white shadow-xl animate-in fade-in zoom-in">
                            <span className="text-sm font-bold uppercase tracking-widest">Sesi Berakhir</span>
                            <span className="text-xs">Token sudah tidak berlaku</span>
                        </div>
                    )}
                </div>

                {/* Kembali Button - Black Background, White Text (Bottom Half) */}
                <button
                    onClick={() => sendAction('PREVIOUS_POSE')}
                    disabled={status === 'sending'}
                    className="flex flex-1 items-center justify-center bg-black text-white transition-colors active:bg-gray-900"
                >
                    <div className="flex flex-col items-center gap-2">
                        <ChevronLeft className="size-16" />
                        <span className="text-5xl font-black uppercase tracking-wider">Kembali</span>
                    </div>
                </button>
            </div>
        </>
    );
}
