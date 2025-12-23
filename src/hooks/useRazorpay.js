import { useState, useCallback, useEffect } from 'react';
import { loadScript } from '@/lib/utils';

export function useRazorpay() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        setIsScriptLoaded(true);
      } catch (err) {
        console.error('Failed to load Razorpay script:', err);
        setError('Failed to load payment service. Please try again later.');
      }
    };

    if (!window.Razorpay) {
      loadRazorpay();
    } else {
      setIsScriptLoaded(true);
    }
  }, []);

  /**
   * Initialize and open Razorpay payment modal
   * @param {Object} options - Payment options
   * @param {number} options.amount - Amount in INR
   * @param {string} options.currency - Currency code (default: 'INR')
   * @param {string} options.receipt - Receipt ID
   * @param {string} options.name - Company name
   * @param {string} options.description - Payment description
   * @param {string} options.prefill.name - Customer name
   * @param {string} options.prefill.email - Customer email
   * @param {string} options.prefill.contact - Customer contact number
   * @param {Object} options.notes - Additional notes
   * @returns {Promise<Object>} Payment response
   */
  const makePayment = useCallback(async (options) => {
    if (!isScriptLoaded) {
      throw new Error('Razorpay script not loaded');
    }

    setIsLoading(true);
    setError(null);

    try {
      return await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          ...options,
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          handler: function (response) {
            resolve(response);
          },
          modal: {
            ondismiss: function () {
              const err = new Error('Payment window closed');
              err.code = 'PAYMENT_POPUP_CLOSED';
              reject(err);
            },
          },
        });

        rzp.on('payment.failed', function (response) {
          const error = new Error(response.error.description || 'Payment failed');
          error.code = 'PAYMENT_FAILED';
          error.razorpayResponse = response;
          reject(error);
        });

        rzp.open();
      });
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isScriptLoaded]);

  /**
   * Handle test purchase flow
   * @param {string} testId - ID of the test to purchase
   * @param {Object} user - User details
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   */
  const purchaseTest = async (testId, user, onSuccess, onError) => {
    try {
      setIsLoading(true);
      
      // Step 1: Create payment order on the server
      const orderResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testId }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      // Step 2: Open Razorpay payment modal
      const paymentResponse = await makePayment({
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: orderData.name,
        description: orderData.description,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || '',
        },
        theme: orderData.theme,
      });

      // Step 3: Verify payment on the server
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: paymentResponse.razorpay_order_id,
          paymentId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.error || 'Payment verification failed');
      }

      // Payment successful
      if (onSuccess) onSuccess(await verifyResponse.json());
    } catch (err) {
      console.error('Test purchase error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    makePayment,
    purchaseTest,
    isLoading,
    error,
    isScriptLoaded,
  };
}

export default useRazorpay;
