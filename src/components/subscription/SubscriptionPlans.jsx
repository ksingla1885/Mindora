'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SubscriptionPlans({ currentPlan = null }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([
    {
      id: 'BASIC',
      name: 'Basic',
      price: '₹199',
      description: 'Perfect for getting started',
      features: [
        'Access to basic test library',
        '5 tests per month',
        'Basic analytics',
        'Email support'
      ],
      isPopular: false
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: '₹499',
      description: 'For serious learners',
      features: [
        'Unlimited test access',
        'Advanced analytics',
        'Priority support',
        'Early access to new features',
        'Offline access'
      ],
      isPopular: true
    }
  ]);

  const handleSubscribe = async (planId) => {
    if (status !== 'authenticated') {
      router.push(`/auth/signin?callbackUrl=/subscription`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      // Redirect to payment page or show success
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.success('Subscription updated successfully!');
        router.refresh();
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.message || 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlan = (planId) => {
    if (!currentPlan) return false;
    return currentPlan.planId === planId && 
           currentPlan.status === 'active' || 
           currentPlan.status === 'trialing';
  };

  const getButtonText = (planId) => {
    if (isCurrentPlan(planId)) {
      return 'Current Plan';
    }
    if (currentPlan) {
      return 'Upgrade Plan';
    }
    return 'Get Started';
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={cn(
            'relative overflow-hidden transition-all hover:shadow-lg',
            plan.isPopular ? 'border-2 border-primary' : 'border border-gray-200',
            isCurrentPlan(plan.id) && 'ring-2 ring-primary'
          )}
        >
          {plan.isPopular && (
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              POPULAR
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
            <div className="flex items-baseline mt-2">
              <span className="text-4xl font-extrabold">{plan.price}</span>
              <span className="text-gray-500 ml-1">/month</span>
            </div>
            <CardDescription className="mt-2">{plan.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => handleSubscribe(plan.id)}
              disabled={isCurrentPlan(plan.id) || loading}
              className={cn(
                'w-full',
                isCurrentPlan(plan.id) ? 'bg-gray-100 text-gray-700' : '',
                plan.isPopular ? 'bg-primary hover:bg-primary/90' : ''
              )}
            >
              {loading && selectedPlan === plan.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {getButtonText(plan.id)}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
