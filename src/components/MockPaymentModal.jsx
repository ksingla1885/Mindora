'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock } from 'lucide-react';

export function MockPaymentModal({ isOpen, onClose, onSuccess, amount, testTitle }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePay = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        // Simulate network delay to make it feel "real"
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsProcessing(false);
        onSuccess();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                            <Lock className="w-5 h-5" />
                        </div>
                        <DialogTitle>Secure Payment (Demo)</DialogTitle>
                    </div>
                    <DialogDescription>
                        Complete purchase for <strong className="text-foreground">{testTitle}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handlePay} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Card Information</Label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="0000 0000 0000 0000" className="pl-9" defaultValue="4242 4242 4242 4242" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Expiry</Label>
                            <Input placeholder="MM/YY" defaultValue="12/30" required />
                        </div>
                        <div className="space-y-2">
                            <Label>CVC</Label>
                            <Input placeholder="123" defaultValue="123" required />
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="flex justify-between items-center mb-4 text-sm bg-muted/50 p-3 rounded-lg border border-border">
                            <span className="text-muted-foreground">Total Amount</span>
                            <span className="font-bold text-lg">₹{amount}</span>
                        </div>
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11" disabled={isProcessing}>
                            {isProcessing ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing Payment...
                                </span>
                            ) : `Pay ₹${amount}`}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground mt-3 flex items-center justify-center gap-1.5 opacity-70">
                            <Lock className="w-3 h-3" />
                            256-bit SSL Encrypted & Secure
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
