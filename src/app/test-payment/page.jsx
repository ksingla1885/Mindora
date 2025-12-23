'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function TestPaymentPage() {
  const [testId, setTestId] = useState('');
  const [amount, setAmount] = useState('1000'); // Default 10.00 INR in paise
  const [isLoading, setIsLoading] = useState(false);

  const handleTestPayment = async () => {
    if (!testId || !amount) {
      toast.error('Please enter test ID and amount');
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Create a test payment order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId,
          amount: parseInt(amount, 10),
          currency: 'INR',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment order');
      }

      const order = await response.json();
      
      // 2. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Mindora Test Payment',
        description: `Payment for Test #${testId}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify the payment
            const verificationResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                testId,
              }),
            });

            const result = await verificationResponse.json();

            if (!verificationResponse.ok) {
              throw new Error(result.error || 'Payment verification failed');
            }

            toast.success('Payment successful!');
            console.log('Payment successful:', result);
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(`Payment failed: ${error.message}`);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment was cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
      });

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(`Payment failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Payment Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testId">Test ID</Label>
            <Input
              id="testId"
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              placeholder="Enter test ID"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (in paise, e.g., 1000 = ₹10.00)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in paise"
            />
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={handleTestPayment}
              disabled={isLoading || !testId || !amount}
              className="w-full"
            >
              {isLoading ? 'Processing...' : 'Test Payment'}
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Test Payment Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
              <li>Enter a test ID (any string) and amount in paise (e.g., 1000 = ₹10.00)</li>
              <li>Click &quot;Test Payment&quot; to open the Razorpay checkout</li>
              <li>Use Razorpay test card details for payment</li>
              <li>Check the browser console for detailed logs</li>
            </ol>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-medium text-yellow-800 mb-1">Test Card Details:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>Card Number: 4111 1111 1111 1111</li>
                <li>Expiry: Any future date</li>
                <li>CVV: Any 3 digits</li>
                <li>Name: Any name</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
