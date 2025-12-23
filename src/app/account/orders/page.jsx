'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Calendar, Package, CreditCard, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OrderHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/orders');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders?status=${statusFilter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Pending', variant: 'outline' },
      'processing': { label: 'Processing', variant: 'secondary' },
      'completed': { label: 'Completed', variant: 'default' },
      'cancelled': { label: 'Cancelled', variant: 'destructive' },
      'refunded': { label: 'Refunded', variant: 'outline' },
      'failed': { label: 'Failed', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg inline-flex items-center mb-4">
          <span className="font-medium">Error:</span> {error}
        </div>
        <Button onClick={fetchOrders} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-6 pl-0">
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Account
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
            <p className="text-muted-foreground">View and manage your orders</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border rounded-md px-3 py-1.5 text-sm"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No orders found</h3>
            <p className="text-muted-foreground mb-6">
              {statusFilter === 'all' 
                ? "You haven't placed any orders yet."
                : `No ${statusFilter} orders found.`}
            </p>
            <Button asChild>
              <Link href="/marketplace">
                Browse Tests
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Order #{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{(order.total / 100).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Test</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
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
                        </TableCell>
                        <TableCell>₹{(item.price / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{(item.total / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between p-4 bg-muted/20">
                <div className="flex items-center text-sm text-muted-foreground mb-2 sm:mb-0">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {order.paymentMethod || 'Online Payment'}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders/${order.id}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                  {order.status === 'completed' && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/api/orders/${order.id}/invoice`} target="_blank">
                        <FileText className="h-4 w-4 mr-2" />
                        Invoice
                      </Link>
                    </Button>
                  )}
                  {['pending', 'processing'].includes(order.status) && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}/track`}>
                        <Package className="h-4 w-4 mr-2" />
                        Track Order
                      </Link>
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
