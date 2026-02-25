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
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as ReBarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

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

  // Handle student role
  if (session?.user?.role === 'STUDENT') {
    return <StudentAnalyticsView />;
  }

  // Check if user has permission to view admin analytics
  if (!['admin', 'analyst'].includes(session?.user?.role?.toLowerCase())) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-6 rounded-full mb-6">
          <BarChart className="h-12 w-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          You don't have permission to view the global analytics dashboard.
        </p>
        <Button onClick={() => window.history.back()} className="rounded-xl px-10 py-6 font-bold text-lg shadow-lg shadow-primary/20">Go Back</Button>
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

function StudentAnalyticsView() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await fetch('/api/analytics/student');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch student analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return <div>Failed to load data</div>;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Your Performance</h1>
          <p className="text-muted-foreground">Detailed analysis of your test results and learning progress.</p>
        </div>
        <Button className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20">
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Score"
          value={`${data.summary.avgScore}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Overall average across all tests"
        />
        <StatCard
          title="Tests Taken"
          value={data.summary.totalTests}
          icon={<FileText className="h-4 w-4" />}
          description="Total successfully submitted tests"
        />
        <StatCard
          title="Best Performance"
          value={`${data.summary.highestScore}%`}
          icon={<Award className="h-4 w-4" />}
          description="Highest score achieved in any test"
        />
        <StatCard
          title="Study Time"
          value={`${Math.floor(data.summary.totalTime / 3600)}h ${Math.floor((data.summary.totalTime % 3600) / 60)}m`}
          icon={<Clock className="h-4 w-4" />}
          description="Total time spent taking tests"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-card">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Your score consistency over the last 10 tests</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Breakdown */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-card">
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average scores by subject</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={data.subjects} layout="vertical">
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.subjects.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Weaknesses */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-card">
          <CardHeader className="pb-2">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <CardTitle className="text-lg">Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent>
            {data.weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.weaknesses.map(w => (
                  <Badge key={w} variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 border-none px-3 py-1">
                    {w}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No specific weak areas detected yet. Keep it up!</p>
            )}
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-card">
          <CardHeader className="pb-2">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-lg">Your Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            {data.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.strengths.map(s => (
                  <Badge key={s} variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-none px-3 py-1">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Complete more tests to discover your strengths.</p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mb-2 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">AI Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90 leading-relaxed">
              {data.weaknesses.length > 0
                ? `Focus on your skills in ${data.weaknesses[0]}. We recommend taking a practice test in this subject to boost your average score.`
                : "You're doing great across all subjects! To further improve, try challenging yourself with higher difficulty olympiad level tests."}
            </p>
            <Button variant="secondary" className="w-full mt-4 font-bold rounded-lg border-none shadow-sm" onClick={() => window.location.href = '/tests'}>
              View Recommended Tests
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attempts Table */}
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-card">
        <CardHeader>
          <CardTitle>Recent Test Attempts</CardTitle>
          <CardDescription>Your most recent activity and results</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Test Name</th>
                  <th className="py-4 px-6">Subject</th>
                  <th className="py-4 px-6">Score</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6 text-right w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recentAttempts.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{a.test.title}</p>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="font-medium">{a.test.subject}</Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              a.score >= 70 ? "bg-green-500" : a.score >= 40 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${a.score}%` }}
                          />
                        </div>
                        <span className="font-bold text-sm">{a.score}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">
                      {new Date(a.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.location.href = `/tests/${a.testId}/results/${a.id}`}>
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

