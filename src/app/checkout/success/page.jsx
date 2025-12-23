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

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
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
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-md">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(order.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-md">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-medium">₹{(order.total / 100).toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-md">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">
                {order.paymentMethod || 'Online Payment'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={downloadInvoice}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tests">
                View My Tests
              </Link>
            </Button>
          </div>
        </div>

        {/* Order Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>
              Your order details and next steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Order Status */}
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Order Status</h3>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-sm text-muted-foreground">
                      {order.status === 'completed' 
                        ? 'Completed' 
                        : order.status === 'processing' 
                          ? 'Processing' 
                          : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Confirmation */}
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Email Confirmation</h3>
                  <p className="text-sm text-muted-foreground">
                    An email receipt including the details of your order has been sent to your email address.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.test.title}
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground text-sm ml-2">
                          ×{item.quantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(item.total / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {order.coupon && (
                  <TableRow>
                    <TableCell className="font-medium">
                      Discount ({order.coupon})
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      -₹{(order.discount / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium">Tax (18%)</TableCell>
                  <TableCell className="text-right">
                    ₹{(order.tax / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    ₹{(order.total / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <div className="w-full">
              <h3 className="font-medium mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you have any questions about your order, please contact our support team at{' '}
                <a href="mailto:support@mindora.com" className="text-primary hover:underline">
                  support@mindora.com
                </a>
                {' '}or call us at +91 1234567890.
              </p>
            </div>
            <Button variant="outline" asChild className="w-full md:w-auto">
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
