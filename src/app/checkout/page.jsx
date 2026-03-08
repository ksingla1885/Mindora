'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, CreditCard, ChevronLeft } from 'lucide-react';
import PaymentButton from '@/components/PaymentButton';
import Link from 'next/link';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [test, setTest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const testId = searchParams.get('testId');

    useEffect(() => {
        if (!testId) {
            setError('Missing test ID');
            setIsLoading(false);
            return;
        }

        const fetchTest = async () => {
            try {
                const response = await fetch(`/api/tests/${testId}`);
                if (!response.ok) throw new Error('Failed to fetch test details');
                const data = await response.json();
                setTest(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTest();
    }, [testId]);

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Preparing your checkout...</p>
            </div>
        );
    }

    if (!session) {
        router.push(`/auth/signin?callbackUrl=/checkout?testId=${testId}`);
        return null;
    }

    if (error || !test) {
        return (
            <div className="container max-w-2xl py-20 text-center">
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive">Checkout Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error || 'Test not found'}</p>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const handlePaymentSuccess = (result, razorpayResponse) => {
        const orderId = razorpayResponse.razorpay_order_id || result.orderId;
        router.push(`/checkout/success?order_id=${orderId}&payment_id=${razorpayResponse.razorpay_payment_id}`);
    };

    return (
        <div className="container max-w-4xl py-10">
            <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-2">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Test
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                            <CardDescription>Review the item you are about to purchase.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{test.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{test.description}</p>
                                    <div className="mt-2 flex gap-2">
                                        <Badge variant="outline">{test.category?.name || 'Test'}</Badge>
                                        <Badge variant="secondary">{test.questions?.length || 0} Questions</Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl">₹{test.price}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Billing Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                                    <p className="font-medium">{session.user.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p className="font-medium">{session.user.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Payment Details */}
                <div className="space-y-6">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Price Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span>Price</span>
                                <span>₹{test.price}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Platform Fee</span>
                                <span className="text-green-600 font-medium">FREE</span>
                            </div>
                            <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                                <span>Total Amount</span>
                                <span className="text-primary text-2xl">₹{test.price}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <PaymentButton
                                testId={test.id}
                                price={test.price}
                                buttonText="Complete Payment"
                                className="w-full h-12 text-lg"
                                onSuccess={handlePaymentSuccess}
                            />
                            <div className="flex flex-col gap-2 items-center text-[10px] text-muted-foreground text-center">
                                <div className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3 text-green-600" />
                                    Secure 256-bit SSL Encrypted Payment
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-3 w-3" />
                                    Powered by Razorpay
                                </div>
                            </div>
                        </CardFooter>
                    </Card>

                    <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-xs space-y-2">
                        <p className="font-semibold text-foreground">Terms & Conditions</p>
                        <p>By clicking "Complete Payment", you agree to our <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
                        <p>Refunds are subject to our <Link href="/refunds" className="text-primary hover:underline">Refund Policy</Link>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading checkout...</p>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
