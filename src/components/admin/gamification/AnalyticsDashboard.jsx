'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiUsers, 
  FiAward, 
  FiZap, 
  FiTrendingUp, 
  FiBarChart2, 
  FiCalendar, 
  FiFilter, 
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { format, subDays, subMonths, isAfter, isBefore, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, ArcElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
];

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analytics', { 
      startDate: dateRange.from?.toISOString(), 
      endDate: dateRange.to?.toISOString() 
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.from?.toISOString() || '',
        endDate: dateRange.to?.toISOString() || '',
      });
      
      const response = await fetch(`/api/admin/gamification/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      return response.json();
    },
  });

  // Handle time range change
  useEffect(() => {
    if (timeRange === 'custom') return;
    
    let fromDate = new Date();
    switch (timeRange) {
      case '7d':
        fromDate = subDays(new Date(), 7);
        break;
      case '30d':
        fromDate = subDays(new Date(), 30);
        break;
      case '90d':
        fromDate = subDays(new Date(), 90);
        break;
      default:
        fromDate = subDays(new Date(), 30);
    }
    
    setDateRange({
      from: fromDate,
      to: new Date(),
    });
  }, [timeRange]);

  // Format date for display
  const formatDateRange = () => {
    if (!dateRange.from || !dateRange.to) return '';
    return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
  };

  // Prepare data for charts
  const prepareEngagementData = () => {
    if (!analyticsData?.dailyEngagement) return { labels: [], datasets: [] };
    
    const labels = analyticsData.dailyEngagement.map(day => 
      format(parseISO(day.date), 'MMM d')
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Active Users',
          data: analyticsData.dailyEngagement.map(day => day.activeUsers),
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Completed Challenges',
          data: analyticsData.dailyEngagement.map(day => day.completedChallenges),
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  const prepareBadgeDistributionData = () => {
    if (!analyticsData?.badgeDistribution) return { labels: [], datasets: [] };
    
    return {
      labels: analyticsData.badgeDistribution.map(item => item.badgeName),
      datasets: [
        {
          label: 'Badge Distribution',
          data: analyticsData.badgeDistribution.map(item => item.count),
          backgroundColor: [
            'rgba(79, 70, 229, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareChallengeCompletionData = () => {
    if (!analyticsData?.challengeCompletion) return { labels: [], datasets: [] };
    
    return {
      labels: analyticsData.challengeCompletion.map(item => item.challengeName),
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: analyticsData.challengeCompletion.map(item => 
            Math.round((item.completed / item.totalParticipants) * 100) || 0
          ),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  // Handle export data
  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/admin/gamification/analytics/export?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export error:', error);
      // Handle error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Track user engagement and gamification metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
          >
            <FiRefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
            disabled={isLoading}
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {timeRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                className="w-[300px]"
              />
            </div>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {formatDateRange()}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <FiUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.totalUsers?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.summary?.newUsers ? `+${analyticsData.summary.newUsers} this month` : 'No recent data'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <FiZap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.activeUsers?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.summary?.activeUsersChange ? 
                    `${Math.abs(analyticsData.summary.activeUsersChange)}% ${analyticsData.summary.activeUsersChange > 0 ? 'increase' : 'decrease'} from last period` : 
                    'No change'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Challenges Completed
                </CardTitle>
                <FiAward className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.challengesCompleted?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.summary?.avgChallengeCompletion ? 
                    `Avg. ${analyticsData.summary.avgChallengeCompletion}% completion rate` : 
                    'No data'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Engagement Score
                </CardTitle>
                <FiTrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.engagementScore ? 
                    `${Math.round(analyticsData.summary.engagementScore * 100)}/100` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData?.summary?.engagementChange ? 
                    `${Math.abs(analyticsData.summary.engagementChange)}% ${analyticsData.summary.engagementChange > 0 ? 'increase' : 'decrease'}` : 
                    'No change'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>
                    Daily active users and challenge completions over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {analyticsData?.dailyEngagement?.length > 0 ? (
                    <Line 
                      data={prepareEngagementData()} 
                      options={lineChartOptions} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No engagement data available for the selected period
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Badges</CardTitle>
                    <CardDescription>
                      Most commonly earned badges
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {analyticsData?.badgeDistribution?.length > 0 ? (
                      <Pie 
                        data={prepareBadgeDistributionData()} 
                        options={pieChartOptions} 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No badge data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Challenge Completion</CardTitle>
                    <CardDescription>
                      Completion rates by challenge
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {analyticsData?.challengeCompletion?.length > 0 ? (
                      <Bar 
                        data={prepareChallengeCompletionData()} 
                        options={barChartOptions} 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No challenge data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Analytics</CardTitle>
                  <CardDescription>
                    Detailed user engagement and activity metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    User analytics content will be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="challenges">
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Analytics</CardTitle>
                  <CardDescription>
                    Performance and completion metrics for challenges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    Challenge analytics content will be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badges">
              <Card>
                <CardHeader>
                  <CardTitle>Badge Analytics</CardTitle>
                  <CardDescription>
                    Distribution and earning metrics for badges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    Badge analytics content will be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
