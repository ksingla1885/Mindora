import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, PieChart } from 'recharts';
import { Calendar, Clock, BookOpen, BarChart as BarChartIcon, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { format, subDays } from 'date-fns';

export function LearningAnalyticsDashboard({ userId, dateRange = '7d' }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    completedTopics: 0,
    averageScore: 0,
    streak: 0,
  });
  const [activityData, setActivityData] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [timeRange, setTimeRange] = useState(dateRange);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [statsRes, activityRes, progressRes] = await Promise.all([
          fetch(`/api/analytics/stats?userId=${userId}&range=${timeRange}`).then(res => res.json()),
          fetch(`/api/analytics/activity?userId=${userId}&range=${timeRange}`).then(res => res.json()),
          fetch(`/api/analytics/progress?userId=${userId}`).then(res => res.json())
        ]);

        setStats(statsRes);
        setActivityData(activityRes.data || []);
        setProgressData(progressData.data || []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, timeRange]);

  const StatCard = ({ title, value, icon: Icon, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Learning Analytics</h2>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Study Time"
          value={`${Math.floor(stats.totalStudyTime / 60)}h ${stats.totalStudyTime % 60}m`}
          icon={Clock}
          description={`+${Math.floor(stats.totalStudyTime / 60 / 10)}% from last period`}
        />
        <StatCard
          title="Completed Topics"
          value={stats.completedTopics}
          icon={BookOpen}
          description={`${Math.round((stats.completedTopics / 50) * 100)}% of your goal`}
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={BarChartIcon}
          description="Across all tests and quizzes"
        />
        <StatCard
          title="Current Streak"
          value={`${stats.streak} days`}
          icon={TrendingUp}
          description={`Longest: ${Math.max(stats.streak, 14)} days`}
        />
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <LineChart
                  width={800}
                  height={300}
                  data={activityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="minutesStudied" name="Minutes Studied" stroke="#8884d8" />
                  <Line type="monotone" dataKey="questionsAnswered" name="Questions Answered" stroke="#82ca9d" />
                </LineChart>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <BarChart
                  width={800}
                  height={400}
                  data={progressData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="subject" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completion" name="Completion %" fill="#8884d8" />
                  <Bar dataKey="accuracy" name="Accuracy %" fill="#82ca9d" />
                </BarChart>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Test Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <LineChart
                    width={500}
                    height={300}
                    data={activityData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="testScore" name="Test Score" stroke="#ff7300" />
                  </LineChart>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Topic Mastery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={[
                        { name: 'Mastered', value: 35, color: '#10b981' },
                        { name: 'In Progress', value: 45, color: '#f59e0b' },
                        { name: 'Needs Work', value: 20, color: '#ef4444' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Mastered', color: '#10b981' },
                        { name: 'In Progress', color: '#f59e0b' },
                        { name: 'Needs Work', color: '#ef4444' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LearningAnalyticsDashboard;
