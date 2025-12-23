'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, BookOpen, BarChart, Clock, Award, TrendingUp, Activity, UserCheck, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

// Components
import { Overview } from './_components/overview';
import { UserActivityTable } from './_components/user-activity-table';
import { ContentPerformance } from './_components/content-performance';
import { TestAnalytics } from './_components/test-analytics';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalContentViews: 0,
    totalTestAttempts: 0,
    completionRate: 0,
    recentActivity: [],
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
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

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when date range changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [dateRange, status]);

  // Loading skeleton
  if (status === 'loading' || isLoading) {
    return <AnalyticsSkeleton />;
  }

  // Check if user has permission to view analytics
  if (!['admin', 'analyst'].includes(session?.user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="bg-yellow-100 p-4 rounded-full mb-4">
          <BarChart className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don't have permission to view analytics. Please contact an administrator.
        </p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track and analyze platform usage and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange 
            date={dateRange} 
            onDateChange={setDateRange} 
            className="w-[280px]"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalytics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={<Users className="h-4 w-4 text-muted-foreground" />} 
          description="All registered users"
          isLoading={isLoading}
        />
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers} 
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />} 
          description="Active in last 7 days"
          isLoading={isLoading}
        />
        <StatCard 
          title="Content Views" 
          value={stats.totalContentViews} 
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} 
          description="Total content interactions"
          isLoading={isLoading}
        />
        <StatCard 
          title="Test Attempts" 
          value={stats.totalTestAttempts} 
          icon={<FileText className="h-4 w-4 text-muted-foreground" />} 
          description="Total tests taken"
          isLoading={isLoading}
        />
        <StatCard 
          title="Avg. Completion" 
          value={`${stats.completionRate}%`} 
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} 
          description="Average content completion"
          isLoading={isLoading}
        />
        <StatCard 
          title="Avg. Time Spent" 
          value={formatDuration(stats.avgTimeSpent)} 
          icon={<Clock className="h-4 w-4 text-muted-foreground" />} 
          description="Per user session"
          isLoading={isLoading}
        />
        <StatCard 
          title="Engagement Score" 
          value={stats.engagementScore || 'N/A'} 
          icon={<Activity className="h-4 w-4 text-muted-foreground" />} 
          description="Platform engagement (0-100)"
          isLoading={isLoading}
        />
        <StatCard 
          title="Retention Rate" 
          value={stats.retentionRate ? `${stats.retentionRate}%` : 'N/A'} 
          icon={<Award className="h-4 w-4 text-muted-foreground" />} 
          description="7-day user retention"
          isLoading={isLoading}
        />
      </div>

      <Tabs 
        defaultValue="overview" 
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="tests">Test Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Overview 
            dateRange={dateRange} 
            stats={stats} 
            isLoading={isLoading} 
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Track user engagement and platform usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserActivityTable 
                data={stats.userActivity || []} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <ContentPerformance 
            data={stats.contentPerformance || []} 
            isLoading={isLoading} 
          />
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <TestAnalytics 
            data={stats.testAnalytics || []} 
            isLoading={isLoading} 
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>
                Generate and download detailed analytics reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">User Activity Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed user engagement and activity metrics
                    </p>
                  </div>
                  <Button variant="outline">Download CSV</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Content Performance Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Performance metrics for all content items
                    </p>
                  </div>
                  <Button variant="outline">Download CSV</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Test Results Report</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed test performance and results
                    </p>
                  </div>
                  <Button variant="outline">Download CSV</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, description, isLoading }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[280px]" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
