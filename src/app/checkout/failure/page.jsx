'use client';

import { AlertCircle, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OrderFailurePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');
  const paymentId = searchParams.get('payment_id');
  
  const [loading, setLoading] = useState(false);
  const [retryStatus, setRetryStatus] = useState('idle');

  const getErrorMessage = () => {
    switch (errorCode) {
      case 'payment_failed':
        return 'The payment was declined by your bank or payment provider.';
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'expired_card':
        return 'Your card has expired. Please use a different payment method.';
      case 'insufficient_funds':
        return 'Insufficient funds in your account. Please try a different payment method.';
      case 'authentication_required':
        return 'This payment requires authentication. Please try again and complete the authentication process.';
      default:
        return errorDescription || 'An unexpected error occurred while processing your payment.';
    }
  };

  const handleRetryPayment = async () => {
    if (!orderId) return;
    
    try {
      setRetryStatus('loading');
      
      // In a real app, you would call your API to retry the payment
      // This is a simplified example
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to payment page or retry flow
      window.location.href = `/checkout/retry?order_id=${orderId}`;
    } catch (error) {
      console.error('Error retrying payment:', error);
      setRetryStatus('error');
    }
  };

  // Log the error for analytics
  useEffect(() => {
    if (errorCode) {
      console.error('Payment Error:', {
        orderId,
        paymentId,
        errorCode,
        errorDescription,
        timestamp: new Date().toISOString(),
      });
      
      // You would typically send this to your analytics service
      // logPaymentError({
      //   orderId,
      //   paymentId,
      //   errorCode,
      //   errorDescription,
      // });
    }
  }, [errorCode, errorDescription, orderId, paymentId]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl mb-2">
          Payment Unsuccessful
        </h1>
        <p className="text-muted-foreground mb-8">
          We couldn't process your payment. Please try again or use a different payment method.
        </p>

        <Alert variant="destructive" className="mb-8 text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Error</AlertTitle>
          <AlertDescription className="mt-2">
            {getErrorMessage()}
          </AlertDescription>
          {errorCode && (
            <div className="mt-2 text-xs text-muted-foreground">
              Error code: {errorCode}
            </div>
          )}
        </Alert>

        <div className="grid gap-4 max-w-sm mx-auto">
          {orderId && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleRetryPayment}
              disabled={retryStatus === 'loading'}
            >
              {retryStatus === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          )}
          
          <Button variant="outline" size="lg" asChild className="w-full">
            <Link href="/cart">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Link>
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Need help with your order?</h3>
          <p className="text-sm text-muted-foreground">
            Contact our customer support at{' '}
            <a href="mailto:support@mindora.com" className="text-primary hover:underline">
              support@mindora.com
            </a>
            {' '}or call us at +91 1234567890.
          </p>
          {orderId && (
            <p className="mt-2 text-xs text-muted-foreground">
              Reference: {orderId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
