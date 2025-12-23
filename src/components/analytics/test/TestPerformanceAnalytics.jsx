'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  CardFooter, CardTooltip
} from '@/components/ui/card';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, LineChart, PieChart, ScatterChart, Scatter,
  Bar, Line, Pie, XAxis, YAxis, CartesianGrid, ZAxis,
  Tooltip, Legend, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { 
  BookOpen, CheckCircle, Clock, AlertCircle, 
  TrendingUp, Users, Award, Download, Filter, 
  BarChart2, Loader2, AlertCircle as AlertIcon, 
  HelpCircle, BarChart3, LineChart as LineChartIcon,
  PieChart as PieChartIcon, Table as TableIcon, Bookmark, RefreshCw
} from 'lucide-react';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Import analytics services
import { testAnalyticsApi } from '@/services/api/analytics.service';

// Chart color schemes
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gray: '#9ca3af',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6',  
};

// Formatting utilities
const formatNumber = (num, decimals = 0) => {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const formatPercentage = (value, decimals = 1) => {
  if (typeof value !== 'number') return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

const formatTime = (milliseconds) => {
  if (!milliseconds) return '0s';
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  
  return parts.join(' ');
};

// Default date range (last 30 days)
const defaultDateRange = {
  from: subDays(new Date(), 30),
  to: new Date(),
};

export default function TestPerformanceAnalytics() {
  // UI State
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data State
  const [analyticsData, setAnalyticsData] = useState({
    summary: null,
    completionRates: null,
    difficultyAnalysis: null,
    knowledgeGaps: null,
    questionPerformance: null,
    timeSpent: null
  });

  // Filters
  const [filters, setFilters] = useState({
    testType: 'all',
    difficulty: 'all',
    topic: 'all',
    groupBy: 'day',
  });

  // Fetch all analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [
          summary,
          completionRates,
          difficultyAnalysis,
          knowledgeGaps,
          questionPerformance,
          timeSpent
        ] = await Promise.all([
          testAnalyticsApi.getTestAnalytics('overview', dateRange.from, dateRange.to),
          testAnalyticsApi.getCompletionRates(filters.testType === 'all' ? null : filters.testType, dateRange.from, dateRange.to, filters.groupBy),
          testAnalyticsApi.getDifficultyAnalysis(filters.testType === 'all' ? null : filters.testType, dateRange.from, dateRange.to),
          testAnalyticsApi.getKnowledgeGaps(filters.testType === 'all' ? null : filters.testType, dateRange.from, dateRange.to, 0.5),
          testAnalyticsApi.getQuestionPerformance(filters.testType === 'all' ? null : filters.testType, dateRange.from, dateRange.to, {
            difficulty: filters.difficulty === 'all' ? null : filters.difficulty,
            topic: filters.topic === 'all' ? null : filters.topic
          }),
          testAnalyticsApi.getTimeSpentAnalysis(filters.testType === 'all' ? null : filters.testType, dateRange.from, dateRange.to)
        ]);

        setAnalyticsData({
          summary,
          completionRates,
          difficultyAnalysis,
          knowledgeGaps,
          questionPerformance,
          timeSpent
        });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange({
      from: range.from || defaultDateRange.from,
      to: range.to || defaultDateRange.to
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Test Performance Analytics</h2>
            <p className="text-muted-foreground">
              {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-3/4 mt-2" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-[400px]">
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[calc(100%-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to load analytics</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with title and controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Test Performance Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={handleDateRangeChange}
            className="w-full sm:w-auto"
          />
          <Select
            value={filters.testType}
            onValueChange={(value) => handleFilterChange('testType', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Test Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Test Types</SelectItem>
              <SelectItem value="quiz">Quizzes</SelectItem>
              <SelectItem value="exam">Exams</SelectItem>
              <SelectItem value="practice">Practice Tests</SelectItem>
              <SelectItem value="assessment">Assessments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.summary?.totalAttempts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary?.newTestTakers || 0} new test takers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analyticsData.completionRates?.overallRate || 0, 1)}
            </div>
            <div className="mt-2">
              <Progress 
                value={analyticsData.completionRates?.overallRate || 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.summary?.averageScore || 0, 1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary?.abovePassing || 0}% above passing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.timeSpent?.averageTimeSpent || '0:00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Fastest: {analyticsData.timeSpent?.fastestTime || '0:00'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart2 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="completion">
            <CheckCircle className="mr-2 h-4 w-4" />
            Completion Rates
          </TabsTrigger>
          <TabsTrigger value="difficulty">
            <Award className="mr-2 h-4 w-4" />
            Difficulty Analysis
          </TabsTrigger>
          <TabsTrigger value="knowledge-gaps">
            <AlertCircle className="mr-2 h-4 w-4" />
            Knowledge Gaps
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>
                  Average score and completion rate over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analyticsData.summary?.trends || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke={CHART_COLORS.primary} />
                    <YAxis yAxisId="right" orientation="right" stroke={CHART_COLORS.success} />
                    <Tooltip 
                      labelFormatter={(date) => format(parseISO(date), 'MMMM d, yyyy')}
                      formatter={(value, name) => 
                        name === 'score' ? [`${value}%`, 'Average Score'] : [`${value}%`, 'Completion Rate']
                      }
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="score"
                      name="Average Score"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="completionRate"
                      name="Completion Rate"
                      stroke={CHART_COLORS.success}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance by Test Type</CardTitle>
                <CardDescription>Average scores across different test types</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.summary?.performanceByType || []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis 
                      dataKey="type" 
                      type="category" 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Average Score']}
                    />
                    <Bar 
                      dataKey="averageScore" 
                      name="Average Score"
                      fill={CHART_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList 
                        dataKey="averageScore" 
                        position="right" 
                        formatter={(value) => `${value}%`}
                        style={{ fill: CHART_COLORS.primary, fontSize: 12 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Questions</CardTitle>
              <CardDescription>
                Questions with the highest and lowest success rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-4">Top 5 Questions</h4>
                  <div className="space-y-4">
                    {analyticsData.questionPerformance
                      ?.sort((a, b) => b.correctPercentage - a.correctPercentage)
                      .slice(0, 5)
                      .map((question, i) => (
                        <div key={`top-${i}`} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Q{question.id}: {question.text.substring(0, 40)}...
                            </span>
                            <span className="text-sm font-medium text-green-600">
                              {Math.round(question.correctPercentage)}%
                            </span>
                          </div>
                          <Progress 
                            value={question.correctPercentage} 
                            className="h-2"
                            indicatorClassName="bg-green-500"
                          />
                        </div>
                      ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-4">Needs Improvement</h4>
                  <div className="space-y-4">
                    {analyticsData.questionPerformance
                      ?.sort((a, b) => a.correctPercentage - b.correctPercentage)
                      .slice(0, 5)
                      .map((question, i) => (
                        <div key={`bottom-${i}`} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Q{question.id}: {question.text.substring(0, 40)}...
                            </span>
                            <span className="text-sm font-medium text-red-600">
                              {Math.round(question.correctPercentage)}%
                            </span>
                          </div>
                          <Progress 
                            value={question.correctPercentage} 
                            className="h-2"
                            indicatorClassName="bg-red-500"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completion Rates Tab */}
        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Rates Over Time</CardTitle>
              <CardDescription>
                Track how completion rates have changed over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analyticsData.completionRates?.trends || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    labelFormatter={(date) => format(parseISO(date), 'MMMM d, yyyy')}
                    formatter={(value) => [`${value}%`, 'Completion Rate']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    name="Completion Rate"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Completion by Test Type</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.completionRates?.byType || []}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      dataKey="type" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Completion Rate']}
                    />
                    <Bar 
                      dataKey="completionRate" 
                      name="Completion Rate"
                      fill={CHART_COLORS.primary}
                      radius={[0, 4, 4, 0]}
                    >
                      <LabelList 
                        dataKey="completionRate" 
                        position="right" 
                        formatter={(value) => `${Math.round(value)}%`}
                        style={{ fill: CHART_COLORS.primary, fontSize: 12 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Completion by User Segment</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.completionRates?.bySegment || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="segment"
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {(analyticsData.completionRates?.bySegment || []).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} users`, 
                        props.payload.segment
                      ]} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Difficulty Analysis Tab */}
        <TabsContent value="difficulty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Question Difficulty Analysis</CardTitle>
              <CardDescription>
                Distribution of questions by difficulty level and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-4">Difficulty Distribution</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.difficultyAnalysis?.distribution || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="difficulty"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {(analyticsData.difficultyAnalysis?.distribution || []).map((entry, index) => (
                            <Cell 
                              key={`cell-diff-${index}`} 
                              fill={Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} questions`, 
                            props.payload.difficulty
                          ]} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-4">Performance by Difficulty</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsData.difficultyAnalysis?.performance || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="difficulty" />
                        <YAxis 
                          yAxisId="left" 
                          orientation="left" 
                          stroke={CHART_COLORS.primary}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke={CHART_COLORS.success}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'correctPercentage' ? `${value}%` : value, 
                            name === 'correctPercentage' ? 'Correct Answers' : 'Avg. Time (s)'
                          ]}
                        />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="correctPercentage" 
                          name="Correct Answers"
                          fill={CHART_COLORS.primary}
                        />
                        <Bar 
                          yAxisId="right"
                          dataKey="avgTimeSpent" 
                          name="Avg. Time (s)"
                          fill={CHART_COLORS.success}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">Question Performance Matrix</h4>
                  <div className="flex items-center space-x-4">
                    <Select
                      value={filters.difficulty}
                      onValueChange={(value) => handleFilterChange('difficulty', value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Difficulties</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filters.topic}
                      onValueChange={(value) => handleFilterChange('topic', value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {Array.from(new Set(analyticsData.questionPerformance?.map(q => q.topic) || [])).map(topic => (
                          <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Question</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Correct %</TableHead>
                        <TableHead>Avg. Time</TableHead>
                        <TableHead>Attempts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.questionPerformance?.map((question, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            <div className="line-clamp-1 max-w-[300px]">
                              Q{question.id}: {question.text}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                question.difficulty === 'easy' ? 'bg-green-50 text-green-700 border-green-200' :
                                question.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{question.topic}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{Math.round(question.correctPercentage)}%</span>
                              <Progress 
                                value={question.correctPercentage} 
                                className="h-2 w-20"
                                indicatorClassName={
                                  question.correctPercentage >= 70 ? 'bg-green-500' :
                                  question.correctPercentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell>{formatTime(question.avgTimeSpent * 1000)}</TableCell>
                          <TableCell>{question.attempts}</TableCell>
                        </TableRow>
                      ))}
                      
                      {(!analyticsData.questionPerformance || analyticsData.questionPerformance.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No question performance data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Gaps Tab */}
        <TabsContent value="knowledge-gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Gap Analysis</CardTitle>
              <CardDescription>
                Identify topics and concepts where learners are struggling the most
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium mb-4">Top Knowledge Gaps</h4>
                    <div className="space-y-4">
                      {analyticsData.knowledgeGaps?.slice(0, 5).map((gap, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{gap.topic}</span>
                            <span className="text-sm font-medium text-red-600">
                              {Math.round(gap.errorRate * 100)}% error rate
                            </span>
                          </div>
                          <Progress 
                            value={gap.errorRate * 100} 
                            className="h-2"
                            indicatorClassName="bg-red-500"
                          />
                          <p className="text-xs text-muted-foreground">
                            Affects {gap.affectedStudents} students • {gap.relatedQuestions} questions
                          </p>
                        </div>
                      ))}
                      
                      {(!analyticsData.knowledgeGaps || analyticsData.knowledgeGaps.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          No knowledge gap data available
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-4">Knowledge Gap by Topic</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.knowledgeGaps?.slice(0, 8) || []}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            type="number" 
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <YAxis 
                            dataKey="topic" 
                            type="category" 
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${Math.round(value)}%`, 
                              'Error Rate',
                              `Affects ${props.payload.affectedStudents} students`
                            ]}
                          />
                          <Bar 
                            dataKey={row => row.errorRate * 100} 
                            name="Error Rate"
                            fill="#f87171"
                            radius={[0, 4, 4, 0]}
                          >
                            {(analyticsData.knowledgeGaps?.slice(0, 8) || []).map((entry, index) => (
                              <Cell 
                                key={`cell-gap-${index}`} 
                                fill={Object.values(CHART_COLORS)[index % Object.keys(CHART_COLORS).length]} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-4">Related Learning Resources</h4>
                  <div className="space-y-2">
                    {analyticsData.knowledgeGaps?.slice(0, 3).map((gap, i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{gap.topic}</h4>
                              <p className="text-sm text-muted-foreground">
                                {gap.relatedConcepts?.join(', ')}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                              {Math.round(gap.errorRate * 100)}% error rate
                            </span>
                          </div>
                          
                          <div className="mt-3 space-y-2">
                            <h5 className="text-xs font-medium text-muted-foreground">Recommended Resources:</h5>
                            <div className="grid gap-2 md:grid-cols-3">
                              {gap.recommendedResources?.slice(0, 3).map((resource, j) => (
                                <a 
                                  key={j} 
                                  href={resource.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block p-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                                >
                                  <div className="font-medium">{resource.title}</div>
                                  <div className="text-xs text-muted-foreground">{resource.type}</div>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                    {(!analyticsData.knowledgeGaps || analyticsData.knowledgeGaps.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        No recommended learning resources available
                      </div>
                    )}
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