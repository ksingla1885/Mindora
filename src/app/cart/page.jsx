'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, ShoppingCart, X, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, removeItem, updateQuantity, cartTotal, clearCart, isLoading } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      // Simulate API call to validate coupon
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coupon validation
      const validCoupons = {
        'WELCOME10': { discount: 0.1, type: 'percentage' },
        'SAVE20': { discount: 20, type: 'fixed' },
      };
      
      const coupon = validCoupons[couponCode.toUpperCase()];
      
      if (coupon) {
        setAppliedCoupon({
          code: couponCode.toUpperCase(),
          ...coupon
        });
        toast.success('Coupon applied successfully');
      } else {
        toast.error('Invalid coupon code');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.type === 'percentage') {
      return cartTotal * appliedCoupon.discount;
    } else {
      return Math.min(appliedCoupon.discount, cartTotal);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setIsCheckingOut(true);
    try {
      // Create checkout session
      const response = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            testId: item.testId,
            quantity: item.quantity,
          })),
          coupon: appliedCoupon?.code,
        }),
      });

      const { url, error } = await response.json();

      if (!response.ok) {
        throw new Error(error || 'Failed to create checkout session');
      }

      // Redirect to checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to proceed to checkout');
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Looks like you haven't added any tests yet.</p>
        <Button asChild>
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Tests
          </Link>
        </Button>
      </div>
    );
  }

  const discount = calculateDiscount();
  const subtotal = cartTotal - discount;
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.testId} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-48 h-32 md:h-auto bg-muted">
                  <Image
                    src={item.image || '/placeholder-test.jpg'}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {item.difficulty} • {item.duration} min
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.testId)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.testId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </Button>
                      <span className="w-10 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.testId, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <div className="font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          <div className="flex justify-end pt-2">
            <Button
              variant="link"
              className="text-destructive"
              onClick={clearCart}
            >
              Clear cart
            </Button>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:sticky lg:top-8 h-fit">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <div className="flex items-center">
                      <span>Discount ({appliedCoupon.code})</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="h-6 w-6 p-0 ml-2 text-green-600 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove coupon</span>
                      </Button>
                    </div>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {!appliedCoupon && (
                <div className="pt-2">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isApplyingCoupon}
                    >
                      {isApplyingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Apply
                    </Button>
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full mt-4"
                size="lg"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                By completing your purchase, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </CardContent>
          </Card>
          
          <div className="mt-4 text-center">
            <Button variant="link" asChild>
              <Link href="/marketplace" className="flex items-center justify-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
