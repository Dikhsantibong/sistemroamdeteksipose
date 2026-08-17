import { useState } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function QrCodeRemote({ token }: { token: string | null }) {
    const [open, setOpen] = useState(false);

    if (!token) return null;

    // Use current origin to build the remote URL
    const remoteUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/remote/${token}`
        : '';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="size-14 rounded-full border-2 border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-transform hover:scale-105 active:scale-95"
                    title="Remote Control HP"
                >
                    <QrCode className="size-8" />
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md bg-booth-surface text-booth-foreground border-booth-border">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">Remote Control HP</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col items-center justify-center p-6 gap-6">
                    <p className="text-center text-booth-muted text-sm">
                        Scan QR Code ini menggunakan kamera HP Anda untuk menjadikan HP sebagai remote control.
                    </p>

                    <div className="rounded-xl bg-white p-4 shadow-xl">
                        {remoteUrl && (
                            <QRCode
                                value={remoteUrl}
                                size={200}
                                level="M"
                            />
                        )}
                    </div>

                    <p className="text-center text-xs text-booth-muted">
                        Akses hanya berlaku untuk sesi Anda saat ini.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
