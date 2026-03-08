'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Clock, Download, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchPayment = async () => {
      try {
        const response = await fetch(`/api/payments/status/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch payment details');
        }
        const result = await response.json();
        if (result.success) {
          setOrder(result.data); // result.data contains the mapped payment info
        } else {
          throw new Error(result.error || 'Failed to fetch payment details');
        }
      } catch (err) {
        console.error('Error fetching payment:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [orderId]);

  const downloadInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`);
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order?.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading your order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg inline-flex items-center mb-4">
          <span className="font-medium">Error:</span> {error || 'Order not found'}
        </div>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Order Confirmation */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-muted/50 px-4 py-2 rounded-md">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-medium">{order.orderId}</p>
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-md">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(order.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-md">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="font-medium">₹{order.amount.toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-md">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{order.status.toLowerCase()}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/tests">
                Go to My Tests
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Payment Details */}
        <Card className="mb-8 border-primary/20 shadow-sm">
          <CardHeader className="bg-primary/5">
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Information about your recently purchased test
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="font-semibold text-lg">{order.test?.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{order.test?.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-primary">₹{order.amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4 shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Access Status</h3>
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-sm text-muted-foreground">
                        {order.status === 'CAPTURED' ? 'Immediate Access Granted' : 'Processing Access'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4 shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Receipt</h3>
                    <p className="text-sm text-muted-foreground">
                      A confirmation has been sent to your registered email address.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 flex-col items-start gap-4 p-6">
            <div className="w-full">
              <h3 className="font-medium mb-2 text-sm uppercase tracking-wider text-muted-foreground">Need Help?</h3>
              <p className="text-sm">
                If you have any questions about your payment, please contact our support team at{' '}
                <a href="mailto:support@mindora.com" className="text-primary hover:underline font-medium">
                  support@mindora.com
                </a>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
