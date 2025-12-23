'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Line, LineChart, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Sample data - replace with actual data from props
const sampleData = {
  userGrowth: Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM d'),
    users: Math.floor(Math.random() * 20) + 5,
  })),
  
  activityByHour: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    activeUsers: Math.floor(Math.random() * 50) + 10,
  })),
  
  contentEngagement: [
    { name: 'Videos', value: 35 },
    { name: 'Quizzes', value: 25 },
    { name: 'Articles', value: 20 },
    { name: 'Practice Tests', value: 15 },
    { name: 'Others', value: 5 },
  ],
  
  userRetention: [
    { day: 'Day 1', retention: 100 },
    { day: 'Day 2', retention: 75 },
    { day: 'Day 3', retention: 65 },
    { day: 'Day 7', retention: 50 },
    { day: 'Day 14', retention: 40 },
    { day: 'Day 30', retention: 30 },
  ],
};

export function Overview({ dateRange, stats, isLoading }) {
  // Format date range for display
  const dateRangeText = `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Overview: {dateRangeText}</h2>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="activity">Activity by Hour</TabsTrigger>
          <TabsTrigger value="engagement">Content Engagement</TabsTrigger>
          <TabsTrigger value="retention">User Retention</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <p className="text-sm text-muted-foreground">
                New user signups over time
              </p>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleData.userGrowth}>
                  <XAxis
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="users"
                    fill="currentColor"
                    radius={[4, 4, 0, 0]}
                    className="fill-primary"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity by Hour</CardTitle>
              <p className="text-sm text-muted-foreground">
                Peak usage hours (UTC)
              </p>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleData.activityByHour}>
                  <XAxis
                    dataKey="hour"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Content Engagement</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribution of user engagement by content type
              </p>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sampleData.contentEngagement}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sampleData.contentEngagement.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle>User Retention</CardTitle>
              <p className="text-sm text-muted-foreground">
                Percentage of users who return after their first visit
              </p>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleData.userRetention}>
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Retention']} />
                  <Line
                    type="monotone"
                    dataKey="retention"
                    stroke="#00C49F"
                    strokeWidth={2}
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Content</CardTitle>
            <p className="text-sm text-muted-foreground">
              Most viewed and completed content
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {item}. Introduction to {['Physics', 'Chemistry', 'Maths', 'Biology', 'Computer Science'][item - 1]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {['Video', 'Quiz', 'Article', 'Test', 'Practice'][item - 1]} • {Math.floor(Math.random() * 500) + 100} views
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {Math.floor(Math.random() * 30) + 70}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest user actions on the platform
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: 'John Doe', action: 'completed a test', time: '2 min ago', score: '85%' },
                { user: 'Jane Smith', action: 'watched a video', time: '10 min ago', content: 'Introduction to Physics' },
                { user: 'Alex Johnson', action: 'started a new course', time: '25 min ago', course: 'Advanced Mathematics' },
                { user: 'Sarah Williams', action: 'earned a badge', time: '1 hour ago', badge: 'Quick Learner' },
                { user: 'Mike Brown', action: 'asked a question', time: '2 hours ago', topic: 'Chemical Bonding' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.user} <span className="font-normal">{activity.action}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.time} • {activity.score || activity.content || activity.course || activity.badge || activity.topic}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
