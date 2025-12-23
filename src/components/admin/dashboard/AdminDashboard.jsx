'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, Users, BookOpen, BarChart, Clock, TrendingUp, FileText, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  BarChart as BarChartComponent,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data - replace with actual API calls
const mockData = {
  stats: {
    totalStudents: 1245,
    activeTests: 8,
    totalContent: 156,
    avgTestScore: 72,
    newStudentsThisMonth: 128,
    testsCompleted: 342,
  },
  recentActivity: [
    { id: 1, user: 'Rahul Sharma', action: 'completed_test', test: 'NSO Mock Test 1', time: '2 hours ago' },
    { id: 2, user: 'Priya Patel', action: 'purchased_test', test: 'IIT JEE Advanced', time: '5 hours ago' },
    { id: 3, user: 'Admin', action: 'created_test', test: 'Weekly Physics Challenge', time: '1 day ago' },
    { id: 4, user: 'Amit Kumar', action: 'achieved_badge', test: 'Math Wizard', time: '1 day ago' },
  ],
  performanceData: [
    { name: 'Jan', students: 400, tests: 240, revenue: 2400 },
    { name: 'Feb', students: 300, tests: 139, revenue: 2210 },
    { name: 'Mar', students: 200, tests: 980, revenue: 2290 },
    { name: 'Apr', students: 278, tests: 390, revenue: 2000 },
    { name: 'May', students: 189, tests: 480, revenue: 2181 },
    { name: 'Jun', students: 239, tests: 380, revenue: 2500 },
    { name: 'Jul', students: 349, tests: 430, revenue: 2100 },
  ],
  testPerformance: [
    { name: 'NSO Mock Test 1', attempts: 230, avgScore: 78, completionRate: 92 },
    { name: 'IIT JEE Advanced', attempts: 180, avgScore: 65, completionRate: 88 },
    { name: 'Math Olympiad', attempts: 150, avgScore: 82, completionRate: 95 },
    { name: 'Physics Challenge', attempts: 120, avgScore: 71, completionRate: 85 },
  ],
  subjectDistribution: [
    { name: 'Mathematics', value: 35 },
    { name: 'Physics', value: 30 },
    { name: 'Chemistry', value: 20 },
    { name: 'Biology', value: 15 },
  ],
  COLORS: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'],
};

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        // Replace with actual API call
        // const response = await fetch('/api/admin/dashboard');
        // const data = await response.json();
        // setDashboardData(data);
        
        // Using mock data for now
        setTimeout(() => {
          setDashboardData(mockData);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const renderStatCard = (title, value, icon, change = null) => (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 rounded-md bg-primary/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <Skeleton className="h-8 w-16" /> : value}
        </div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last {timeRange}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const renderActivityItem = (activity) => (
    <div key={activity.id} className="flex items-start py-3 border-b">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
        <UserCheck className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {activity.user} <span className="text-muted-foreground">{activity.action.replace('_', ' ')}</span>
        </p>
        <p className="text-sm text-muted-foreground">{activity.test}</p>
      </div>
      <div className="text-xs text-muted-foreground">{activity.time}</div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-3 rounded shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Monthly growth and activity</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardData.performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="students" stroke="#8884d8" name="New Students" />
              <Line yAxisId="right" type="monotone" dataKey="tests" stroke="#82ca9d" name="Tests Completed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject Distribution</CardTitle>
          <CardDescription>Content and test distribution by subject</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardData.subjectDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.subjectDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={dashboardData.COLORS[index % dashboardData.COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Test Performance</CardTitle>
          <CardDescription>Recent test attempts and completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChartComponent data={dashboardData.testPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="avgScore" name="Average Score" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="completionRate" name="Completion Rate %" fill="#82ca9d" />
              </BarChartComponent>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your platform today.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderStatCard('Total Students', dashboardData.stats.totalStudents, <Users className="h-4 w-4 text-primary" />, 12.5)}
            {renderStatCard('Active Tests', dashboardData.stats.activeTests, <Clock className="h-4 w-4 text-primary" />, 5.2)}
            {renderStatCard('Total Content', dashboardData.stats.totalContent, <BookOpen className="h-4 w-4 text-primary" />, 8.1)}
            {renderStatCard('Avg. Test Score', `${dashboardData.stats.avgTestScore}%`, <BarChart className="h-4 w-4 text-primary" />, 3.7)}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboardData.recentActivity.map(renderActivityItem)}
                <Button variant="ghost" className="w-full mt-2">
                  View all activity
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Platform performance at a glance</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">New Students This Month</p>
                    <p className="text-sm text-muted-foreground">{dashboardData.stats.newStudentsThisMonth} signups</p>
                  </div>
                  <div className="ml-auto font-medium">+{Math.floor(dashboardData.stats.newStudentsThisMonth / 30)}/day</div>
                </div>
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Tests Completed</p>
                    <p className="text-sm text-muted-foreground">{dashboardData.stats.testsCompleted} this month</p>
                  </div>
                  <div className="ml-auto font-medium">+15%</div>
                </div>
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Active Users</p>
                    <p className="text-sm text-muted-foreground">Currently online: 42</p>
                  </div>
                  <div className="ml-auto">
                    <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
              <p className="text-muted-foreground">
                Detailed insights and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={timeRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
              <Button
                variant={timeRange === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('year')}
              >
                Year
              </Button>
            </div>
          </div>

          {renderCharts()}
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
            <p className="text-muted-foreground">
              Generate and download detailed reports
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ReportCard 
              title="Student Performance" 
              description="Detailed performance reports for all students"
              icon={<FileText className="h-6 w-6" />}
              onGenerate={() => generateReport('student-performance')}
            />
            <ReportCard 
              title="Test Analytics" 
              description="Comprehensive test statistics and analysis"
              icon={<BarChart className="h-6 w-6" />}
              onGenerate={() => generateReport('test-analytics')}
            />
            <ReportCard 
              title="Revenue Report" 
              description="Financial overview and transaction history"
              icon={<TrendingUp className="h-6 w-6" />}
              onGenerate={() => generateReport('revenue')}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom Report</CardTitle>
              <CardDescription>Generate a custom report with specific parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Report Type</label>
                    <select className="w-full p-2 border rounded">
                      <option>Student Progress</option>
                      <option>Test Performance</option>
                      <option>Revenue Analysis</option>
                      <option>Content Engagement</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date Range</label>
                    <select className="w-full p-2 border rounded">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>This Month</option>
                      <option>Last Month</option>
                      <option>Custom Range</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Format</label>
                    <select className="w-full p-2 border rounded">
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button>Generate Report</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportCard({ title, description, icon, onGenerate }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <div className="p-2 rounded-md bg-primary/10">
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button onClick={onGenerate} className="w-full">
          Generate Report
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper function to generate reports
async function generateReport(type) {
  // Implement report generation logic
  console.log(`Generating ${type} report...`);
  // This would typically call an API endpoint to generate and download the report
}
