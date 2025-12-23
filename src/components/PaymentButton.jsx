'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FiCreditCard, FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function PaymentButton({ testId, price, disabled = false, buttonText = 'Buy Now' }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/tests/${testId}`);
      return;
    }

    setIsLoading(true);
    setPaymentStatus(null);

    try {
      // 1. Load Razorpay script
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // 2. Create order on our server
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      const orderData = await response.json();

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.orderId,
        handler: async function (response) {
          // Handle successful payment
          try {
            // Verify payment on our server
            const verifyResponse = await fetch('/api/payments', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const result = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(result.error || 'Payment verification failed');
            }

            setPaymentStatus('success');
            toast.success('Payment successful! You can now take the test.');
            
            // Refresh the page to update UI
            setTimeout(() => {
              window.location.reload();
            }, 1500);

          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentStatus('failed');
            toast.error(error.message || 'Payment verification failed');
          }
        },
        prefill: orderData.prefill,
        theme: orderData.theme,
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setPaymentStatus('failed');
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
      });

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  // If payment was successful, show success state
  if (paymentStatus === 'success') {
    return (
      <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600">
        <FiCheckCircle className="mr-2 h-4 w-4" />
        Payment Successful
      </div>
    );
  }

  // If payment failed, show retry button
  if (paymentStatus === 'failed') {
    return (
      <button
        type="button"
        onClick={handlePayment}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <>
            <FiLoader className="animate-spin mr-2 h-4 w-4" />
            Processing...
          </>
        ) : (
          <>
            <FiXCircle className="mr-2 h-4 w-4" />
            Payment Failed - Try Again
          </>
        )}
      </button>
    );
  }

  // Default state - show payment button
  return (
    <button
      type="button"
      onClick={handlePayment}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
        isLoading || disabled
          ? 'bg-indigo-300 cursor-not-allowed'
          : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
      }`}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <FiLoader className="animate-spin mr-2 h-4 w-4" />
          Processing...
        </>
      ) : (
        <>
          <FiCreditCard className="mr-2 h-4 w-4" />
          {buttonText} ({new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
          }).format(price)})
        </>
      )}
    </button>
  );
}
