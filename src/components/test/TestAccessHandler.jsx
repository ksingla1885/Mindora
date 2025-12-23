'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useRazorpay } from '@/hooks/useRazorpay';

export default function TestAccessHandler({ test, children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { purchaseTest, isLoading: isPaymentLoading } = useRazorpay();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isPaidTest, setIsPaidTest] = useState(false);

  // Check if user has access to the test
  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'loading') return;
      
      try {
        const response = await fetch(`/api/tests/${test.id}/access`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAccess);
          setIsPaidTest(data.isPaid);
        }
      } catch (error) {
        console.error('Error checking test access:', error);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [test.id, status]);

  const handlePurchase = async () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/tests/${test.id}`);
      return;
    }

    try {
      await purchaseTest(
        test.id,
        {
          name: session.user.name || '',
          email: session.user.email || '',
          phone: session.user.phone || '',
        },
        (result) => {
          // On successful payment
          setHasAccess(true);
          router.refresh();
        },
        (error) => {
          console.error('Payment error:', error);
        }
      );
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Checking access...</span>
      </div>
    );
  }

  // If user has access or test is free, render the test
  if (hasAccess || !isPaidTest) {
    return children;
  }

  // Show payment required UI for paid tests
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-blue-50 rounded-t-lg">
          <div className="flex items-center">
            <Lock className="h-6 w-6 text-blue-600 mr-2" />
            <CardTitle>Premium Test Access Required</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-gray-700">
              This is a premium test that requires a one-time purchase to access.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg mb-2">{test.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="text-xl font-bold text-blue-600">
                  ₹{test.price.toFixed(2)}
                </span>
              </div>
              {test.validityDays && (
                <div className="mt-2 text-sm text-gray-500">
                  Access valid for {test.validityDays} days from purchase
                </div>
              )}
            </div>

            <ul className="space-y-2 mt-4">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Full access to all questions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Detailed solutions and explanations</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Performance analytics</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Certificate upon completion</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-6 py-4 border-t flex justify-end">
          <Button
            onClick={handlePurchase}
            disabled={isPaymentLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isPaymentLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Pay ₹${test.price.toFixed(2)} to Continue`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
