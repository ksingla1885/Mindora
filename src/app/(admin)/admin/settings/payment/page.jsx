'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, Plus, Trash2, ArrowLeft } from 'lucide-react';

// Form schemas
const paymentGatewaySchema = z.object({
  enabled: z.boolean(),
  testMode: z.boolean(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookSecret: z.string().optional(),
  webhookUrl: z.string().url().optional(),
});

const pricingPlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().default('INR'),
  billingCycle: z.enum(['monthly', 'quarterly', 'annually']),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  trialDays: z.number().min(0).default(0),
});

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(3, 'Code must be at least 3 characters'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0, 'Discount must be 0 or greater'),
  maxUses: z.number().min(1, 'Max uses must be at least 1'),
  usedCount: z.number().default(0),
  minPurchase: z.number().min(0).default(0),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true),
});

const taxRateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  rate: z.number().min(0, 'Rate must be 0 or greater'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().optional(),
  isInclusive: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export default function PaymentSettingsPage() {
  const [activeTab, setActiveTab] = useState('gateways');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [gateways, setGateways] = useState({
    razorpay: {
      enabled: false,
      testMode: true,
      apiKey: '',
      apiSecret: '',
      webhookSecret: '',
      webhookUrl: '',
    },
    stripe: {
      enabled: false,
      testMode: true,
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
    },
    paypal: {
      enabled: false,
      testMode: true,
      clientId: '',
      clientSecret: '',
    },
  });

  const [plans, setPlans] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [isAddingTaxRate, setIsAddingTaxRate] = useState(false);

  // Form hooks
  const gatewayForm = useForm({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      enabled: false,
      testMode: true,
    },
  });

  const planForm = useForm({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      currency: 'INR',
      billingCycle: 'monthly',
      features: [],
      isActive: true,
      trialDays: 0,
    },
  });

  const couponForm = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
      discountValue: 10,
      maxUses: 100,
      minPurchase: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    },
  });

  const taxRateForm = useForm({
    resolver: zodResolver(taxRateSchema),
    defaultValues: {
      name: '',
      rate: 0,
      country: '',
      state: '',
      isInclusive: false,
      isActive: true,
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        // In a real app, you would fetch this from your API
        const [gatewaysRes, plansRes, couponsRes, taxRatesRes] = await Promise.all([
          fetch('/api/admin/settings/payment/gateways').then(res => res.json()),
          fetch('/api/admin/settings/payment/plans').then(res => res.json()),
          fetch('/api/admin/settings/payment/coupons').then(res => res.json()),
          fetch('/api/admin/settings/payment/tax-rates').then(res => res.json()),
        ]);

        if (gatewaysRes.data) setGateways(gatewaysRes.data);
        if (plansRes.data) setPlans(plansRes.data);
        if (couponsRes.data) setCoupons(couponsRes.data);
        if (taxRatesRes.data) setTaxRates(taxRatesRes.data);
      } catch (error) {
        console.error('Error fetching payment settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentSettings();
  }, []);

  // Save handlers
  const saveGatewaySettings = async (gateway, data) => {
    try {
      setIsSaving(true);
      // In a real app, you would save this to your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGateways(prev => ({
        ...prev,
        [gateway]: {
          ...prev[gateway],
          ...data,
        },
      }));

      toast({
        title: 'Success',
        description: `${gateway} settings saved successfully`,
      });
    } catch (error) {
      console.error(`Error saving ${gateway} settings:`, error);
      toast({
        title: 'Error',
        description: `Failed to save ${gateway} settings`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const savePlan = async (data) => {
    try {
      setIsSaving(true);
      // In a real app, you would save this to your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (data.id) {
        // Update existing plan
        setPlans(prev =>
          prev.map(plan => (plan.id === data.id ? data : plan))
        );
      } else {
        // Add new plan
        setPlans(prev => [...prev, { ...data, id: Date.now().toString() }]);
        planForm.reset();
        setIsAddingPlan(false);
      }

      toast({
        title: 'Success',
        description: `Pricing plan ${data.id ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving pricing plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to save pricing plan',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveCoupon = async (data) => {
    try {
      setIsSaving(true);
      // In a real app, you would save this to your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (data.id) {
        // Update existing coupon
        setCoupons(prev =>
          prev.map(coupon => (coupon.id === data.id ? data : coupon))
        );
      } else {
        // Add new coupon
        setCoupons(prev => [...prev, { ...data, id: Date.now().toString(), usedCount: 0 }]);
        couponForm.reset();
        setIsAddingCoupon(false);
      }

      toast({
        title: 'Success',
        description: `Coupon ${data.id ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to save coupon',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveTaxRate = async (data) => {
    try {
      setIsSaving(true);
      // In a real app, you would save this to your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (data.id) {
        // Update existing tax rate
        setTaxRates(prev =>
          prev.map(rate => (rate.id === data.id ? data : rate))
        );
      } else {
        // Add new tax rate
        setTaxRates(prev => [...prev, { ...data, id: Date.now().toString() }]);
        taxRateForm.reset();
        setIsAddingTaxRate(false);
      }

      toast({
        title: 'Success',
        description: `Tax rate ${data.id ? 'updated' : 'added'} successfully`,
      });
    } catch (error) {
      console.error('Error saving tax rate:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tax rate',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete handlers
  const deletePlan = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      setIsSaving(true);
      // In a real app, you would delete this from your API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPlans(prev => prev.filter(plan => plan.id !== id));
      
      toast({
        title: 'Success',
        description: 'Pricing plan deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete pricing plan',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      setIsSaving(true);
      // In a real app, you would delete this from your API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCoupons(prev => prev.filter(coupon => coupon.id !== id));
      
      toast({
        title: 'Success',
        description: 'Coupon deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coupon',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTaxRate = async (id) => {
    if (!confirm('Are you sure you want to delete this tax rate?')) return;
    
    try {
      setIsSaving(true);
      // In a real app, you would delete this from your API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTaxRates(prev => prev.filter(rate => rate.id !== id));
      
      toast({
        title: 'Success',
        description: 'Tax rate deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting tax rate:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tax rate',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle handlers
  const toggleGateway = async (gateway, enabled) => {
    await saveGatewaySettings(gateway, { enabled });
  };

  const togglePlanStatus = async (plan) => {
    await savePlan({ ...plan, isActive: !plan.isActive });
  };

  const toggleCouponStatus = async (coupon) => {
    await saveCoupon({ ...coupon, isActive: !coupon.isActive });
  };

  const toggleTaxRateStatus = async (taxRate) => {
    await saveTaxRate({ ...taxRate, isActive: !taxRate.isActive });
  };

  // Edit handlers
  const editPlan = (plan) => {
    planForm.reset(plan);
    setIsAddingPlan(true);
  };

  const editCoupon = (coupon) => {
    couponForm.reset(coupon);
    setIsAddingCoupon(true);
  };

  const editTaxRate = (taxRate) => {
    taxRateForm.reset(taxRate);
    setIsAddingTaxRate(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground">
            Configure payment gateways, pricing plans, and tax settings
          </p>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
          <TabsTrigger value="plans">Pricing Plans</TabsTrigger>
          <TabsTrigger value="coupons">Coupons & Discounts</TabsTrigger>
          <TabsTrigger value="tax">Tax Settings</TabsTrigger>
        </TabsList>

        {/* Payment Gateways Tab */}
        <TabsContent value="gateways" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Razorpay</CardTitle>
              <CardDescription>
                Accept payments via Razorpay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-medium">Enable Razorpay</h3>
                  <p className="text-sm text-muted-foreground">
                    {gateways.razorpay.enabled 
                      ? 'Razorpay is currently enabled' 
                      : 'Razorpay is currently disabled'}
                  </p>
                </div>
                <Switch
                  checked={gateways.razorpay.enabled}
                  onCheckedChange={(checked) => toggleGateway('razorpay', checked)}
                  disabled={isSaving}
                />
              </div>

              {gateways.razorpay.enabled && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="razorpay-test-mode"
                      checked={gateways.razorpay.testMode}
                      onCheckedChange={(checked) => 
                        saveGatewaySettings('razorpay', { testMode: checked })
                      }
                      disabled={isSaving}
                    />
                    <Label htmlFor="razorpay-test-mode">Test Mode</Label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="razorpay-api-key">API Key</Label>
                      <Input
                        id="razorpay-api-key"
                        type="password"
                        value={gateways.razorpay.apiKey}
                        onChange={(e) => 
                          saveGatewaySettings('razorpay', { apiKey: e.target.value })
                        }
                        placeholder="rzp_test_..."
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="razorpay-api-secret">API Secret</Label>
                      <Input
                        id="razorpay-api-secret"
                        type="password"
                        value={gateways.razorpay.apiSecret}
                        onChange={(e) => 
                          saveGatewaySettings('razorpay', { apiSecret: e.target.value })
                        }
                        placeholder="Your API secret key"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razorpay-webhook-secret">Webhook Secret</Label>
                    <Input
                      id="razorpay-webhook-secret"
                      type="password"
                      value={gateways.razorpay.webhookSecret}
                      onChange={(e) => 
                        saveGatewaySettings('razorpay', { webhookSecret: e.target.value })
                      }
                      placeholder="Your webhook secret"
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razorpay-webhook-url">Webhook URL</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="razorpay-webhook-url"
                        value={`${window.location.origin}/api/webhooks/razorpay`}
                        readOnly
                        className="bg-muted"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/api/webhooks/razorpay`
                          );
                          toast({
                            title: 'Copied!',
                            description: 'Webhook URL copied to clipboard',
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set this URL in your Razorpay dashboard webhook settings
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stripe</CardTitle>
              <CardDescription>
                Accept payments via Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-medium">Enable Stripe</h3>
                  <p className="text-sm text-muted-foreground">
                    {gateways.stripe.enabled 
                      ? 'Stripe is currently enabled' 
                      : 'Stripe is currently disabled'}
                  </p>
                </div>
                <Switch
                  checked={gateways.stripe.enabled}
                  onCheckedChange={(checked) => toggleGateway('stripe', checked)}
                  disabled={isSaving}
                />
              </div>

              {gateways.stripe.enabled && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="stripe-test-mode"
                      checked={gateways.stripe.testMode}
                      onCheckedChange={(checked) => 
                        saveGatewaySettings('stripe', { testMode: checked })
                      }
                      disabled={isSaving}
                    />
                    <Label htmlFor="stripe-test-mode">Test Mode</Label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="stripe-publishable-key">Publishable Key</Label>
                      <Input
                        id="stripe-publishable-key"
                        type="password"
                        value={gateways.stripe.publishableKey}
                        onChange={(e) => 
                          saveGatewaySettings('stripe', { publishableKey: e.target.value })
                        }
                        placeholder="pk_test_..."
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stripe-secret-key">Secret Key</Label>
                      <Input
                        id="stripe-secret-key"
                        type="password"
                        value={gateways.stripe.secretKey}
                        onChange={(e) => 
                          saveGatewaySettings('stripe', { secretKey: e.target.value })
                        }
                        placeholder="sk_test_..."
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe-webhook-secret">Webhook Secret</Label>
                    <Input
                      id="stripe-webhook-secret"
                      type="password"
                      value={gateways.stripe.webhookSecret}
                      onChange={(e) => 
                        saveGatewaySettings('stripe', { webhookSecret: e.target.value })
                      }
                      placeholder="whsec_..."
                      disabled={isSaving}
                    />
                    <p className="text-sm text-muted-foreground">
                      Set up a webhook in your Stripe dashboard with the following URL:
                    </p>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={`${window.location.origin}/api/webhooks/stripe`}
                        readOnly
                        className="bg-muted"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/api/webhooks/stripe`
                          );
                          toast({
                            title: 'Copied!',
                            description: 'Webhook URL copied to clipboard',
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Pricing Plans</h2>
            <Button 
              onClick={() => {
                planForm.reset({
                  name: '',
                  description: '',
                  price: 0,
                  currency: 'INR',
                  billingCycle: 'monthly',
                  features: [],
                  isActive: true,
                  trialDays: 0,
                });
                setIsAddingPlan(true);
              }}
              disabled={isAddingPlan}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
          </div>

          {isAddingPlan && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {planForm.watch('id') ? 'Edit Plan' : 'Add New Plan'}
                </CardTitle>
              </CardHeader>
              <form onSubmit={planForm.handleSubmit(savePlan)}>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="plan-name">Plan Name</Label>
                      <Input
                        id="plan-name"
                        placeholder="e.g., Pro Plan"
                        {...planForm.register('name')}
                      />
                      {planForm.formState.errors.name && (
                        <p className="text-sm text-red-500">
                          {planForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan-price">Price</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <Input
                          id="plan-price"
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-7"
                          {...planForm.register('price', { valueAsNumber: true })}
                        />
                      </div>
                      {planForm.formState.errors.price && (
                        <p className="text-sm text-red-500">
                          {planForm.formState.errors.price.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan-billing-cycle">Billing Cycle</Label>
                      <Select
                        onValueChange={(value) =>
                          planForm.setValue('billingCycle', value)
                        }
                        defaultValue={planForm.getValues('billingCycle')}
                      >
                        <SelectTrigger id="plan-billing-cycle">
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly (Save 10%)</SelectItem>
                          <SelectItem value="annually">Annually (Save 20%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plan-trial-days">Trial Period (days)</Label>
                      <Input
                        id="plan-trial-days"
                        type="number"
                        min="0"
                        {...planForm.register('trialDays', { valueAsNumber: true })}
                      />
                      {planForm.formState.errors.trialDays && (
                        <p className="text-sm text-red-500">
                          {planForm.formState.errors.trialDays.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-description">Description</Label>
                    <textarea
                      id="plan-description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Describe what this plan includes..."
                      {...planForm.register('description')}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Features</Label>
                    <div className="space-y-2">
                      {planForm.watch('features')?.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={feature}
                            onChange={(e) => {
                              const features = [...planForm.getValues('features')];
                              features[index] = e.target.value;
                              planForm.setValue('features', features);
                            }}
                            placeholder="Feature description"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const features = [...planForm.getValues('features')];
                              features.splice(index, 1);
                              planForm.setValue('features', features);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const features = planForm.getValues('features') || [];
                          planForm.setValue('features', [...features, '']);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Feature
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="plan-active"
                      checked={planForm.watch('isActive')}
                      onCheckedChange={(checked) =>
                        planForm.setValue('isActive', checked)
                      }
                    />
                    <Label htmlFor="plan-active">Active</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      planForm.reset();
                      setIsAddingPlan(false);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Plan
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">
                        ₹{plan.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.billingCycle === 'monthly' ? 'mo' : plan.billingCycle === 'quarterly' ? 'qtr' : 'yr'}
                        </span>
                      </span>
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => togglePlanStatus(plan)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <svg
                          className="h-4 w-4 text-green-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editPlan(plan)}
                    disabled={isSaving}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePlan(plan.id)}
                    disabled={isSaving}
                    className="text-red-500 hover:text-red-600"
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {plans.length === 0 && !isAddingPlan && (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium">No pricing plans</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating a new pricing plan.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        planForm.reset({
                          name: '',
                          description: '',
                          price: 0,
                          currency: 'INR',
                          billingCycle: 'monthly',
                          features: [],
                          isActive: true,
                          trialDays: 0,
                        });
                        setIsAddingPlan(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> New Plan
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Coupons & Discounts Tab */}
        <TabsContent value="coupons" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Coupons & Discounts</h2>
            <Button 
              onClick={() => {
                couponForm.reset({
                  code: '',
                  discountType: 'percentage',
                  discountValue: 10,
                  maxUses: 100,
                  minPurchase: 0,
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  isActive: true,
                });
                setIsAddingCoupon(true);
              }}
              disabled={isAddingCoupon}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Coupon
            </Button>
          </div>

          {isAddingCoupon && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {couponForm.watch('id') ? 'Edit Coupon' : 'Create New Coupon'}
                </CardTitle>
              </CardHeader>
              <form onSubmit={couponForm.handleSubmit(saveCoupon)}>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="coupon-code">Coupon Code</Label>
                      <Input
                        id="coupon-code"
                        placeholder="e.g., WELCOME10"
                        {...couponForm.register('code')}
                      />
                      {couponForm.formState.errors.code && (
                        <p className="text-sm text-red-500">
                          {couponForm.formState.errors.code.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coupon-type">Discount Type</Label>
                      <Select
                        onValueChange={(value) =>
                          couponForm.setValue('discountType', value)
                        }
                        defaultValue={couponForm.getValues('discountType')}
                      >
                        <SelectTrigger id="coupon-type">
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coupon-value">
                        {couponForm.watch('discountType') === 'percentage' 
                          ? 'Discount Percentage' 
                          : 'Discount Amount'}
                      </Label>
                      <div className="relative">
                        {couponForm.watch('discountType') === 'percentage' ? (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        ) : (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                        )}
                        <Input
                          id="coupon-value"
                          type="number"
                          step={couponForm.watch('discountType') === 'percentage' ? '1' : '0.01'}
                          min="0"
                          max={couponForm.watch('discountType') === 'percentage' ? '100' : ''}
                          className={couponForm.watch('discountType') === 'percentage' ? 'pl-10' : 'pl-7'}
                          {...couponForm.register('discountValue', { valueAsNumber: true })}
                        />
                      </div>
                      {couponForm.formState.errors.discountValue && (
                        <p className="text-sm text-red-500">
                          {couponForm.formState.errors.discountValue.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coupon-max-uses">Maximum Uses</Label>
                      <Input
                        id="coupon-max-uses"
                        type="number"
                        min="1"
                        {...couponForm.register('maxUses', { valueAsNumber: true })}
                      />
                      {couponForm.formState.errors.maxUses && (
                        <p className="text-sm text-red-500">
                          {couponForm.formState.errors.maxUses.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coupon-min-purchase">Minimum Purchase (₹)</Label>
                      <Input
                        id="coupon-min-purchase"
                        type="number"
                        min="0"
                        step="0.01"
                        {...couponForm.register('minPurchase', { valueAsNumber: true })}
                      />
                      {couponForm.formState.errors.minPurchase && (
                        <p className="text-sm text-red-500">
                          {couponForm.formState.errors.minPurchase.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coupon-start-date">Start Date</Label>
                      <Input
                        id="coupon-start-date"
                        type="date"
                        {...couponForm.register('startDate')}
                      />
                      {couponForm.formState.errors.startDate && (
                        <p className="text-sm text-red-500">
                          {couponForm.formState.errors.startDate.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coupon-end-date">End Date</Label>
                      <Input
                        id="coupon-end-date"
                        type="date"
                        min={couponForm.getValues('startDate')}
                        {...couponForm.register('endDate')}
                      />
                      {couponForm.formState.errors.endDate && (
                        <p className="text-sm text-red-500">
                          {couponForm.formState.errors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="coupon-active"
                      checked={couponForm.watch('isActive')}
                      onCheckedChange={(checked) =>
                        couponForm.setValue('isActive', checked)
                      }
                    />
                    <Label htmlFor="coupon-active">Active</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      couponForm.reset();
                      setIsAddingCoupon(false);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {couponForm.watch('id') ? 'Update' : 'Create'} Coupon
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          <div className="space-y-4">
            {coupons.length > 0 ? (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted/50 p-3 font-medium">
                  <div className="col-span-3">Code</div>
                  <div className="col-span-2">Discount</div>
                  <div className="col-span-2">Uses</div>
                  <div className="col-span-3">Validity</div>
                  <div className="col-span-2">Status</div>
                </div>
                <div className="divide-y">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="grid grid-cols-12 items-center p-3 hover:bg-muted/50">
                      <div className="col-span-3 font-medium">{coupon.code}</div>
                      <div className="col-span-2">
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}%` 
                          : `₹${coupon.discountValue}`}
                      </div>
                      <div className="col-span-2">
                        {coupon.usedCount} / {coupon.maxUses}
                      </div>
                      <div className="col-span-3 text-sm text-muted-foreground">
                        {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                      </div>
                      <div className="col-span-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coupon.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editCoupon(coupon)}
                          disabled={isSaving}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCoupon(coupon.id)}
                          disabled={isSaving}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M15 5v2m0 4v2m0 4v2m5-11a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h8z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium">No coupons</h3>
                  <p className="mt-1 text-sm">
                    Create your first coupon to offer discounts to customers.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        couponForm.reset({
                          code: '',
                          discountType: 'percentage',
                          discountValue: 10,
                          maxUses: 100,
                          minPurchase: 0,
                          startDate: new Date().toISOString().split('T')[0],
                          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          isActive: true,
                        });
                        setIsAddingCoupon(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> New Coupon
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tax Settings Tab */}
        <TabsContent value="tax" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium">Tax Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure tax rates for different regions
              </p>
            </div>
            <Button 
              onClick={() => {
                taxRateForm.reset({
                  name: '',
                  rate: 0,
                  country: '',
                  state: '',
                  isInclusive: false,
                  isActive: true,
                });
                setIsAddingTaxRate(true);
              }}
              disabled={isAddingTaxRate}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Tax Rate
            </Button>
          </div>

          {isAddingTaxRate && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {taxRateForm.watch('id') ? 'Edit Tax Rate' : 'Add New Tax Rate'}
                </CardTitle>
              </CardHeader>
              <form onSubmit={taxRateForm.handleSubmit(saveTaxRate)}>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tax-name">Tax Name</Label>
                      <Input
                        id="tax-name"
                        placeholder="e.g., GST, VAT, Sales Tax"
                        {...taxRateForm.register('name')}
                      />
                      {taxRateForm.formState.errors.name && (
                        <p className="text-sm text-red-500">
                          {taxRateForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                        <Input
                          id="tax-rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="pl-10"
                          {...taxRateForm.register('rate', { valueAsNumber: true })}
                        />
                      </div>
                      {taxRateForm.formState.errors.rate && (
                        <p className="text-sm text-red-500">
                          {taxRateForm.formState.errors.rate.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tax-country">Country</Label>
                      <Select
                        onValueChange={(value) =>
                          taxRateForm.setValue('country', value)
                        }
                        defaultValue={taxRateForm.getValues('country')}
                      >
                        <SelectTrigger id="tax-country">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">India</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {taxRateForm.formState.errors.country && (
                        <p className="text-sm text-red-500">
                          {taxRateForm.formState.errors.country.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tax-state">State/Region (Optional)</Label>
                      <Input
                        id="tax-state"
                        placeholder="e.g., California, Maharashtra"
                        {...taxRateForm.register('state')}
                      />
                      {taxRateForm.formState.errors.state && (
                        <p className="text-sm text-red-500">
                          {taxRateForm.formState.errors.state.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tax-inclusive"
                        checked={taxRateForm.watch('isInclusive')}
                        onCheckedChange={(checked) =>
                          taxRateForm.setValue('isInclusive', checked)
                        }
                      />
                      <div>
                        <Label htmlFor="tax-inclusive">Prices include tax</Label>
                        <p className="text-sm text-muted-foreground">
                          When enabled, the tax amount is included in the product prices.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tax-active"
                        checked={taxRateForm.watch('isActive')}
                        onCheckedChange={(checked) =>
                          taxRateForm.setValue('isActive', checked)
                        }
                      />
                      <Label htmlFor="tax-active">Active</Label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      taxRateForm.reset();
                      setIsAddingTaxRate(false);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {taxRateForm.watch('id') ? 'Update' : 'Save'} Tax Rate
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          <div className="space-y-4">
            {taxRates.length > 0 ? (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted/50 p-3 font-medium">
                  <div className="col-span-3">Tax Name</div>
                  <div className="col-span-2">Rate</div>
                  <div className="col-span-3">Location</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Status</div>
                </div>
                <div className="divide-y">
                  {taxRates.map((taxRate) => (
                    <div key={taxRate.id} className="grid grid-cols-12 items-center p-3 hover:bg-muted/50">
                      <div className="col-span-3 font-medium">{taxRate.name}</div>
                      <div className="col-span-2">{taxRate.rate}%</div>
                      <div className="col-span-3">
                        {taxRate.country}
                        {taxRate.state ? `, ${taxRate.state}` : ''}
                      </div>
                      <div className="col-span-2">
                        {taxRate.isInclusive ? 'Inclusive' : 'Exclusive'}
                      </div>
                      <div className="col-span-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          taxRate.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {taxRate.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editTaxRate(taxRate)}
                          disabled={isSaving}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTaxRate(taxRate.id)}
                          disabled={isSaving}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium">No tax rates</h3>
                  <p className="mt-1 text-sm">
                    Add tax rates to charge taxes on purchases.
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => {
                        taxRateForm.reset({
                          name: '',
                          rate: 0,
                          country: '',
                          state: '',
                          isInclusive: false,
                          isActive: true,
                        });
                        setIsAddingTaxRate(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Tax Rate
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
