'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FiCreditCard, FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import useRazorpay from '@/hooks/useRazorpay';

const PaymentButton = ({ test, className = '', onSuccess, onError }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const { purchaseTest, isLoading, error } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'error' | null

  const handlePayment = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/tests/${test.id}`);
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      await purchaseTest(
        test.id,
        {
          name: session.user.name,
          email: session.user.email,
          phone: session.user.phone,
        },
        (result) => {
          setPaymentStatus('success');
          toast.success('Payment successful! You now have access to this test.');
          if (onSuccess) onSuccess(result);
          // Refresh the page to update test access
          setTimeout(() => router.refresh(), 1500);
        },
        (error) => {
          console.error('Payment error:', error);
          setPaymentStatus('error');
          toast.error(error.message || 'Payment failed. Please try again.');
          if (onError) onError(error);
        }
      );
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentStatus('error');
      toast.error(err.message || 'An error occurred. Please try again.');
      if (onError) onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonContent = () => {
    if (isProcessing || isLoading) {
      return (
        <>
          <FiLoader className="animate-spin mr-2" />
          Processing...
        </>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <>
          <FiCheckCircle className="mr-2" />
          Payment Successful!
        </>
      );
    }

    if (paymentStatus === 'error') {
      return (
        <>
          <FiXCircle className="mr-2" />
          Try Again
        </>
      );
    }

    return (
      <>
        <FiCreditCard className="mr-2" />
        {test.price > 0 ? `Pay ₹${test.price}` : 'Start Test'}
      </>
    );
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing || isLoading || paymentStatus === 'success'}
      className={`
        inline-flex items-center justify-center px-6 py-2 rounded-md font-medium transition-colors
        ${paymentStatus === 'success' 
          ? 'bg-green-600 text-white hover:bg-green-700' 
          : paymentStatus === 'error'
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {getButtonContent()}
    </button>
  );
};

export default PaymentButton;
