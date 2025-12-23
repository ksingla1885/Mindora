'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, FileText, Package, CreditCard, Truck, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('idle');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/orders/${orderId}`);
      return;
    }

    if (status === 'authenticated') {
      fetchOrder();
    }
  }, [orderId, status]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelling(true);
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      // Refresh order data
      await fetchOrder();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadStatus('downloading');
      const response = await fetch(`/api/orders/${orderId}/invoice`);
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order?.orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setDownloadStatus('success');
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Pending', variant: 'outline', icon: Clock },
      'processing': { label: 'Processing', variant: 'secondary', icon: Package },
      'completed': { label: 'Completed', variant: 'default', icon: CheckCircle },
      'cancelled': { label: 'Cancelled', variant: 'destructive', icon: XCircle },
      'refunded': { label: 'Refunded', variant: 'outline', icon: CreditCard },
      'failed': { label: 'Failed', variant: 'destructive', icon: AlertCircle },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline', icon: Package };
    const StatusIcon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <StatusIcon className="h-3.5 w-3.5" />
        {statusInfo.label}
      </Badge>
    );
  };

  const canCancel = order && ['pending', 'processing'].includes(order.status);
  const canDownload = order && ['completed', 'processing', 'cancelled', 'refunded'].includes(order.status);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg inline-flex items-center mb-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">Error:</span> {error || 'Order not found'}
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={fetchOrder}>
            Try Again
          </Button>
          <Button asChild>
            <Link href="/account/orders">
              View All Orders
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0">
          <Link href="/account/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:flex-1 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
                  <CardDescription className="mt-1">
                    Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
                  </CardDescription>
                </div>
                <div className="flex items-center">
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Test</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/tests/${item.testId}`}
                          className="hover:underline"
                        >
                          {item.test?.title || 'Test'}
                        </Link>
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ×{item.quantity}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>₹{(item.price / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        ₹{(item.total / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Order Totals */}
              <div className="mt-6 space-y-2 max-w-md ml-auto">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{(order.subtotal / 100).toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Discount {order.coupon ? `(${order.coupon})` : ''}
                    </span>
                    <span className="text-green-600">-₹{(order.discount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (18%)</span>
                  <span>₹{(order.tax / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-medium text-lg">
                  <span>Total</span>
                  <span>₹{(order.total / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-x-2">
                {canDownload && (
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadInvoice}
                    disabled={downloadStatus === 'downloading'}
                  >
                    {downloadStatus === 'downloading' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Download Invoice
                      </>
                    )}
                  </Button>
                )}
                {canCancel && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel Order'
                    )}
                  </Button>
                )}
              </div>
              <Button asChild>
                <Link href="/marketplace">
                  Continue Shopping
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Order Updates */}
          {order.updates && order.updates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Order Updates</CardTitle>
                <CardDescription>Track the progress of your order</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-5 top-0 h-full w-0.5 bg-muted" />
                  <div className="space-y-6">
                    {order.updates.map((update, index) => (
                      <div key={index} className="relative pl-10">
                        <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-primary" />
                        <div className="text-sm">
                          <div className="font-medium">{update.status}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(update.timestamp), 'MMMM d, yyyy h:mm a')}
                          </div>
                          {update.message && (
                            <p className="mt-1 text-muted-foreground">{update.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Information */}
        <div className="lg:w-80 space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{order.paymentMethod || 'Online Payment'}</p>
                {order.paymentId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Transaction ID: {order.paymentId}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <div className="flex items-center">
                  {order.paymentStatus === 'paid' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                      <span>Paid</span>
                    </>
                  ) : order.paymentStatus === 'pending' ? (
                    <>
                      <Clock className="h-4 w-4 text-yellow-500 mr-1.5" />
                      <span>Pending</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
                      <span>Failed</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              {order.billingAddress ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.billingAddress.name}</p>
                  <p className="text-muted-foreground">{order.billingAddress.line1}</p>
                  {order.billingAddress.line2 && (
                    <p className="text-muted-foreground">{order.billingAddress.line2}</p>
                  )}
                  <p className="text-muted-foreground">
                    {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">{order.billingAddress.country}</p>
                  <p className="text-muted-foreground mt-2">{order.billingAddress.email}</p>
                  <p className="text-muted-foreground">{order.billingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No billing address provided</p>
              )}
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you have any questions about your order, our support team is here to help.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
