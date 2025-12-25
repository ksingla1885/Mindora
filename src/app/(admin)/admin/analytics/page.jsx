'use client';

import { Calendar, Clock, Users, BookOpen, DollarSign, BarChart2, TrendingUp, ArrowUp, ArrowDown, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { EnrollmentChart } from '@/components/analytics/enrollment-chart';
import { DemographicsChart } from '@/components/analytics/demographics-chart';
import { PerformanceChart } from '@/components/analytics/performance-chart';
import { Skeleton } from '@/components/ui/skeleton';
import useAdminAnalytics from '@/hooks/useAdminAnalytics';
import { toast } from '@/components/ui/use-toast';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export default function AnalyticsDashboard() {
  const {
    loading,
    error,
    data,
    timeRange,
    setTimeRange,
    refreshData,
  } = useAdminAnalytics(30);
  
  const [activeTab, setActiveTab] = useState('overview');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Key metrics and insights about your platform</p>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-80" />
          <Skeleton className="col-span-3 h-80" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-80" />
          <Skeleton className="col-span-3 h-80" />
        </div>
      </div>
    );
  }

  const handleExport = () => {
    try {
      // Create a CSV string
      let csvContent = 'data:text/csv;charset=utf-8,';
      
      if (activeTab === 'overview') {
        // Export overview data
        csvContent += 'Metric,Value\n';
        csvContent += `Total Students,${data.stats?.totalStudents || 0}\n`;
        csvContent += `Active Students,${data.stats?.activeStudents || 0}\n`;
        csvContent += `Total Courses,${data.stats?.totalCourses || 0}\n`;
        csvContent += `Total Revenue,${data.stats?.totalRevenue || 0}\n`;
      } else if (activeTab === 'students') {
        // Export enrollment data
        csvContent += 'Date,Enrollments\n';
        data.formattedEnrollmentData.forEach(item => {
          csvContent += `${item.date},${item.count}\n`;
        });
      } else if (activeTab === 'revenue') {
        // Export revenue data
        csvContent += 'Date,Revenue\n';
        data.formattedRevenueData.forEach(item => {
          csvContent += `${item.date},${item.amount || 0}\n`;
        });
      } else if (activeTab === 'courses') {
        // Export course performance data
        csvContent += 'Course Title,Enrollments,Average Rating,Completion Rate\n';
        data.coursePerformance.forEach(course => {
          csvContent += `"${course.title}",${course.enrollments || 0},${course.averageRating?.toFixed(1) || 0},${course.completionRate?.toFixed(1) || 0}%\n`;
        });
      }
      
      // Create a download link and trigger it
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `analytics-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export Successful',
        description: 'Your data has been exported successfully.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const metrics = [
    {
      title: 'Total Students',
      value: formatNumber(data.stats?.totalStudents || 0),
      icon: Users,
      description: `${formatNumber(data.stats?.activeStudents || 0)} active`,
      change: data.stats?.studentGrowth || 0,
    },
    {
      title: 'Total Courses',
      value: formatNumber(data.stats?.totalCourses || 0),
      icon: BookOpen,
      description: 'Across all categories',
      change: 5.2, // This would come from API in a real app
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data.stats?.totalRevenue || 0),
      icon: DollarSign,
      description: 'All-time revenue',
      change: data.stats?.revenueGrowth || 0,
    },
    {
      title: 'Avg. Session',
      value: '12m 34s',
      icon: Clock,
      description: 'Average session duration',
      change: 2.1, // This would come from API in a real app
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your platform's performance and user engagement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10"
            onClick={refreshData}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <div className={`h-4 w-4 ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change >= 0 ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {metric.change && (
                      <span className={`inline-flex items-center ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
                        {metric.change >= 0 ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {metric.change}%
                      </span>
                    )}
                    <span className="ml-1">{metric.description}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Enrollment Trend</CardTitle>
                <CardDescription>
                  New student enrollments over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <EnrollmentChart data={data.formattedEnrollmentData} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Courses</CardTitle>
                <CardDescription>
                  Most popular courses by enrollment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topCourses.map((course) => (
                    <div key={course.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{course.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(course.enrollments || 0)} students • {formatCurrency(course.revenue || 0)}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(course.enrollments / data.topCourses[0].enrollments) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Student Demographics</CardTitle>
                <CardDescription>
                  Geographic distribution of students
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
                <DemographicsChart data={data.studentDemographics} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Age Groups</CardTitle>
                <CardDescription>
                  Distribution of students by age
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Age distribution chart</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics for all courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Course Completion Rate</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 relative">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeDasharray="75, 100"
                          strokeLinecap="round"
                        />
                        <text x="18" y="20.5" textAnchor="middle" className="text-sm font-bold fill-gray-900">75%</text>
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Completed: 75%</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-sm">In Progress: 15%</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-gray-200 mr-2"></div>
                        <span className="text-sm">Not Started: 10%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Assessment Performance</h3>
                  <PerformanceChart data={data} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">Average Time to Complete</p>
                    <p className="text-2xl font-bold text-blue-900">14.5 hrs</p>
                    <p className="text-xs text-blue-600">-2.3% from last month</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-800">Engagement Rate</p>
                    <p className="text-2xl font-bold text-green-900">68%</p>
                    <p className="text-xs text-green-600">+5.2% from last month</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-800">Satisfaction Score</p>
                    <p className="text-2xl font-bold text-purple-900">4.7/5.0</p>
                    <p className="text-xs text-purple-600">Based on 342 reviews</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Financial performance and revenue trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="h-[300px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">Revenue Overview</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500 mr-1"></div>
                        <span className="text-xs">This Year</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-gray-200 mr-1"></div>
                        <span className="text-xs">Last Year</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[250px] flex items-center justify-center bg-muted/5 rounded-md border border-dashed">
                    <div className="text-center p-6">
                      <DollarSign className="h-8 w-8 mx-auto text-green-500" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Revenue Trends</h3>
                      <p className="mt-1 text-sm text-gray-500">Monthly revenue comparison</p>
                      <p className="mt-4 text-2xl font-bold text-green-600">₹2,48,750</p>
                      <p className="text-sm text-green-500">+8.3% from last period</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Revenue by Course</h3>
                    <div className="space-y-3">
                      {metrics.topCourses.map((course, index) => (
                        <div key={course.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate max-w-[180px]">{course.title}</span>
                            <span className="font-medium">₹{course.revenue.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ 
                                width: `${(course.revenue / metrics.topCourses[0].revenue) * 100}%`,
                                backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'][index % 3]
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-2">Payment Methods</h3>
                    <div className="h-[180px] flex items-center justify-center">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <circle 
                            cx="18" 
                            cy="18" 
                            r="15.9" 
                            fill="none" 
                            stroke="#3b82f6" 
                            strokeWidth="3" 
                            strokeDasharray="60 100" 
                            strokeDashoffset="25" 
                          />
                          <circle 
                            cx="18" 
                            cy="18" 
                            r="15.9" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="3" 
                            strokeDasharray="30 100" 
                            strokeDashoffset="-30" 
                          />
                          <circle 
                            cx="18" 
                            cy="18" 
                            r="15.9" 
                            fill="none" 
                            stroke="#8b5cf6" 
                            strokeWidth="3" 
                            strokeDasharray="10 100" 
                            strokeDashoffset="-60" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold">100%</span>
                          <span className="text-xs text-gray-500">Payments</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>Credit/Debit Card</span>
                        </div>
                        <span className="font-medium">60%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                          <span>UPI</span>
                        </div>
                        <span className="font-medium">30%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                          <span>Net Banking</span>
                        </div>
                        <span className="font-medium">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
