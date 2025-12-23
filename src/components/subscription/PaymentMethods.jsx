'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment-methods');
      const data = await response.json();
      
      if (response.ok) {
        setPaymentMethods(data.paymentMethods || []);
      } else {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddPaymentMethod = async () => {
    try {
      setIsLoadingScript(true);
      
      // Load Razorpay script if not already loaded
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Get client secret for setting up payment method
      const response = await fetch('/api/payment-methods/setup-intent', {
        method: 'POST',
      });
      
      const { clientSecret, error } = await response.json();
      
      if (!response.ok) {
        throw new Error(error || 'Failed to initialize payment method setup');
      }

      // Open Razorpay checkout to add payment method
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 100, // 1.00 INR (minimum amount)
        currency: 'INR',
        name: 'Mindora',
        description: 'Add Payment Method',
        order_id: clientSecret,
        handler: async function(response) {
          try {
            // Verify the payment and save the payment method
            const verifyResponse = await fetch('/api/payment-methods/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const data = await verifyResponse.json();
            
            if (!verifyResponse.ok) {
              throw new Error(data.error || 'Failed to verify payment method');
            }

            // Refresh payment methods list
            await fetchPaymentMethods();
            toast.success('Payment method added successfully');
            setShowAddDialog(false);
          } catch (error) {
            console.error('Error verifying payment method:', error);
            toast.error(error.message || 'Failed to add payment method');
          }
        },
        prefill: {
          name: '', // Pre-fill with user's name if available
          email: '', // Pre-fill with user's email if available
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error(error.message || 'Failed to add payment method');
    } finally {
      setIsLoadingScript(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove payment method');
      }

      // Refresh payment methods list
      await fetchPaymentMethods();
      toast.success('Payment method removed successfully');
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error(error.message || 'Failed to remove payment method');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCardBrandIcon = (brand) => {
    const brandIcons = {
      visa: 'VISA',
      mastercard: 'MC',
      amex: 'AMEX',
      discover: 'DISC',
      diners: 'DINERS',
      jcb: 'JCB',
      unionpay: 'UNIONPAY',
      rupay: 'RUPAY',
    };

    return brandIcons[brand.toLowerCase()] || 'CARD';
  };

  const formatCardNumber = (last4) => `•••• •••• •••• ${last4}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Payment Methods</h2>
          <p className="text-sm text-muted-foreground">Manage your saved payment methods</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account. You'll be redirected to a secure payment page.
              </DialogDescription>
            </DialogHeader>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                disabled={isLoadingScript}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddPaymentMethod}
                disabled={isLoadingScript}
              >
                {isLoadingScript ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No payment methods</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              You haven't added any payment methods yet.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-16 items-center justify-center rounded-md border bg-muted">
                      {getCardBrandIcon(method.card.brand)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCardNumber(method.card.last4)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year.toString().slice(-2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePaymentMethod(method.id)}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive/90"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
                {method.is_default && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Default
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
