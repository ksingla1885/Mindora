'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Download, BarChart3, LineChart as LineChartIcon, 
  Table, Filter, BookOpen, AlertCircle, Clock, 
  BarChart2, PieChart as PieChartIcon, Gauge, 
  TrendingUp, Users, Award, CheckCircle, XCircle, HelpCircle
} from 'lucide-react';
import { 
  format, subDays, subMonths, formatDistanceToNow, 
  parseISO, differenceInMinutes, differenceInSeconds 
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/components/ui/use-toast';

// Components
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Hooks
import useAnalyticsData from '@/hooks/useAnalyticsData';
import { testAnalyticsApi } from '@/services/api/analytics.service';

// Utils
import { DATE_RANGES } from '@/hooks/useAnalyticsData';
import { cn } from '@/lib/utils';

// Constants
const KNOWLEDGE_GAP_THRESHOLD = 0.7; // 70% incorrect answers indicates a knowledge gap

// Test data structure for TypeScript/IDE intellisense
const DEFAULT_TEST_DATA = {
  summary: {
    totalAttempts: 0,
    averageScore: 0,
    completionRate: 0,
    avgTimeSpent: '0:00',
    totalStudents: 0,
    totalTests: 0,
  },
  timeSeries: [],
  difficultyDistribution: [],
  questionAnalysis: [],
  studentPerformance: [],
  knowledgeGaps: [],
  testComparison: [],
};

export function TestAnalyticsDashboard() {
  const { toast } = useToast();
  const [dateRangeValue, setDateRangeValue] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedTest, setSelectedTest] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    status: 'all',
    minScore: '',
    maxScore: '',
    search: '',
    sortBy: 'name-asc',
    knowledgeGapThreshold: KNOWLEDGE_GAP_THRESHOLD,
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [tests, setTests] = useState([]);
  const [knowledgeGaps, setKnowledgeGaps] = useState([]);
  const [questionPerformance, setQuestionPerformance] = useState([]);
  const [timeSpentData, setTimeSpentData] = useState(null);
  const [comparativeData, setComparativeData] = useState(null);
  const [isLoadingKnowledgeGaps, setIsLoadingKnowledgeGaps] = useState(false);
  const [isLoadingQuestionPerformance, setIsLoadingQuestionPerformance] = useState(false);
  const [isLoadingTimeSpent, setIsLoadingTimeSpent] = useState(false);
  const [isLoadingComparative, setIsLoadingComparative] = useState(false);

  const {
    data: analyticsData = {},
    isLoading,
    error,
    dateRange,
    updateDateRange,
    formatTimeSeriesData,
    formatPieData,
    exportData,
  } = useAnalyticsData(timeRange, {
    start: dateRangeValue.from,
    end: dateRangeValue.to,
  });

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRangeValue({
      from: range.from,
      to: range.to || range.from,
    });
    updateDateRange('custom', range);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Fetch knowledge gaps
  const fetchKnowledgeGaps = useCallback(async () => {
    if (selectedTest === 'all') return;
    
    try {
      setIsLoadingKnowledgeGaps(true);
      const data = await testAnalyticsApi.getKnowledgeGaps(
        selectedTest,
        dateRangeValue.from,
        dateRangeValue.to,
        filters.knowledgeGapThreshold
      );
      setKnowledgeGaps(data);
    } catch (error) {
      console.error('Error fetching knowledge gaps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load knowledge gaps',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingKnowledgeGaps(false);
    }
  }, [selectedTest, dateRangeValue, filters.knowledgeGapThreshold, toast]);

  // Fetch question performance
  const fetchQuestionPerformance = useCallback(async () => {
    if (selectedTest === 'all') return;
    
    try {
      setIsLoadingQuestionPerformance(true);
      const data = await testAnalyticsApi.getQuestionPerformance(
        selectedTest,
        dateRangeValue.from,
        dateRangeValue.to
      );
      setQuestionPerformance(data);
    } catch (error) {
      console.error('Error fetching question performance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load question performance data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingQuestionPerformance(false);
    }
  }, [selectedTest, dateRangeValue, toast]);

  // Fetch time spent analysis
  const fetchTimeSpentAnalysis = useCallback(async () => {
    if (selectedTest === 'all') return;
    
    try {
      setIsLoadingTimeSpent(true);
      const data = await testAnalyticsApi.getTimeSpentAnalysis(
        selectedTest,
        dateRangeValue.from,
        dateRangeValue.to
      );
      setTimeSpentData(data);
    } catch (error) {
      console.error('Error fetching time spent analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to load time spent analysis',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTimeSpent(false);
    }
  }, [selectedTest, dateRangeValue, toast]);

  // Fetch comparative analysis
  const fetchComparativeAnalysis = useCallback(async () => {
    if (selectedTest === 'all') return;
    
    try {
      setIsLoadingComparative(true);
      const data = await testAnalyticsApi.getComparativeAnalysis(
        selectedTest,
        dateRangeValue.from,
        dateRangeValue.to,
        'previous_period' // or 'average', 'top_performers', etc.
      );
      setComparativeData(data);
    } catch (error) {
      console.error('Error fetching comparative analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comparative analysis',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingComparative(false);
    }
  }, [selectedTest, dateRangeValue, toast]);

  // Handle export
  const handleExport = async (format = 'csv', reportType = 'full') => {
    if (selectedTest === 'all') {
      toast({
        title: 'Select a test',
        description: 'Please select a specific test to export data',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsExporting(true);
      const blob = await testAnalyticsApi.exportTestAnalytics(
        selectedTest,
        format,
        dateRangeValue.from,
        dateRangeValue.to,
        reportType
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-analytics-${selectedTest}-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({
        title: 'Export successful',
        description: `Your ${reportType} report has been downloaded`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'knowledge-gaps') {
      fetchKnowledgeGaps();
    } else if (activeTab === 'questions') {
      fetchQuestionPerformance();
    } else if (activeTab === 'time-analysis') {
      fetchTimeSpentAnalysis();
    } else if (activeTab === 'comparative') {
      fetchComparativeAnalysis();
    }
  }, [
    activeTab, 
    fetchKnowledgeGaps, 
    fetchQuestionPerformance, 
    fetchTimeSpentAnalysis, 
    fetchComparativeAnalysis
  ]);

  // Format data for charts
  const timeSeriesData = formatTimeSeriesData(
    analyticsData.timeSeries || [],
    'date',
    ['attempts', 'completions', 'averageScore']
  );

  const difficultyData = formatPieData(
    analyticsData.difficultyDistribution || [],
    'difficulty',
    'count'
  );

  // Process knowledge gaps data
  const knowledgeGapData = useMemo(() => {
    if (!knowledgeGaps.length) return [];
    
    return knowledgeGaps.map(gap => ({
      ...gap,
      severity: gap.errorRate > 0.8 ? 'high' : gap.errorRate > 0.5 ? 'medium' : 'low',
    }));
  }, [knowledgeGaps]);

  // Process question performance data
  const questionPerformanceData = useMemo(() => {
    if (!questionPerformance.length) return [];
    
    return questionPerformance.map(q => ({
      ...q,
      accuracy: q.totalAttempts > 0 ? (q.correctAttempts / q.totalAttempts) * 100 : 0,
      avgTimeSpent: formatTimeSpent(q.avgTimeSpentMs),
    }));
  }, [questionPerformance]);

  // Format time spent
  const formatTimeSpent = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Summary cards data
  const summary = analyticsData.summary || {
    totalAttempts: 0,
    averageScore: 0,
    completionRate: 0,
    avgTimeSpent: '0:00',
    totalQuestions: 0,
    totalStudents: 0,
    highScore: 0,
    lowScore: 0,
  };

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
          <h3 className="font-medium">Error loading analytics data</h3>
          <p className="text-sm mt-1">{error.message}</p>
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Insights and metrics for test performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex gap-2">
            <Select
              value={timeRange}
              onValueChange={(value) => {
                setTimeRange(value);
                if (value !== 'custom') {
                  const range = DATE_RANGES[value].getRange();
                  setDateRangeValue({
                    from: range.start,
                    to: range.end,
                  });
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePickerWithRange
              value={dateRangeValue}
              onChange={handleDateRangeChange}
              className="w-[280px]"
              disabled={timeRange !== 'custom'}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({
                difficulty: 'all',
                status: 'all',
                minScore: '',
                maxScore: '',
              });
            }}
          >
            Reset
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={filters.difficulty}
              onValueChange={(value) => handleFilterChange('difficulty', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="minScore">Min Score</Label>
            <Input
              id="minScore"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={filters.minScore}
              onChange={(e) => handleFilterChange('minScore', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxScore">Max Score</Label>
            <Input
              id="maxScore"
              type="number"
              min="0"
              max="100"
              placeholder="100"
              value={filters.maxScore}
              onChange={(e) => handleFilterChange('maxScore', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAttempts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {summary.attemptsChange >= 0 ? '+' : ''}
              {summary.attemptsChange}% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <LineChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.scoreChange >= 0 ? '+' : ''}
              {summary.scoreChange}% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.completionChange >= 0 ? '+' : ''}
              {summary.completionChange}% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgTimeSpent}</div>
            <p className="text-xs text-muted-foreground">
              {summary.timeChange >= 0 ? '+' : ''}
              {summary.timeChange}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18M9 9v12" />
              </svg>
              Overview
            </span>
          </TabsTrigger>
          <TabsTrigger value="performance">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </span>
          </TabsTrigger>
          <TabsTrigger value="knowledge-gaps">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Knowledge Gaps
            </span>
          </TabsTrigger>
          <TabsTrigger value="questions">
            <span className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Question Analysis
            </span>
          </TabsTrigger>
          <TabsTrigger value="time-analysis">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Analysis
            </span>
          </TabsTrigger>
          <TabsTrigger value="comparative">
            <span className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Comparative Analysis
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalAttempts}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.attemptsChange >= 0 ? (
                    <span className="text-green-500">+{summary.attemptsChange}%</span>
                  ) : (
                    <span className="text-red-500">{summary.attemptsChange}%</span>
                  )}{' '}
                  from last period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.averageScore}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary.scoreChange >= 0 ? (
                    <span className="text-green-500">+{summary.scoreChange}%</span>
                  ) : (
                    <span className="text-red-500">{summary.scoreChange}%</span>
                  )}{' '}
                  from last period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.completionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {summary.completionChange >= 0 ? (
                    <span className="text-green-500">+{summary.completionChange}%</span>
                  ) : (
                    <span className="text-red-500">{summary.completionChange}%</span>
                  )}{' '}
                  from last period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.avgTimeSpent}</div>
                <p className="text-xs text-muted-foreground">
                  per test attempt
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Test Attempts</CardTitle>
                <CardDescription>Number of test attempts over time</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart data={timeSeriesData} series={['attempts']} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Score</CardTitle>
                <CardDescription>Average test score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <LineChart data={timeSeriesData} series={['averageScore']} formatValue={(v) => `${Math.round(v)}%`} />
              </CardContent>
            </Card>
          </div>
          
          {/* Additional metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Difficulty Distribution</CardTitle>
                <CardDescription>Breakdown of question difficulties</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChart data={difficultyData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Completion vs Score</CardTitle>
                <CardDescription>Relationship between completion rate and average score</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={timeSeriesData}
                  series={['completionRate', 'averageScore']}
                  formatValue={(v, series) => series === 'completionRate' ? `${v}%` : Math.round(v)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Knowledge Gaps Tab */}
        <TabsContent value="knowledge-gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Knowledge Gaps</CardTitle>
                  <CardDescription>Areas where students are struggling the most</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="knowledge-gap-threshold" className="text-sm">Threshold:</Label>
                    <Select
                      value={filters.knowledgeGapThreshold}
                      onValueChange={(value) => handleFilterChange('knowledgeGapThreshold', parseFloat(value))}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Threshold" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">50%+ Incorrect</SelectItem>
                        <SelectItem value="0.6">60%+ Incorrect</SelectItem>
                        <SelectItem value="0.7">70%+ Incorrect</SelectItem>
                        <SelectItem value="0.8">80%+ Incorrect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchKnowledgeGaps()}
                    disabled={isLoadingKnowledgeGaps}
                  >
                    {isLoadingKnowledgeGaps ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingKnowledgeGaps ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : knowledgeGapData.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-medium">By Topic</h3>
                      <div className="border rounded-lg">
                        <div className="grid grid-cols-3 bg-muted/50 p-2 font-medium">
                          <div>Topic</div>
                          <div className="text-center">Error Rate</div>
                          <div className="text-right">Students</div>
                        </div>
                        {knowledgeGapData
                          .sort((a, b) => b.errorRate - a.errorRate)
                          .slice(0, 5)
                          .map((gap) => (
                            <div key={gap.topic} className="grid grid-cols-3 p-2 border-t">
                              <div className="font-medium">{gap.topic}</div>
                              <div className="text-center">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  gap.errorRate > 0.8 ? "bg-red-100 text-red-800" :
                                  gap.errorRate > 0.6 ? "bg-amber-100 text-amber-800" :
                                  "bg-blue-100 text-blue-800"
                                )}>
                                  {Math.round(gap.errorRate * 100)}%
                                </span>
                              </div>
                              <div className="text-right">{gap.studentCount}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">By Question Type</h3>
                      <div className="border rounded-lg">
                        <div className="grid grid-cols-3 bg-muted/50 p-2 font-medium">
                          <div>Type</div>
                          <div className="text-center">Error Rate</div>
                          <div className="text-right">Count</div>
                        </div>
                        {knowledgeGapData
                          .reduce((acc, gap) => {
                            const existing = acc.find(g => g.type === gap.questionType);
                            if (existing) {
                              existing.errorRate = (existing.errorRate * existing.count + gap.errorRate) / (existing.count + 1);
                              existing.count++;
                            } else {
                              acc.push({
                                type: gap.questionType,
                                errorRate: gap.errorRate,
                                count: 1
                              });
                            }
                            return acc;
                          }, [])
                          .sort((a, b) => b.errorRate - a.errorRate)
                          .map((gap, i) => (
                            <div key={i} className="grid grid-cols-3 p-2 border-t">
                              <div className="font-medium">{gap.type}</div>
                              <div className="text-center">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  gap.errorRate > 0.8 ? "bg-red-100 text-red-800" :
                                  gap.errorRate > 0.6 ? "bg-amber-100 text-amber-800" :
                                  "bg-blue-100 text-blue-800"
                                )}>
                                  {Math.round(gap.errorRate * 100)}%
                                </span>
                              </div>
                              <div className="text-right">{gap.count}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Detailed Breakdown</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 bg-muted/50 p-2 font-medium">
                        <div className="col-span-4">Question</div>
                        <div className="col-span-2 text-center">Topic</div>
                        <div className="col-span-2 text-center">Type</div>
                        <div className="col-span-1 text-center">Error Rate</div>
                        <div className="col-span-1 text-center">Students</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {knowledgeGapData
                        .sort((a, b) => b.errorRate - a.errorRate)
                        .map((gap) => (
                          <div key={gap.questionId} className="grid grid-cols-12 p-2 border-t hover:bg-muted/50">
                            <div className="col-span-4 truncate">{gap.questionText}</div>
                            <div className="col-span-2 text-center text-sm text-muted-foreground">{gap.topic}</div>
                            <div className="col-span-2 text-center text-sm text-muted-foreground">{gap.questionType}</div>
                            <div className="col-span-1 text-center">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                gap.errorRate > 0.8 ? "bg-red-100 text-red-800" :
                                gap.errorRate > 0.6 ? "bg-amber-100 text-amber-800" :
                                "bg-blue-100 text-blue-800"
                              )}>
                                {Math.round(gap.errorRate * 100)}%
                              </span>
                            </div>
                            <div className="col-span-1 text-center text-sm">{gap.studentCount}</div>
                            <div className="col-span-2 text-right">
                              <Button variant="ghost" size="sm" className="h-8">
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No knowledge gaps found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting the threshold or select a different date range.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {knowledgeGapData.length} knowledge gaps
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('csv', 'knowledge-gaps')}
                disabled={isExporting || knowledgeGapData.length === 0}
              >
                {isExporting ? 'Exporting...' : 'Export as CSV'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Question Analysis Tab */}
        <TabsContent value="questions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Question Analysis</CardTitle>
                  <CardDescription>Detailed performance metrics for each question</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchQuestionPerformance()}
                  disabled={isLoadingQuestionPerformance}
                >
                  {isLoadingQuestionPerformance ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingQuestionPerformance ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : questionPerformanceData.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium text-muted-foreground">Average Accuracy</div>
                      <div className="text-2xl font-bold mt-1">
                        {Math.round(questionPerformanceData.reduce((sum, q) => sum + q.accuracy, 0) / questionPerformanceData.length)}%
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium text-muted-foreground">Average Time Spent</div>
                      <div className="text-2xl font-bold mt-1">
                        {formatTimeSpent(
                          questionPerformanceData.reduce((sum, q) => {
                            const timeMs = typeof q.avgTimeSpentMs === 'number' ? q.avgTimeSpentMs : 0;
                            return sum + (isNaN(timeMs) ? 0 : timeMs);
                          }, 0) / questionPerformanceData.length
                        )}
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium text-muted-foreground">Questions with &lt;50% Accuracy</div>
                      <div className="text-2xl font-bold mt-1">
                        {questionPerformanceData.filter(q => q.accuracy < 50).length}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          of {questionPerformanceData.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Questions by Performance</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 bg-muted/50 p-2 font-medium">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Question</div>
                        <div className="col-span-1 text-center">Type</div>
                        <div className="col-span-1 text-center">Difficulty</div>
                        <div className="col-span-1 text-center">Accuracy</div>
                        <div className="col-span-1 text-center">Time</div>
                        <div className="col-span-1 text-center">Attempts</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {questionPerformanceData
                        .sort((a, b) => a.questionNumber - b.questionNumber)
                        .map((q) => (
                          <div key={q.questionId} className="grid grid-cols-12 p-2 border-t hover:bg-muted/50">
                            <div className="col-span-1 font-medium">{q.questionNumber}</div>
                            <div className="col-span-5 truncate">{q.questionText}</div>
                            <div className="col-span-1 text-center text-sm text-muted-foreground">{q.questionType}</div>
                            <div className="col-span-1 text-center">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                q.difficulty === 'hard' ? "bg-red-100 text-red-800" :
                                q.difficulty === 'medium' ? "bg-amber-100 text-amber-800" :
                                "bg-green-100 text-green-800"
                              )}>
                                {q.difficulty}
                              </span>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className={cn(
                                "font-medium",
                                q.accuracy < 50 ? "text-red-600" :
                                q.accuracy < 70 ? "text-amber-600" :
                                "text-green-600"
                              )}>
                                {Math.round(q.accuracy)}%
                              </span>
                            </div>
                            <div className="col-span-1 text-center text-sm">{q.avgTimeSpent}</div>
                            <div className="col-span-1 text-center text-sm">{q.totalAttempts}</div>
                            <div className="col-span-2 text-right">
                              <Button variant="ghost" size="sm" className="h-8">
                                Details
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-medium">Accuracy by Question Type</h3>
                      <div className="border rounded-lg p-4">
                        <BarChart 
                          data={questionPerformanceData.reduce((acc, q) => {
                            const existing = acc.find(item => item.type === q.questionType);
                            if (existing) {
                              existing.accuracy = (existing.accuracy * existing.count + q.accuracy) / (existing.count + 1);
                              existing.count++;
                            } else {
                              acc.push({
                                type: q.questionType,
                                accuracy: q.accuracy,
                                count: 1
                              });
                            }
                            return acc;
                          }, [])}
                          xField="type"
                          yField="accuracy"
                          formatY={(v) => `${Math.round(v)}%`}
                          height={300}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Time Spent by Difficulty</h3>
                      <div className="border rounded-lg p-4">
                        <BarChart 
                          data={questionPerformanceData.reduce((acc, q) => {
                            const existing = acc.find(item => item.difficulty === q.difficulty);
                            const timeMs = typeof q.avgTimeSpentMs === 'number' ? q.avgTimeSpentMs : 0;
                            if (existing) {
                              existing.time = (existing.time * existing.count + timeMs) / (existing.count + 1);
                              existing.count++;
                            } else {
                              acc.push({
                                difficulty: q.difficulty,
                                time: timeMs,
                                count: 1
                              });
                            }
                            return acc;
                          }, [])}
                          xField="difficulty"
                          yField="time"
                          formatY={(v) => formatTimeSpent(v)}
                          height={300}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No question data available</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try selecting a different test or date range.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {questionPerformanceData.length} questions
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('csv', 'question-analysis')}
                disabled={isExporting || questionPerformanceData.length === 0}
              >
                {isExporting ? 'Exporting...' : 'Export as CSV'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Time Analysis Tab */}
        <TabsContent value="time-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Time Spent Analysis</CardTitle>
                  <CardDescription>How students are spending their time on tests</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchTimeSpentAnalysis()}
                  disabled={isLoadingTimeSpent}
                >
                  {isLoadingTimeSpent ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTimeSpent ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : timeSpentData ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium text-muted-foreground">Avg. Test Duration</div>
                      <div className="text-2xl font-bold mt-1">
                        {formatTimeSpent(timeSpentData.averageTestDurationMs)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {timeSpentData.averageTestDurationChange >= 0 ? (
                          <span className="text-red-500">+{timeSpentData.averageTestDurationChange}%</span>
                        ) : (
                          <span className="text-green-500">{timeSpentData.averageTestDurationChange}%</span>
                        )}{' '}
                        from last period
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium text-muted-foreground">Avg. Time per Question</div>
                      <div className="text-2xl font-bold mt-1">
                        {formatTimeSpent(timeSpentData.averageTimePerQuestionMs)}
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm font-medium text-muted-foreground">Students Rushing</div>
                      <div className="text-2xl font-bold mt-1">
                        {timeSpentData.rushingStudents.count}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          ({timeSpentData.rushingStudents.percentage}%)
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Spent less than {formatTimeSpent(timeSpentData.rushingStudents.thresholdMs)} per question
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-medium">Time Distribution</h3>
                      <div className="border rounded-lg p-4">
                        <BarChart 
                          data={timeSpentData.timeDistribution}
                          xField="timeRange"
                          yField="count"
                          formatY={(v) => `${v} students`}
                          height={300}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Time vs. Score</h3>
                      <div className="border rounded-lg p-4">
                        <ScatterChart 
                          data={timeSpentData.timeVsScore}
                          xField="timeSpent"
                          yField="score"
                          xLabel="Time Spent (minutes)"
                          yLabel="Score (%)"
                          height={300}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Questions Taking the Most Time</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 bg-muted/50 p-2 font-medium">
                        <div className="col-span-1">#</div>
                        <div className="col-span-6">Question</div>
                        <div className="col-span-1 text-center">Avg. Time</div>
                        <div className="col-span-1 text-center">% of Total</div>
                        <div className="col-span-1 text-center">Accuracy</div>
                        <div className="col-span-1 text-center">Attempts</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {timeSpentData.slowestQuestions.map((q) => (
                        <div key={q.questionId} className="grid grid-cols-12 p-2 border-t hover:bg-muted/50">
                          <div className="col-span-1 font-medium">{q.questionNumber}</div>
                          <div className="col-span-6 truncate">{q.questionText}</div>
                          <div className="col-span-1 text-center">{formatTimeSpent(q.averageTimeSpentMs)}</div>
                          <div className="col-span-1 text-center">{q.percentageOfTotalTime}%</div>
                          <div className="col-span-1 text-center">
                            <span className={cn(
                              "font-medium",
                              q.accuracy < 50 ? "text-red-600" :
                              q.accuracy < 70 ? "text-amber-600" :
                              "text-green-600"
                            )}>
                              {Math.round(q.accuracy)}%
                            </span>
                          </div>
                          <div className="col-span-1 text-center text-sm">{q.totalAttempts}</div>
                          <div className="col-span-2 text-right">
                            <Button variant="ghost" size="sm" className="h-8">
                              Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No time analysis data available</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try selecting a different test or date range.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {timeSpentData ? `Analyzed ${timeSpentData.totalAttempts} test attempts` : 'No data available'}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('csv', 'time-analysis')}
                disabled={isExporting || !timeSpentData}
              >
                {isExporting ? 'Exporting...' : 'Export as CSV'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Comparative Analysis Tab */}
        <TabsContent value="comparative" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Comparative Analysis</CardTitle>
                  <CardDescription>Compare performance across different segments</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={filters.comparisonType}
                    onValueChange={(value) => handleFilterChange('comparisonType', value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Compare by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="previous_period">Previous Period</SelectItem>
                      <SelectItem value="average">Class Average</SelectItem>
                      <SelectItem value="top_performers">Top Performers</SelectItem>
                      <SelectItem value="demographics">Demographics</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchComparativeAnalysis()}
                    disabled={isLoadingComparative}
                  >
                    {isLoadingComparative ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingComparative ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : comparativeData ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-medium">Score Distribution</h3>
                      <div className="border rounded-lg p-4">
                        <BarChart 
                          data={comparativeData.scoreDistribution}
                          series={['current', 'comparison']}
                          xField="scoreRange"
                          formatValue={(v, series) => `${v}%`}
                          height={300}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium">Performance by Segment</h3>
                      <div className="border rounded-lg p-4">
                        <BarChart 
                          data={comparativeData.performanceBySegment}
                          xField="segment"
                          yField="averageScore"
                          formatY={(v) => `${Math.round(v)}%`}
                          height={300}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Key Metrics Comparison</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 bg-muted/50 p-2 font-medium">
                        <div>Metric</div>
                        <div className="text-center">Current</div>
                        <div className="text-center">Comparison</div>
                        <div className="text-right">Difference</div>
                      </div>
                      {Object.entries(comparativeData.metrics).map(([metric, data]) => (
                        <div key={metric} className="grid grid-cols-4 p-2 border-t">
                          <div className="font-medium">
                            {metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </div>
                          <div className="text-center">
                            {typeof data.current === 'number' 
                              ? metric.includes('percentage') || metric.includes('rate')
                                ? `${Math.round(data.current)}%`
                                : data.current.toFixed(1)
                              : data.current}
                          </div>
                          <div className="text-center">
                            {typeof data.comparison === 'number' 
                              ? metric.includes('percentage') || metric.includes('rate')
                                ? `${Math.round(data.comparison)}%`
                                : data.comparison.toFixed(1)
                              : data.comparison}
                          </div>
                          <div className={cn(
                            "text-right font-medium",
                            data.difference > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {data.difference > 0 ? '+' : ''}{data.difference}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Question Performance Comparison</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-12 bg-muted/50 p-2 font-medium">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Question</div>
                        <div className="col-span-2 text-center">Current Accuracy</div>
                        <div className="col-span-2 text-center">Comparison</div>
                        <div className="col-span-2 text-right">Difference</div>
                      </div>
                      {comparativeData.questionComparison
                        .sort((a, b) => a.questionNumber - b.questionNumber)
                        .map((q) => (
                          <div key={q.questionId} className="grid grid-cols-12 p-2 border-t hover:bg-muted/50">
                            <div className="col-span-1 font-medium">{q.questionNumber}</div>
                            <div className="col-span-5 truncate">{q.questionText}</div>
                            <div className="col-span-2 text-center">
                              <span className={cn(
                                "font-medium",
                                q.currentAccuracy < 50 ? "text-red-600" :
                                q.currentAccuracy < 70 ? "text-amber-600" :
                                "text-green-600"
                              )}>
                                {Math.round(q.currentAccuracy)}%
                              </span>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="text-muted-foreground">
                                {Math.round(q.comparisonAccuracy)}%
                              </span>
                            </div>
                            <div className={cn(
                              "col-span-2 text-right font-medium",
                              q.difference > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {q.difference > 0 ? '+' : ''}{q.difference}%
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No comparative data available</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try selecting a different comparison type or date range.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {comparativeData ? `Comparing with ${comparativeData.comparisonLabel}` : 'No data available'}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('csv', 'comparative-analysis')}
                disabled={isExporting || !comparativeData}
              >
                {isExporting ? 'Exporting...' : 'Export as CSV'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Individual student performance metrics
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b">
                      <th className="text-left p-4">Student</th>
                      <th className="text-right p-4">Score</th>
                      <th className="text-right p-4">Time Spent</th>
                      <th className="text-right p-4">Attempts</th>
                      <th className="text-right p-4">Last Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-4">Student {i}</td>
                        <td className="text-right p-4">
                          <div className="flex items-center justify-end">
                            <span className="w-16 text-right">85%</span>
                            <div className="ml-2 h-2 w-20 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: '85%' }} />
                            </div>
                          </div>
                        </td>
                        <td className="text-right p-4">32:45</td>
                        <td className="text-right p-4">3</td>
                        <td className="text-right p-4">{format(subDays(new Date(), i), 'MMM d, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                Compare performance across different tests or time periods
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[500px]">
                <div className="flex items-center justify-center h-full bg-muted/50 rounded-md">
                  <p className="text-muted-foreground">Comparison charts will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Data Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>Data updated {formatDistanceToNow(new Date(), { addSuffix: true })}</span>
          </div>
          <button 
            className="hover:underline"
            onClick={() => fetchAnalyticsData()}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>Time range: {DATE_RANGES[dateRange]?.label || 'Custom Range'}</span>
          {dateRangeValue?.start && dateRangeValue?.end && (
            <span>
              {format(dateRangeValue.start, 'MMM d, yyyy')} - {format(dateRangeValue.end, 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestAnalyticsDashboard;
