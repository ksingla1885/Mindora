'use client';

import { Bar, Line, Pie, Radar, Scatter, Bubble } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { format, subDays, parseISO } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { exportToCSV, exportToPDF, prepareHeatmapData } from '@/lib/exportUtils';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip as TooltipComponent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// WebSocket hook for real-time updates
const useWebSocket = (url, onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = () => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        attemptReconnect();
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.current?.close();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      attemptReconnect();
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
      setTimeout(connect, reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  return { isConnected, sendMessage };
};

export function TestAnalytics({ testId, userId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const timeRanges = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    if (data.type === 'analytics_update') {
      setAnalytics(prev => ({
        ...prev,
        ...data.payload,
        updatedAt: new Date().toISOString()
      }));
      setLastUpdated(new Date());
      
      toast({
        title: 'Data updated',
        description: 'Analytics data has been updated with the latest information.',
        variant: 'default',
      });
    }
  };

  // Initialize WebSocket connection
  const { isConnected } = useWebSocket(
    `wss://your-websocket-server.com/analytics?testId=${testId}`, 
    handleWebSocketMessage
  );

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/analytics/test/${testId}?userId=${userId || ''}&timeRange=${timeRange}&type=${activeTab}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalytics(data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to load analytics data');
      
      toast({
        title: 'Error',
        description: 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Set up polling as fallback if WebSocket is not available
    const pollInterval = setInterval(() => {
      if (!isConnected) {
        fetchAnalytics();
      }
    }, 300000); // Poll every 5 minutes if WebSocket is not connected
    
    return () => clearInterval(pollInterval);
  }, [testId, userId, timeRange, activeTab, isConnected]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/analytics/export/test/${testId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-analytics-${testId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export analytics');
    } finally {
      setIsExporting(false);
    }
  };

  // Prepare heatmap data for visualization
  const prepareHeatmap = () => {
    if (!analytics?.questionAnalysis) return null;
    
    const data = analytics.questionAnalysis.map(q => ({
      question: `Q${q.questionNumber}`,
      difficulty: q.difficulty || 'MEDIUM',
      accuracy: q.correctPercentage,
      timeSpent: q.averageTimeSpent
    }));
    
    return prepareHeatmapData(data, 'difficulty', 'question', 'accuracy');
  };

  // Export data handlers
  const handleExportCSV = () => {
    if (!analytics) return;
    
    let exportData = [];
    
    switch (activeTab) {
      case 'overview':
        exportData = [{
          'Total Attempts': analytics.totalAttempts,
          'Average Score': analytics.averageScore,
          'Completion Rate': `${analytics.completionRate}%`,
          'Average Time Spent': `${analytics.averageTimeSpent}s`
        }];
        break;
        
      case 'questions':
        exportData = analytics.questionAnalysis?.map(q => ({
          'Question': `Q${q.questionNumber}`,
          'Difficulty': q.difficulty,
          'Accuracy': `${q.correctPercentage}%`,
          'Average Time': `${q.averageTimeSpent}s`,
          'Total Attempts': q.totalAttempts
        })) || [];
        break;
        
      case 'attempts':
        exportData = analytics.attemptsOverTime?.map(a => ({
          'Date': a.date,
          'Attempts': a.attempts,
          'Completed': a.completed,
          'Average Score': a.averageScore
        })) || [];
        break;
    }
    
    if (exportData.length > 0) {
      exportToCSV(exportData, `analytics_${activeTab}`);
    }
  };
  
  const handleExportPDF = () => {
    if (!analytics) return;
    
    let exportData = [];
    let columns = [];
    let title = '';
    
    switch (activeTab) {
      case 'overview':
        title = 'Test Analytics Overview';
        exportData = [{
          'Total Attempts': analytics.totalAttempts,
          'Average Score': analytics.averageScore,
          'Completion Rate': `${analytics.completionRate}%`,
          'Average Time Spent': `${analytics.averageTimeSpent}s`
        }];
        columns = [
          { key: 'Total Attempts', label: 'Total Attempts' },
          { key: 'Average Score', label: 'Average Score' },
          { key: 'Completion Rate', label: 'Completion Rate' },
          { key: 'Average Time Spent', label: 'Avg. Time Spent' }
        ];
        break;
        
      case 'questions':
        title = 'Question Analysis';
        exportData = analytics.questionAnalysis?.map(q => ({
          'Question': `Q${q.questionNumber}`,
          'Difficulty': q.difficulty,
          'Accuracy': `${q.correctPercentage}%`,
          'Average Time': `${q.averageTimeSpent}s`,
          'Total Attempts': q.totalAttempts
        })) || [];
        columns = [
          { key: 'Question', label: 'Question' },
          { key: 'Difficulty', label: 'Difficulty' },
          { key: 'Accuracy', label: 'Accuracy' },
          { key: 'Average Time', label: 'Avg. Time' },
          { key: 'Total Attempts', label: 'Attempts' }
        ];
        break;
        
      case 'attempts':
        title = 'Attempts Over Time';
        exportData = analytics.attemptsOverTime?.map(a => ({
          'Date': a.date,
          'Attempts': a.attempts,
          'Completed': a.completed,
          'Average Score': a.averageScore
        })) || [];
        columns = [
          { key: 'Date', label: 'Date' },
          { key: 'Attempts', label: 'Total Attempts' },
          { key: 'Completed', label: 'Completed' },
          { key: 'Average Score', label: 'Avg. Score' }
        ];
        break;
    }
    
    if (exportData.length > 0) {
      exportToPDF(title, exportData, columns, `analytics_${activeTab}`);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Analytics</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // Render empty state
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
        <p className="text-muted-foreground mb-4">
          There's no analytics data available for this test yet.
        </p>
      </div>
    );
  }

  // Process data for charts
  const processChartData = () => {
    const { scoreDistribution, questionStats = [], attemptsOverTime = [] } = analytics;

    // Score distribution chart
    const scoreDistributionData = {
      labels: scoreDistribution?.map((_, i) => `${i * 10}-${(i + 1) * 10}%`) || [],
      datasets: [
        {
          label: 'Number of Students',
          data: scoreDistribution?.map(s => s.count) || [],
          backgroundColor: 'rgba(79, 70, 229, 0.7)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        },
      ],
    };

    // Question performance chart
    const questionPerformanceData = {
      labels: questionStats.map((q, i) => `Q${i + 1}`),
      datasets: [
        {
          label: 'Correct Answers (%)',
          data: questionStats.map(q => q.correctPercentage),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
        {
          label: 'Average Time (sec)',
          data: questionStats.map(q => q.avgTimeSpent),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
          type: 'line',
          tension: 0.3,
        },
      ],
    };

    // Attempts over time chart
    const attemptsOverTimeData = {
      labels: attemptsOverTime.map(a => 
        format(new Date(a.timestamp), timeRange === '24h' ? 'HH:mm' : 'MMM d')
      ),
      datasets: [
        {
          label: 'Attempts',
          data: attemptsOverTime.map(a => a.attempts),
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Completed',
          data: attemptsOverTime.map(a => a.completed),
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
        },
      ],
    };

    // Difficulty analysis
    const difficultyData = {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [
        {
          label: 'Average Score',
          data: [
            questionStats.filter(q => q.difficulty === 'EASY').reduce((a, q) => a + q.correctPercentage, 0) / 
              Math.max(1, questionStats.filter(q => q.difficulty === 'EASY').length) || 0,
            questionStats.filter(q => q.difficulty === 'MEDIUM').reduce((a, q) => a + q.correctPercentage, 0) / 
              Math.max(1, questionStats.filter(q => q.difficulty === 'MEDIUM').length) || 0,
            questionStats.filter(q => q.difficulty === 'HARD').reduce((a, q) => a + q.correctPercentage, 0) / 
              Math.max(1, questionStats.filter(q => q.difficulty === 'HARD').length) || 0,
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    return {
      scoreDistributionData,
      questionPerformanceData,
      attemptsOverTimeData,
      difficultyData,
    };
  };

  const {
    scoreDistributionData,
    questionPerformanceData,
    attemptsOverTimeData,
    difficultyData,
  } = processChartData();

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        title: {
          display: true,
          text: 'Count',
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
          text: 'Time (seconds)',
        },
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)',
        },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  // Prepare chart data based on active tab
  const renderChart = () => {
    if (!analytics) return null;
    
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <Bar
                  data={{
                    labels: analytics.scoreDistribution?.map((_, i) => `${i * 10}-${(i + 1) * 10}%`) || [],
                    datasets: [
                      {
                        label: 'Number of Students',
                        data: analytics.scoreDistribution || [],
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Number of Students',
                        },
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Score Range',
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance by Difficulty</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <Radar
                  data={{
                    labels: analytics.difficultyAnalysis?.map(d => d.difficulty) || [],
                    datasets: [
                      {
                        label: 'Average Score',
                        data: analytics.difficultyAnalysis?.map(d => d.averageScore) || [],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        angleLines: {
                          display: true,
                        },
                        suggestedMin: 0,
                        suggestedMax: 100,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>
        );
        
      case 'questions':
        const heatmapData = prepareHeatmap();
        
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Performance Heatmap</CardTitle>
                <CardDescription>Darker colors indicate higher accuracy rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left">Question</th>
                          {heatmapData?.xValues.map((difficulty) => (
                            <th key={difficulty} className="px-4 py-2 text-center">
                              {difficulty}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData?.data.map((row) => (
                          <tr 
                            key={row.question}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => {
                              // Navigate to question detail view
                              console.log('View question:', row.question);
                            }}
                          >
                            <td className="px-4 py-2 font-medium">{row.question}</td>
                            {heatmapData.xValues.map((difficulty) => {
                              const value = row[difficulty] || 0;
                              const intensity = Math.min(100, Math.max(0, value)); // Ensure between 0-100
                              const bgColor = `hsl(${120 * (value / 100)}, 70%, 85%)`;
                              const textColor = value > 50 ? 'white' : 'gray.800';
                              
                              return (
                                <td 
                                  key={`${row.question}-${difficulty}`}
                                  className="px-4 py-2 text-center"
                                  style={{
                                    backgroundColor: bgColor,
                                    color: textColor,
                                    position: 'relative',
                                  }}
                                  title={`${value.toFixed(1)}% accuracy`}
                                >
                                  {value > 0 ? `${Math.round(value)}%` : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Time Spent vs Accuracy</CardTitle>
                <CardDescription>Each bubble represents a question</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <Scatter
                  data={{
                    datasets: [
                      {
                        label: 'Questions',
                        data: analytics.questionAnalysis?.map(q => ({
                          x: q.averageTimeSpent,
                          y: q.correctPercentage,
                          r: 10 + (q.attemptCount / Math.max(...analytics.questionAnalysis.map(qq => qq.attemptCount)) * 20)
                        })) || [],
                        backgroundColor: 'rgba(53, 162, 235, 0.5)',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Average Time Spent (seconds)',
                        },
                        beginAtZero: true,
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Accuracy (%)',
                        },
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const data = context.raw;
                            const question = analytics.questionAnalysis?.[context.dataIndex];
                            return [
                              `Question ${question?.questionNumber}`,
                              `Time: ${data.x.toFixed(1)}s`,
                              `Accuracy: ${data.y.toFixed(1)}%`,
                              `Attempts: ${question?.attemptCount || 0}`
                            ];
                          },
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>
        );
        
      case 'attempts':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attempts Over Time</CardTitle>
                <CardDescription>Number of test attempts and completion rate</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <Line
                  data={{
                    labels: analytics.attemptsOverTime?.map(a => a.date) || [],
                    datasets: [
                      {
                        label: 'Attempts',
                        data: analytics.attemptsOverTime?.map(a => a.attempts) || [],
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'y',
                      },
                      {
                        label: 'Completion Rate (%)',
                        data: analytics.attemptsOverTime?.map(a => 
                          a.attempts > 0 ? (a.completed / a.attempts) * 100 : 0
                        ) || [],
                        borderColor: 'rgb(236, 72, 153)',
                        backgroundColor: 'rgba(236, 72, 153, 0.2)',
                        tension: 0.3,
                        borderDash: [5, 5],
                        yAxisID: 'y1',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Date',
                        },
                      },
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Number of Attempts',
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
                          text: 'Completion Rate (%)',
                        },
                        min: 0,
                        max: 100,
                      },
                    },
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.parsed.y !== null) {
                              if (context.dataset.label.includes('%')) {
                                label += context.parsed.y.toFixed(1) + '%';
                              } else {
                                label += context.parsed.y;
                              }
                            }
                            return label;
                          }
                        }
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Average score and time spent over time</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <Line
                  data={{
                    labels: analytics.attemptsOverTime?.map(a => a.date) || [],
                    datasets: [
                      {
                        label: 'Average Score (%)',
                        data: analytics.attemptsOverTime?.map(a => a.averageScore * 100) || [],
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        tension: 0.3,
                        yAxisID: 'y',
                      },
                      {
                        label: 'Average Time Spent (seconds)',
                        data: analytics.attemptsOverTime?.map(a => a.averageTimeSpent) || [],
                        borderColor: 'rgb(245, 158, 11)',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        tension: 0.3,
                        borderDash: [5, 5],
                        yAxisID: 'y1',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      mode: 'index',
                      intersect: false,
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Date',
                        },
                      },
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Average Score (%)',
                        },
                        min: 0,
                        max: 100,
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
                          text: 'Time Spent (seconds)',
                        },
                        min: 0,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Test Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {format(lastUpdated, 'MMM d, yyyy h:mm a')}
            {isConnected && (
              <span className="inline-flex items-center ml-2 text-green-500">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Live
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
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
            
            <TooltipComponent>
              <TooltipComponent.Trigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={fetchAnalytics}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipComponent.Trigger>
              <TooltipComponent.Content>
                <p>Refresh data</p>
              </TooltipComponent.Content>
            </TooltipComponent>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TooltipComponent>
              <TooltipComponent.Trigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleExportCSV}
                  disabled={!analytics}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
              </TooltipComponent.Trigger>
              <TooltipComponent.Content>
                <p>Export as CSV</p>
              </TooltipComponent.Content>
            </TooltipComponent>
            
            <TooltipComponent>
              <TooltipComponent.Trigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleExportPDF}
                  disabled={!analytics}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </TooltipComponent.Trigger>
              <TooltipComponent.Content>
                <p>Export as PDF</p>
              </TooltipComponent.Content>
            </TooltipComponent>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">📊</span>
          </TabsTrigger>
          <TabsTrigger value="questions">
            <span className="hidden sm:inline">Questions</span>
            <span className="sm:hidden">❓</span>
          </TabsTrigger>
          <TabsTrigger value="attempts">
            <span className="hidden sm:inline">Attempts</span>
            <span className="sm:hidden">📈</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          {renderChart()}
        </TabsContent>
        
        <TabsContent value="questions" className="mt-4">
          {renderChart()}
        </TabsContent>
        
        <TabsContent value="attempts" className="mt-4">
          {renderChart()}
        </TabsContent>
      </Tabs>
      
      {/* Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {analytics.questions.map((question, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <h4 className="font-medium">Question {question.questionNumber}</h4>
                    <p className="text-sm text-muted-foreground">
                      Topic: {question.topic} • Difficulty: {question.difficulty}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={question.isCorrect ? 'text-green-600' : 'text-destructive'}>
                        {question.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      <span>Time: {question.timeSpent || 0}s</span>
                      <span>Avg. Score: {Math.round((question.averageScore || 0) * 100)}%</span>
                    </div>
                  </div>
                  <div className="w-24">
                    <Progress 
                      value={question.score * 100} 
                      className={`h-2 ${question.score > 0.7 ? 'bg-green-100' : question.score > 0.4 ? 'bg-yellow-100' : 'bg-red-100'}`} 
                    />
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {Math.round(question.score * 100)}%
                    </p>
                  </div>
                </div>
                {question.explanation && (
                  <div className="mt-3 p-3 bg-muted/20 rounded-md text-sm">
                    <p className="font-medium mb-1">Explanation:</p>
                    <p>{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
