'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  Pie,
  Cell
} from 'recharts';

export default function DPPAnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dpp/analytics');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (loading) {
    return <DPPAnalyticsSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const { accuracy, totalAttempts, correctAttempts, currentStreak, maxStreak, subjectBreakdown, topicPerformance } = data;

  const subjectData = subjectBreakdown.map(subject => ({
    name: subject.name,
    accuracy: subject.accuracy,
    attempts: subject.totalAttempts
  }));

  const weeklyData = data.weeklyProgress?.map(week => ({
    name: `Week ${week.weekNumber}`,
    accuracy: week.accuracy,
    questions: week.totalAttempts,
    activeDays: week.daysActive
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Attempts" 
          value={totalAttempts} 
          icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
          description="Total questions attempted"
        />
        <StatCard 
          title="Accuracy" 
          value={`${Math.round(accuracy)}%`} 
          icon={<LineChart className="h-4 w-4 text-muted-foreground" />}
          description={`${correctAttempts} correct out of ${totalAttempts}`}
        />
        <StatCard 
          title="Current Streak" 
          value={currentStreak} 
          icon={<span className="text-yellow-500">🔥</span>}
          description={`Best: ${maxStreak} days`}
        />
        <StatCard 
          title="Mastered Topics" 
          value={topicPerformance.filter(t => t.accuracy >= 80).length} 
          icon={<PieChart className="h-4 w-4 text-muted-foreground" />}
          description={`Out of ${topicPerformance.length} topics`}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="topics">By Topic</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Accuracy</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      name="Accuracy %" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="attempts"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value} attempts`, name]} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Weekly Activity</CardTitle>
                <div className="flex space-x-2">
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="questions" name="Questions" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="activeDays" name="Active Days" fill="#82ca9d" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectBreakdown.map((subject) => (
                  <div key={subject.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{subject.name}</span>
                      <span className="font-medium">{Math.round(subject.accuracy)}%</span>
                    </div>
                    <Progress value={subject.accuracy} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{subject.correctAttempts} correct of {subject.totalAttempts}</span>
                      <span>Avg. {Math.round(subject.avgTimeSpent / 60)} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>Topic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topicPerformance.map((topic) => (
                  <div key={topic.id} className="space-y-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">{topic.name}</p>
                        <p className="text-xs text-muted-foreground">{topic.subjectName}</p>
                      </div>
                      <Badge 
                        variant={topic.accuracy >= 80 ? 'success' : topic.accuracy >= 50 ? 'default' : 'destructive'}
                      >
                        {Math.round(topic.accuracy)}%
                      </Badge>
                    </div>
                    <Progress value={topic.accuracy} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{topic.correctAttempts} of {topic.totalAttempts} correct</span>
                      <span>Last practiced: {new Date(topic.lastAttempted).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recommendations?.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recommendations</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {data.recommendations.map((rec, index) => (
                      <Card key={index} className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                              {rec.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{rec.message}</p>
                          <Button variant="outline" size="sm" className="mt-3">
                            {rec.action?.type === 'practice' ? 'Practice Now' : 'View Details'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recommendations available yet. Complete more questions to get personalized suggestions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon, description }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DPPAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-4 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-4" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-4" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
