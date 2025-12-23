'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, BookOpen, BarChart, Clock, Award, TrendingUp, Activity, UserCheck, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Charts
import dynamic from 'next/dynamic';
const LineChart = dynamic(() => import('@/components/charts/line-chart'), { ssr: false });
const BarChartComponent = dynamic(() => import('@/components/charts/bar-chart'), { ssr: false });
const PieChart = dynamic(() => import('@/components/charts/pie-chart'), { ssr: false });

// Sections
import { UserEngagement } from './sections/user-engagement';
import { ContentPerformance } from './sections/content-performance';
import { TestAnalytics } from './sections/test-analytics';
import { UserActivity } from './sections/user-activity';

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    userEngagement: {},
    contentPerformance: {},
    testPerformance: {},
    userActivity: []
  });

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      });

      const response = await fetch(`/api/analytics/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Insights and metrics about your platform's performance
          </p>
        </div>
        <DatePickerWithRange
          dateRange={dateRange}
          onDateChange={setDateRange}
          className="w-full md:w-auto"
        />
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-1/2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.userEngagement.totalUsers || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.userEngagement.newUsers || 0} new this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.userEngagement.activeUsers || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Views</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.contentPerformance.totalViews || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.contentPerformance.uniqueViewers || 0} unique viewers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Attempts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.testPerformance.totalAttempts || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.testPerformance.uniqueTestTakers || 0} unique test takers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">User Activity</h3>
              <div className="h-80">
                <LineChart
                  data={data.userEngagement.dailyActiveUsers || []}
                  xKey="date"
                  yKey="count"
                  xLabel="Date"
                  yLabel="Active Users"
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Content Performance</h3>
              <div className="h-80">
                <BarChartComponent
                  data={data.contentPerformance.topPerformingContent || []}
                  xKey="title"
                  yKey="views"
                  xLabel="Content"
                  yLabel="Views"
                />
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest user activities on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <UserActivity activities={data.userActivity} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserEngagement data={data.userEngagement} />
        </TabsContent>

        <TabsContent value="content">
          <ContentPerformance data={data.contentPerformance} />
        </TabsContent>

        <TabsContent value="tests">
          <TestAnalytics data={data.testPerformance} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
