'use client';

import { useState, useEffect } from 'react';
import { loadRazorpay } from '@/lib/razorpay';
import { FiCreditCard, FiLoader, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';

export default function RazorpayButton({ 
  testId, 
  amount, 
  currency = 'INR', 
  testTitle, 
  buttonText = 'Pay Now',
  buttonClassName = 'bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2',
  onSuccess, 
  onError,
  onClose,
  userDetails = {}
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error when component is unmounted or when retrying
  useEffect(() => {
    return () => setError('');
  }, []);

  const handlePayment = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // 1. Create order on the server
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testId, 
          amount,
          currency,
          userDetails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const { order } = await response.json();

      // 2. Load Razorpay script with retry logic
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(handlePayment, 1000 * retryCount); // Exponential backoff
          return;
        }
        throw new Error('Failed to load payment provider. Please try again later.');
      }

      // Reset retry count on successful load
      setRetryCount(0);

      // 3. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || currency,
        name: 'Mindora Learning',
        description: `Payment for test: ${testTitle}`,
        order_id: order.id,
        image: '/logo.png', // Add your logo
        handler: async function (response) {
          try {
            // Verify payment on the server
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                testId,
              }),
            });

            const result = await verifyResponse.json();
            
            if (!verifyResponse.ok) {
              throw new Error(result.error || 'Payment verification failed');
            }

            setSuccess(true);
            onSuccess?.(result);
          } catch (err) {
            console.error('Payment verification error:', err);
            handleError(err);
          }
        },
        prefill: {
          name: userDetails.name || '',
          email: userDetails.email || '',
          contact: userDetails.phone || '',
        },
        theme: {
          color: '#4f46e5',
          backdrop_color: '#0f172a',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            onClose?.();
          },
          escape: true,
          confirm_close: true,
          animation: true,
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
        notes: {
          testId,
          source: 'mindora_web',
        },
      };

      const paymentObject = new Razorpay(options);
      
      // Handle payment failed event
      paymentObject.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        const errorMessage = response.error?.description || 'Payment failed. Please try again.';
        handleError(new Error(errorMessage));
      });

      // Handle payment modal close
      paymentObject.on('payment.close', function (response) {
        if (!success) {
          setLoading(false);
          onClose?.();
        }
      });

      paymentObject.open();
    } catch (err) {
      console.error('Payment error:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error) => {
    const errorMessage = error.message || 'An error occurred during payment';
    setError(errorMessage);
    onError?.(error);
    
    // Auto-clear error after 10 seconds
    setTimeout(() => setError(''), 10000);
  };

  return (
    <div className="w-full">
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md flex items-center">
          <FiCheckCircle className="mr-2 flex-shrink-0" />
          <span>Payment successful! Redirecting you to the test...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md flex items-start">
          <FiAlertCircle className="mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Payment Error</p>
            <p className="text-sm">{error}</p>
            {retryCount > 0 && retryCount < MAX_RETRIES && (
              <p className="text-xs mt-1">Retrying... ({retryCount}/{MAX_RETRIES})</p>
            )}
          </div>
          <button 
            onClick={() => setError('')} 
            className="text-red-400 hover:text-red-600 ml-2"
            aria-label="Dismiss error"
          >
            <FiX size={18} />
          </button>
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading || success}
        className={`w-full ${buttonClassName} ${
          loading ? 'opacity-70 cursor-not-allowed' : 
          success ? 'bg-green-600 hover:bg-green-700' : ''
        } transition-colors duration-200`}
        aria-busy={loading}
        aria-live="polite"
      >
        {loading ? (
          <>
            <FiLoader className="animate-spin" />
            Processing Payment...
          </>
        ) : success ? (
          <>
            <FiCheckCircle className="mr-1" />
            Payment Successful!
          </>
        ) : (
          <>
            <FiCreditCard className="mr-1" />
            {buttonText} {amount ? `(₹${(amount / 100).toFixed(2)})` : ''}
          </>
        )}
      </button>

      {/* Payment Methods */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        <p>Secure payment powered by Razorpay</p>
        <div className="flex items-center justify-center mt-1 space-x-2">
          <span>Cards</span>
          <span>•</span>
          <span>UPI</span>
          <span>•</span>
          <span>Net Banking</span>
        </div>
      </div>
    </div>
  );
}
