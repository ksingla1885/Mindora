'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, CreditCard, TrendingUp, Users, ArrowUp, ArrowDown, 
  Download, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon,
  FileText, Globe, Building2, Wallet, Receipt, FileSpreadsheet,
  Loader2, AlertCircle, RefreshCw, Calendar, Filter, BarChart2
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';

// Components
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from '@/components/ui/table';

// Hooks
import useAnalyticsData from '@/hooks/useAnalyticsData';

// Utils
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

// API
import { financialAnalyticsApi, subscriptionAnalyticsApi } from '@/services/api/analytics.service';

// Constants
const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
];

const COUNTRIES = [
  { value: 'all', label: 'All Countries' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'IN', label: 'India' },
];

export default function FinancialAnalyticsDashboard() {
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [exporting, setExporting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [showMRRChart, setShowMRRChart] = useState(true);
  const [showChurnChart, setShowChurnChart] = useState(true);
  const [activeRevenueTab, setActiveRevenueTab] = useState('trends');
  const [activePaymentTab, setActivePaymentTab] = useState('overview');
  const [activeTaxTab, setActiveTaxTab] = useState('summary');
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    currency: 'USD',
    country: 'all',
    product: 'all',
    paymentMethod: 'all',
  });
  
  // Data loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Financial data state
  const [financialData, setFinancialData] = useState({
    summary: null,
    revenueByProduct: [],
    paymentAnalytics: null,
    taxSummary: [],
    revenueTrends: [],
    topCustomers: [],
    subscriptionMetrics: null,
    paymentMethods: [],
    refunds: [],
    revenueByCountry: [],
    revenueByPlan: [],
    paymentSuccessRates: {},
    taxCompliance: {},
    revenueForecast: []
  });
  
  // Subscription metrics state with enhanced data structure
  const [subscriptionMetrics, setSubscriptionMetrics] = useState({
    overview: null,
    mrr: { data: [], loading: true },
    arpu: { data: [], loading: true },
    ltv: { data: null, loading: true },
    retention: { data: null, loading: true },
    planChanges: { data: [], loading: true },
    loading: true,
    error: null
  });
  
  // Active subscription metrics tab
  const [activeMetricsTab, setActiveMetricsTab] = useState('mrr');

  // Fetch financial data with enhanced subscription metrics
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSubscriptionLoading(true);
        setSubscriptionError(null);

        // Fetch core financial data in parallel
        const [
          overview, 
          revenueByProduct, 
          paymentAnalytics, 
          taxSummary, 
          revenueTrends, 
          topCustomers,
          subscriptionMetrics,
          mrrData,
          arpuData,
          ltvData,
          retentionData,
          planChanges
        ] = await Promise.all([
          financialAnalyticsApi.getFinancialOverview(dateRange.from, dateRange.to),
          financialAnalyticsApi.getRevenueByProduct(dateRange.from, dateRange.to),
          financialAnalyticsApi.getPaymentAnalytics(dateRange.from, dateRange.to),
          financialAnalyticsApi.getTaxSummary(dateRange.from, dateRange.to, filters.country === 'all' ? null : filters.country),
          financialAnalyticsApi.getRevenueTrends(dateRange.from, dateRange.to, timeRange === '12m' ? 'month' : 'day'),
          financialAnalyticsApi.getTopCustomers(dateRange.from, dateRange.to, 10),
          subscriptionAnalyticsApi.getSubscriptionMetrics(dateRange.from, dateRange.to),
          subscriptionAnalyticsApi.getMRR(dateRange.from, dateRange.to, timeRange === '12m' ? 'month' : 'day'),
          subscriptionAnalyticsApi.getARPU(dateRange.from, dateRange.to, timeRange === '12m' ? 'month' : 'day'),
          subscriptionAnalyticsApi.getLTV(dateRange.from, dateRange.to, 'quarter'),
          subscriptionAnalyticsApi.getRetention(dateRange.from, dateRange.to, 'month'),
          subscriptionAnalyticsApi.getPlanChanges(dateRange.from, dateRange.to)
        ]);

        // Enhanced subscription metrics
        const enhancedSubscriptionMetrics = {
          ...subscriptionMetrics,
          mrr: mrrData,
          arpu: arpuData,
          ltv: ltvData,
          retention: retentionData,
          planChanges: planChanges
        };

        setFinancialData({
          summary: overview,
          revenueByProduct,
          paymentAnalytics,
          taxSummary,
          revenueTrends,
          topCustomers,
          subscriptionMetrics: enhancedSubscriptionMetrics
        });
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err.message || 'Failed to load financial data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, [dateRange, timeRange, filters.country]);

  // Fetch subscription metrics with enhanced data and error handling
  const fetchSubscriptionMetrics = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    try {
      // Set loading states
      setSubscriptionMetrics(prev => ({
        ...prev,
        loading: true,
        mrr: { ...prev.mrr, loading: true },
        arpu: { ...prev.arpu, loading: true },
        ltv: { ...prev.ltv, loading: true },
        retention: { ...prev.retention, loading: true },
        planChanges: { ...prev.planChanges, loading: true },
        error: null
      }));
      
      // Fetch all metrics in parallel
      const [
        metrics,
        mrrData,
        arpuData,
        ltvData,
        retentionData,
        planChanges
      ] = await Promise.all([
        subscriptionAnalyticsApi.getSubscriptionMetrics(dateRange.from, dateRange.to).catch(e => ({ error: e.message })),
        subscriptionAnalyticsApi.getMRR(dateRange.from, dateRange.to, timeRange === '12m' ? 'month' : 'day').catch(e => ({ error: e.message })),
        subscriptionAnalyticsApi.getARPU(dateRange.from, dateRange.to, timeRange === '12m' ? 'month' : 'day').catch(e => ({ error: e.message })),
        subscriptionAnalyticsApi.getLTV(dateRange.from, dateRange.to, 'quarter').catch(e => ({ error: e.message })),
        subscriptionAnalyticsApi.getRetention(dateRange.from, dateRange.to, 'month').catch(e => ({ error: e.message })),
        subscriptionAnalyticsApi.getPlanChanges(dateRange.from, dateRange.to).catch(e => ({ error: e.message }))
      ]);
      
      // Update state with new data
      setSubscriptionMetrics(prev => ({
        ...prev,
        overview: metrics.error ? prev.overview : metrics,
        mrr: { 
          data: mrrData.error ? prev.mrr.data : mrrData, 
          loading: false,
          error: mrrData.error || null 
        },
        arpu: { 
          data: arpuData.error ? prev.arpu.data : arpuData, 
          loading: false,
          error: arpuData.error || null 
        },
        ltv: { 
          data: ltvData.error ? prev.ltv.data : ltvData, 
          loading: false,
          error: ltvData.error || null 
        },
        retention: { 
          data: retentionData.error ? prev.retention.data : retentionData, 
          loading: false,
          error: retentionData.error || null 
        },
        planChanges: { 
          data: planChanges.error ? prev.planChanges.data : planChanges, 
          loading: false,
          error: planChanges.error || null 
        },
        loading: false,
        error: null
      }));
      
    } catch (error) {
      console.error('Error in subscription metrics:', error);
      setSubscriptionMetrics(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load subscription metrics'
      }));
    }
  }, [dateRange, timeRange]);

  // Initialize subscription metrics
  useEffect(() => {
    fetchSubscriptionMetrics();
  }, [fetchSubscriptionMetrics]);

  const filteredPlans = useMemo(() => {
    if (!subscriptionMetrics.overview?.plans) return [];
    return selectedPlan === 'all' 
      ? subscriptionMetrics.overview.plans 
      : subscriptionMetrics.overview.plans.filter(plan => plan.id === selectedPlan);
  }, [subscriptionMetrics.overview, selectedPlan]);

  // Enhanced chart data with MRR, ARPU, and other metrics based on active tab
  const chartData = useMemo(() => {
    const baseData = {
      labels: [],
      datasets: [],
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: activeMetricsTab === 'arpu' ? 'ARPU ($)' : 'Amount ($)'
            }
          },
          y1: {
            type: 'linear',
            display: activeMetricsTab === 'mrr',
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Count'
            }
          }
        }
      }
    };

    switch (activeMetricsTab) {
      case 'mrr':
        if (subscriptionMetrics.mrr?.data?.length) {
          baseData.labels = subscriptionMetrics.mrr.data.map(d => d.period);
          
          // Add MRR data
          baseData.datasets.push({
            label: 'MRR',
            data: subscriptionMetrics.mrr.data.map(d => d.mrr),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            fill: true,
          });

          // Add new MRR if available
          if (subscriptionMetrics.mrr.data[0].newMrr) {
            baseData.datasets.push({
              label: 'New MRR',
              data: subscriptionMetrics.mrr.data.map(d => d.newMrr || 0),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              yAxisID: 'y',
              tension: 0.4,
            });
          }
        }
        break;
        
      case 'arpu':
        if (subscriptionMetrics.arpu?.data?.length) {
          baseData.labels = subscriptionMetrics.arpu.data.map(d => d.period);
          
          baseData.datasets.push({
            label: 'ARPU',
            data: subscriptionMetrics.arpu.data.map(d => d.arpu),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            fill: true,
          });
        }
        break;
        
      case 'ltv':
        if (subscriptionMetrics.ltv?.data) {
          const ltvData = subscriptionMetrics.ltv.data;
          baseData.labels = ltvData.cohorts || [];
          
          baseData.datasets = [
            {
              label: 'LTV',
              data: ltvData.ltvValues || [],
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              yAxisID: 'y',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'CAC',
              data: ltvData.cacValues || [],
              borderColor: '#ec4899',
              borderDash: [5, 5],
              backgroundColor: 'transparent',
              yAxisID: 'y',
              tension: 0.4,
            }
          ];
          
          baseData.options.scales.y.title.text = 'Amount ($)';
        }
        break;
        
      case 'retention':
        if (subscriptionMetrics.retention?.data) {
          const retentionData = subscriptionMetrics.retention.data;
          baseData.labels = retentionData.periods || [];
          
          baseData.datasets = retentionData.cohorts.map((cohort, index) => ({
            label: cohort.name,
            data: cohort.retentionRates,
            borderColor: `hsl(${(index * 360) / retentionData.cohorts.length}, 70%, 60%)`,
            backgroundColor: `hsla(${(index * 360) / retentionData.cohorts.length}, 70%, 60%, 0.1)`,
            tension: 0.4,
            fill: index === 0,
          }));
          
          baseData.options.scales.y.title.text = 'Retention Rate (%)';
          baseData.options.scales.y.ticks = {
            callback: (value) => `${value}%`
          };
        }
        break;
    }

    return baseData;
  }, [subscriptionMetrics, activeMetricsTab]);

  const planDistributionData = useMemo(() => {
    if (!subscriptionMetrics.overview?.plans) return { labels: [], datasets: [] };
    
    // Sort plans by count (descending)
    const sortedPlans = [...subscriptionMetrics.overview.plans].sort((a, b) => b.count - a.count);
    
    // Generate colors based on plan count
    const backgroundColors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(79, 70, 229, 0.8)',
      'rgba(67, 56, 202, 0.8)',
      'rgba(55, 48, 163, 0.8)',
      'rgba(49, 46, 129, 0.8)'
    ];
    
    // Create border colors by increasing opacity
    const borderColors = backgroundColors.map(c => c.replace('0.8', '1'));
    
    return {
      labels: sortedPlans.map(p => p.name),
      datasets: [
        {
          data: sortedPlans.map(p => p.count),
          backgroundColor: backgroundColors.slice(0, sortedPlans.length),
          borderColor: borderColors.slice(0, sortedPlans.length),
          borderWidth: 1,
        },
      ],
    };
  }, [subscriptionMetrics.overview?.plans]);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };


  // Handle export
  const handleExport = async (type) => {
    try {
      setExporting(true);
      const blob = await financialAnalyticsApi.exportFinancialReport(
        type,
        'csv',
        dateRange.from,
        dateRange.to
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${type}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      // Show error toast or notification
    } finally {
      setExporting(false);
    }
  };

  // Format data for charts
  const revenueTrendsData = useMemo(() => {
    if (!financialData.revenueTrends?.length) return { labels: [], datasets: [] };

    return {
      labels: financialData.revenueTrends.map(item => 
        format(parseISO(item.date), timeRange === '12m' ? 'MMM yyyy' : 'MMM d')
      ),
      datasets: [
        {
          label: 'Revenue',
          data: financialData.revenueTrends.map(item => item.revenue),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          yAxisID: 'y',
        },
        {
          label: 'New Customers',
          data: financialData.revenueTrends.map(item => item.newCustomers || 0),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          yAxisID: 'y1',
        },
      ],
    };
  }, [financialData.revenueTrends, timeRange]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <h3 className="font-medium">Error loading financial data</h3>
          <p className="text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Subscription metrics summary cards with tabs for different metrics
  const renderSubscriptionMetrics = () => {
    if (subscriptionMetrics.loading) {
      return (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      );
    }

    if (subscriptionMetrics.error) {
      return (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading subscription metrics
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{subscriptionMetrics.error}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const { totalSubscribers, activeSubscribers, churnRate, mrr, arr, arpu } = subscriptionMetrics.overview;
    const currentLTV = subscriptionMetrics.ltv?.data?.currentLTV || 0;
    const currentCAC = subscriptionMetrics.ltv?.data?.currentCAC || 0;
    const ltvCacRatio = currentCAC > 0 ? (currentLTV / currentCAC).toFixed(2) : 0;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Subscribers"
            value={totalSubscribers?.toLocaleString()}
            icon={<Users className="h-5 w-5 text-indigo-600" />}
            trend={subscriptionMetrics.overview.subscriberGrowth}
            loading={subscriptionMetrics.loading}
          />
          <MetricCard
            title="MRR"
            value={mrr ? `$${mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A'}
            icon={<DollarSign className="h-5 w-5 text-blue-600" />}
            trend={subscriptionMetrics.overview.mrrGrowth}
            loading={subscriptionMetrics.mrr.loading}
          />
          <MetricCard
            title="ARPU"
            value={arpu ? `$${arpu.toFixed(2)}` : 'N/A'}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            trend={subscriptionMetrics.overview.arpuGrowth}
            loading={subscriptionMetrics.arpu.loading}
          />
          <MetricCard
            title="Churn Rate"
            value={`${(churnRate * 100).toFixed(2)}%`}
            icon={<TrendingUp className={`h-5 w-5 ${churnRate > 0.05 ? 'text-red-600' : 'text-yellow-600'}`} />}
            trend={subscriptionMetrics.overview.churnRateChange * 100}
            inverseTrend
            loading={subscriptionMetrics.loading}
          />
        </div>

        {/* LTV/CAC Ratio Card */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">LTV/CAC Ratio</CardTitle>
                <CardDescription>Customer Lifetime Value to Customer Acquisition Cost</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ltvCacRatio}x</div>
                <div className={`mt-1 text-sm ${ltvCacRatio > 3 ? 'text-green-600' : ltvCacRatio > 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {ltvCacRatio > 3 ? 'Healthy' : ltvCacRatio > 1 ? 'Monitor' : 'Concerning'}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">LTV</div>
                  <div className="text-lg font-semibold">${currentLTV.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CAC</div>
                  <div className="text-lg font-semibold">${currentCAC.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payback Period</div>
                  <div className="text-lg font-semibold">
                    {subscriptionMetrics.ltv?.data?.paybackPeriod || 0} months
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Metrics Tabs */}
        <Card>
          <Tabs 
            value={activeMetricsTab} 
            onValueChange={setActiveMetricsTab}
            className="w-full"
          >
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="mrr">MRR</TabsTrigger>
                <TabsTrigger value="arpu">ARPU</TabsTrigger>
                <TabsTrigger value="ltv">LTV/CAC</TabsTrigger>
                <TabsTrigger value="retention">Retention</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="mrr" className="mt-0">
                <div className="h-80">
                  {subscriptionMetrics.mrr.loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : subscriptionMetrics.mrr.error ? (
                    <div className="flex h-full items-center justify-center text-red-500">
                      {subscriptionMetrics.mrr.error}
                    </div>
                  ) : (
                    <LineChart 
                      data={chartData} 
                      options={chartData.options}
                    />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="arpu" className="mt-0">
                <div className="h-80">
                  {subscriptionMetrics.arpu.loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : subscriptionMetrics.arpu.error ? (
                    <div className="flex h-full items-center justify-center text-red-500">
                      {subscriptionMetrics.arpu.error}
                    </div>
                  ) : (
                    <LineChart 
                      data={chartData} 
                      options={chartData.options}
                    />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="ltv" className="mt-0">
                <div className="h-80">
                  {subscriptionMetrics.ltv.loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : subscriptionMetrics.ltv.error ? (
                    <div className="flex h-full items-center justify-center text-red-500">
                      {subscriptionMetrics.ltv.error}
                    </div>
                  ) : (
                    <BarChart 
                      data={chartData} 
                      options={chartData.options}
                    />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="retention" className="mt-0">
                <div className="h-80">
                  {subscriptionMetrics.retention.loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : subscriptionMetrics.retention.error ? (
                    <div className="flex h-full items-center justify-center text-red-500">
                      {subscriptionMetrics.retention.error}
                    </div>
                  ) : (
                    <LineChart 
                      data={chartData} 
                      options={chartData.options}
                    />
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Breakdown of active subscriptions by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {subscriptionMetrics.overview.plans?.length > 0 ? (
                <PieChart data={planDistributionData} />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No plan distribution data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={handleDateRangeChange}
            className="w-full md:w-auto"
          />
          <Select 
            value={timeRange}
            onValueChange={(value) => {
              setTimeRange(value);
              if (value !== 'custom') {
                const from = value === '7d' ? subDays(new Date(), 7) : 
                             value === '30d' ? subDays(new Date(), 30) : 
                             subDays(new Date(), 365);
                setDateRange({ from, to: new Date() });
              }
            }}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.summary ? formatCurrency(financialData.summary.totalRevenue) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.summary?.revenueChange && (
                <span className={financialData.summary.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {financialData.summary.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(financialData.summary.revenueChange)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.summary ? formatNumber(financialData.summary.totalOrders) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.summary?.orderChange && (
                <span className={financialData.summary.orderChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {financialData.summary.orderChange >= 0 ? '↑' : '↓'} {Math.abs(financialData.summary.orderChange)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.summary ? formatCurrency(financialData.summary.averageOrderValue) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.summary?.aovChange && (
                <span className={financialData.summary.aovChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {financialData.summary.aovChange >= 0 ? '↑' : '↓'} {Math.abs(financialData.summary.aovChange)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialData.summary ? formatCurrency(financialData.summary.totalRefunds) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.summary?.refundChange && (
                <span className={financialData.summary.refundChange >= 0 ? 'text-red-500' : 'text-green-500'}>
                  {financialData.summary.refundChange >= 0 ? '↑' : '↓'} {Math.abs(financialData.summary.refundChange)}% from last period
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs 
        defaultValue="overview" 
        className="space-y-4" 
        onValueChange={setActiveTab}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <Users className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="taxes">
              <Receipt className="h-4 w-4 mr-2" />
              Taxes
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select 
              value={filters.currency}
              onValueChange={(value) => handleFilterChange('currency', value)}
            >
              <SelectTrigger className="w-full md:w-[120px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(currency => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.country}
              onValueChange={(value) => handleFilterChange('country', value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Revenue over time with new customers</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <LineChart 
                  data={revenueTrendsData}
                  options={{
                    responsive: true,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Revenue',
                        },
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                          drawOnChartArea: false,
                        },
                        title: {
                          display: true,
                          text: 'New Customers',
                        },
                        min: 0,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Sources</CardTitle>
                <CardDescription>Revenue by product category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {financialData.revenueByProduct?.length > 0 ? (
                  <PieChart 
                    data={{
                      labels: financialData.revenueByProduct.map(item => item.category),
                      datasets: [
                        {
                          data: financialData.revenueByProduct.map(item => item.revenue),
                          backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(99, 102, 241, 0.8)',
                            'rgba(236, 72, 153, 0.8)',
                          ],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((value / total) * 100);
                              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Top Customers</CardTitle>
                    <CardDescription>Highest spending customers</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.topCustomers?.slice(0, 5).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{customer.orders}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(customer.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Payment method distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {financialData.paymentAnalytics?.methods?.length > 0 ? (
                    <BarChart
                      data={{
                        labels: financialData.paymentAnalytics.methods.map(m => m.method),
                        datasets: [
                          {
                            label: 'Transactions',
                            data: financialData.paymentAnalytics.methods.map(m => m.count),
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Transactions',
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No payment method data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>Detailed revenue analysis by product and category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-auto">
                {financialData.revenueByProduct?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg. Price</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.revenueByProduct.map((product) => (
                        <TableRow key={`${product.id}-${product.category}`}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="text-right">{formatNumber(product.quantity)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.averagePrice)}</TableCell>
                          <TableCell className="text-right">
                            {financialData.summary?.totalRevenue 
                              ? ((product.revenue / financialData.summary.totalRevenue) * 100).toFixed(1) + '%' 
                              : '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Success Rate</CardTitle>
                <CardDescription>Overall payment success and failure rates</CardDescription>
              </CardHeader>
              <CardContent>
                {financialData.paymentAnalytics ? (
                  <div className="h-64">
                    <PieChart
                      data={{
                        labels: ['Successful', 'Failed', 'Pending'],
                        datasets: [
                          {
                            data: [
                              financialData.paymentAnalytics.successRate,
                              financialData.paymentAnalytics.failureRate,
                              financialData.paymentAnalytics.pendingRate || 0,
                            ],
                            backgroundColor: [
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                              'rgba(245, 158, 11, 0.8)',
                            ],
                            borderColor: [
                              'rgba(16, 185, 129, 1)',
                              'rgba(239, 68, 68, 1)',
                              'rgba(245, 158, 11, 1)',
                            ],
                            borderWidth: 1,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `${context.label}: ${context.raw}%`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No payment data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Common Payment Errors</CardTitle>
                <CardDescription>Most frequent payment failures</CardDescription>
              </CardHeader>
              <CardContent>
                {financialData.paymentAnalytics?.commonErrors?.length > 0 ? (
                  <div className="space-y-4">
                    {financialData.paymentAnalytics.commonErrors.map((error, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{error.code}</span>
                          <span className="text-muted-foreground">{error.count} occurrences</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(error.count / financialData.paymentAnalytics.totalFailures) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{error.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No payment error data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Performance</CardTitle>
              <CardDescription>Success rates by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              {financialData.paymentAnalytics?.methods?.length > 0 ? (
                <div className="h-80">
                  <BarChart
                    data={{
                      labels: financialData.paymentAnalytics.methods.map(m => m.method),
                      datasets: [
                        {
                          label: 'Success Rate',
                          data: financialData.paymentAnalytics.methods.map(m => m.successRate),
                          backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        },
                        {
                          label: 'Failure Rate',
                          data: financialData.paymentAnalytics.methods.map(m => m.failureRate),
                          backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Percentage (%)',
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  No payment method data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financialData.subscriptionMetrics?.totalSubscribers?.toLocaleString() || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {financialData.subscriptionMetrics?.subscriberChange && (
                    <span className={financialData.subscriptionMetrics.subscriberChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {financialData.subscriptionMetrics.subscriberChange >= 0 ? '↑' : '↓'} {Math.abs(financialData.subscriptionMetrics.subscriberChange)}% from last period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financialData.subscriptionMetrics?.mrr ? formatCurrency(financialData.subscriptionMetrics.mrr) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {financialData.subscriptionMetrics?.mrrChange && (
                    <span className={financialData.subscriptionMetrics.mrrChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {financialData.subscriptionMetrics.mrrChange >= 0 ? '↑' : '↓'} {Math.abs(financialData.subscriptionMetrics.mrrChange)}% from last period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {financialData.subscriptionMetrics?.churnRate ? `${financialData.subscriptionMetrics.churnRate}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {financialData.subscriptionMetrics?.churnChange && (
                    <span className={financialData.subscriptionMetrics.churnChange <= 0 ? 'text-green-500' : 'text-red-500'}>
                      {financialData.subscriptionMetrics.churnChange <= 0 ? '↓' : '↑'} {Math.abs(financialData.subscriptionMetrics.churnChange)}% from last period
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Growth</CardTitle>
              <CardDescription>New, canceled, and net subscription changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {financialData.subscriptionMetrics?.growthData?.length > 0 ? (
                  <LineChart
                    data={{
                      labels: financialData.subscriptionMetrics.growthData.map(d => d.period),
                      datasets: [
                        {
                          label: 'New Subscriptions',
                          data: financialData.subscriptionMetrics.growthData.map(d => d.newSubscriptions),
                          borderColor: 'rgba(16, 185, 129, 1)',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          tension: 0.3,
                        },
                        {
                          label: 'Cancellations',
                          data: financialData.subscriptionMetrics.growthData.map(d => -d.cancellations),
                          borderColor: 'rgba(239, 68, 68, 1)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          tension: 0.3,
                        },
                        {
                          label: 'Net Change',
                          data: financialData.subscriptionMetrics.growthData.map(d => d.netChange),
                          borderColor: 'rgba(59, 130, 246, 1)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.3,
                          borderDash: [5, 5],
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      scales: {
                        y: {
                          beginAtZero: false,
                          title: {
                            display: true,
                            text: 'Number of Subscriptions',
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No subscription growth data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Distribution of active subscriptions by plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {financialData.subscriptionMetrics?.plans?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64">
                      <PieChart
                        data={{
                          labels: financialData.subscriptionMetrics.plans.map(p => p.name),
                          datasets: [
                            {
                              data: financialData.subscriptionMetrics.plans.map(p => p.count),
                              backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(99, 102, 241, 0.8)',
                              ],
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'right',
                            },
                          },
                        }}
                      />
                    </div>
                    <div className="space-y-4">
                      {financialData.subscriptionMetrics.plans.map((plan, index) => (
                        <div key={plan.id} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-muted-foreground">{plan.count} subscribers</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${(plan.count / financialData.subscriptionMetrics.totalSubscribers) * 100}%`,
                                backgroundColor: [
                                  'rgba(59, 130, 246, 0.8)',
                                  'rgba(16, 185, 129, 0.8)',
                                  'rgba(245, 158, 11, 0.8)',
                                  'rgba(99, 102, 241, 0.8)',
                                ][index % 4]
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{formatCurrency(plan.price)}/{plan.billingCycle}</span>
                            <span className="font-medium">{((plan.count / financialData.subscriptionMetrics.totalSubscribers) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No subscription plan data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Taxes Tab */}
        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Summary</CardTitle>
              <CardDescription>Tax collection and compliance by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-auto">
                {financialData.taxSummary?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Taxable Sales</TableHead>
                        <TableHead className="text-right">Tax Rate</TableHead>
                        <TableHead className="text-right">Tax Collected</TableHead>
                        <TableHead className="text-right">Tax Due</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.taxSummary.map((tax) => (
                        <TableRow key={tax.country}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              {tax.countryName || tax.country}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(tax.taxableSales)}</TableCell>
                          <TableCell className="text-right">{tax.taxRate}%</TableCell>
                          <TableCell className="text-right">{formatCurrency(tax.taxCollected)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(tax.taxCollected - (tax.taxPaid || 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tax.status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : tax.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tax.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No tax data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tax Compliance</CardTitle>
              <CardDescription>Tax filing and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium mb-4">Upcoming Filings</h3>
                  <div className="space-y-4">
                    {financialData.taxSummary
                      ?.filter(tax => tax.nextFilingDate)
                      .sort((a, b) => new Date(a.nextFilingDate) - new Date(b.nextFilingDate))
                      .slice(0, 3)
                      .map((tax) => (
                        <div key={`${tax.country}-filing`} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{tax.countryName || tax.country} {tax.taxType || 'VAT'}</p>
                            <p className="text-sm text-muted-foreground">
                              Due {format(parseISO(tax.nextFilingDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            File Return
                          </Button>
                        </div>
                      ))}
                    {(!financialData.taxSummary || financialData.taxSummary.filter(tax => tax.nextFilingDate).length === 0) && (
                      <p className="text-sm text-muted-foreground">No upcoming tax filings</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-4">Recent Payments</h3>
                  <div className="space-y-4">
                    {financialData.taxSummary
                      ?.filter(tax => tax.lastPaymentDate)
                      .sort((a, b) => new Date(b.lastPaymentDate) - new Date(a.lastPaymentDate))
                      .slice(0, 3)
                      .map((tax) => (
                        <div key={`${tax.country}-payment`} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{tax.countryName || tax.country} {tax.taxType || 'VAT'}</p>
                              <p className="text-sm text-muted-foreground">
                                Paid on {format(parseISO(tax.lastPaymentDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <span className="font-medium">{formatCurrency(tax.lastPaymentAmount)}</span>
                          </div>
                          {tax.lastPaymentReference && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Reference: {tax.lastPaymentReference}
                            </p>
                          )}
                        </div>
                      ))}
                    {(!financialData.taxSummary || financialData.taxSummary.filter(tax => tax.lastPaymentDate).length === 0) && (
                      <p className="text-sm text-muted-foreground">No recent tax payments</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tax Rates by Country</CardTitle>
              <CardDescription>Current tax rates and rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {financialData.taxSummary?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>Tax Type</TableHead>
                        <TableHead className="text-right">Standard Rate</TableHead>
                        <TableHead className="text-right">Reduced Rate</TableHead>
                        <TableHead>Rules</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.taxSummary.map((tax) => (
                        <TableRow key={`${tax.country}-rates`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              {tax.countryName || tax.country}
                            </div>
                          </TableCell>
                          <TableCell>{tax.taxType || 'VAT'}</TableCell>
                          <TableCell className="text-right">{tax.standardRate}%</TableCell>
                          <TableCell className="text-right">
                            {tax.reducedRate ? `${tax.reducedRate}%` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {tax.taxRules?.map((rule, i) => (
                                <span 
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {rule}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No tax rate data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}