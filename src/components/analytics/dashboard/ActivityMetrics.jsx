import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, BookOpen, Activity, Zap, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ActivityMetrics({ activityData, timeRange, onTimeRangeChange }) {
  const [activeTab, setActiveTab] = useState('daily');
  const [insights, setInsights] = useState({
    totalStudyTime: 0,
    averageDailyStudyTime: 0,
    mostActiveDay: '',
    mostActiveHour: '',
    mostStudiedSubject: '',
    totalSessions: 0,
  });

  useEffect(() => {
    if (!activityData) return;

    // Calculate insights from activity data
    const totalStudyTime = activityData.reduce(
      (sum, day) => sum + (day.minutesStudied || 0),
      0
    );

    const daysWithData = activityData.filter(day => day.minutesStudied > 0).length || 1;
    const averageDailyStudyTime = Math.round(totalStudyTime / daysWithData);

    // Find most active day
    const mostActiveDayData = [...activityData].sort(
      (a, b) => b.minutesStudied - a.minutesStudied
    )[0];

    setInsights({
      totalStudyTime,
      averageDailyStudyTime,
      mostActiveDay: mostActiveDayData?.date || 'N/A',
      mostActiveHour: activityData.insights?.mostActiveHour || 'N/A',
      mostStudiedSubject: activityData.insights?.mostStudiedSubject?.[0] || 'N/A',
      totalSessions: activityData.insights?.totalStudySessions || 0,
    });
  }, [activityData]);

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];

  const StatCard = ({ title, value, icon: Icon, description }) => (
    <Card className="h-full">
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

  // Prepare data for charts
  const dailyData = activityData?.map(day => ({
    date: day.date,
    'Study Time (min)': day.minutesStudied || 0,
    'Questions Answered': day.questionsAnswered || 0,
    'Test Score': day.testScore || 0,
  })) || [];

  const subjectData = activityData?.insights?.mostStudiedSubject?.map((subject, index) => ({
    name: subject,
    value: 10 - index, // Placeholder - replace with actual data
    color: COLORS[index % COLORS.length],
  })) || [];

  const hourData = Array(24).fill(0).map((_, hour) => ({
    hour: `${hour}:00`,
    activity: Math.floor(Math.random() * 10) + 1, // Placeholder - replace with actual data
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h2 className="text-3xl font-bold tracking-tight">Activity Analytics</h2>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Study Time"
          value={`${Math.floor(insights.totalStudyTime / 60)}h ${insights.totalStudyTime % 60}m`}
          icon={Clock}
          description={`${insights.averageDailyStudyTime} min/day on average`}
        />
        <StatCard
          title="Study Sessions"
          value={insights.totalSessions}
          icon={Activity}
          description={`Most active day: ${insights.mostActiveDay}`}
        />
        <StatCard
          title="Most Active Time"
          value={insights.mostActiveHour}
          icon={Zap}
          description="Peak study hours"
        />
        <StatCard
          title="Top Subject"
          value={insights.mostStudiedSubject}
          icon={BookOpen}
          description="Most studied subject"
        />
      </div>

      <Tabs defaultValue="daily" onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Activity</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="hours">Time of Day</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="Study Time (min)" fill="#8884d8" name="Study Time (min)" />
                  <Bar yAxisId="right" dataKey="Questions Answered" fill="#82ca9d" name="Questions Answered" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Study Time by Subject</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity by Time of Day</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="activity" name="Activity Level" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span>Learning Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="Study Time (min)" stroke="#8884d8" name="Study Time (min)" />
                <Line yAxisId="right" type="monotone" dataKey="Test Score" stroke="#82ca9d" name="Test Score (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Consistency</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold text-green-500">
                {Math.min(100, Math.floor((daysWithData / activityData?.length) * 100))}%
              </div>
              <p className="text-muted-foreground">
                {daysWithData} out of {activityData?.length} days active
              </p>
              <p className="text-sm text-muted-foreground">
                {daysWithData >= activityData?.length * 0.8
                  ? 'Excellent consistency! Keep it up! 🎉'
                  : daysWithData >= activityData?.length * 0.5
                  ? 'Good progress! Try to study more consistently.'
                  : 'Try to study more regularly for better results.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ActivityMetrics;
