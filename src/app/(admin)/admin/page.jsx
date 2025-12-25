import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  FileText,
  BarChart3,
  Clock,
  Award,
  CheckCircle,
  DollarSign,
  Calendar,
  Bookmark,
  MessageSquare,
  FileVideo,
  Plus,
  Pencil,
  Activity,
  Book,
  FileQuestion,
  TrendingUp,
  UserCheck,
  FileCheck,
  Clock4,
  BarChart4,
  LineChart,
  DollarSign as DollarSignIcon,
  Award as AwardIcon,
  UserPlus,
  BookmarkCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import { columns as userColumns } from './_components/users-columns';
import { columns as testColumns } from './_components/tests-columns';
import { cn } from '@/lib/utils';

// Mock data - replace with actual API calls
const stats = {
  totalUsers: 1245,
  activeUsers: 876,
  totalTests: 45,
  activeTests: 12,
  totalQuestions: 567,
  totalRevenue: 287500,
  averageScore: 72,
  monthlyGrowth: 15.2,
  userRetention: 84.5,
  testCompletionRate: 68.3,
  totalContent: 234,
  totalCourses: 18,
};

const recentActivity = [
  {
    id: 1,
    user: { name: 'John Doe', email: 'john@example.com', avatar: '/avatars/01.png' },
    action: 'completed',
    item: { type: 'test', title: 'Physics Weekly Test', id: 'test-123' },
    time: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    read: false
  },
  {
    id: 2,
    user: { name: 'Jane Smith', email: 'jane@example.com', avatar: '/avatars/02.png' },
    action: 'started',
    item: { type: 'course', title: 'Chemistry Practice', id: 'course-456' },
    time: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    read: true
  },
  {
    id: 3,
    user: { name: 'Admin', email: 'admin@mindora.com', avatar: '/avatars/admin.png' },
    action: 'created',
    item: { type: 'test', title: 'Mathematics Quiz', id: 'test-124' },
    time: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    read: true
  },
  {
    id: 4,
    user: { name: 'Alex Johnson', email: 'alex@example.com', avatar: '/avatars/03.png' },
    action: 'signed up',
    item: null,
    time: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: true
  },
  {
    id: 5,
    user: { name: 'Sarah Williams', email: 'sarah@example.com', avatar: '/avatars/04.png' },
    action: 'completed',
    item: { type: 'dpp', title: 'DPP #24', id: 'dpp-24' },
    time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: true
  },
];

const upcomingTests = [
  {
    id: 1,
    name: 'Physics Weekly Test',
    date: '2023-11-15T10:00:00Z',
    participants: 124,
    type: 'free',
    subject: 'Physics',
    duration: 90,
    questions: 30,
    status: 'upcoming'
  },
  {
    id: 2,
    name: 'Chemistry Olympiad Qualifier',
    date: '2023-11-18T14:00:00Z',
    participants: 89,
    type: 'premium',
    subject: 'Chemistry',
    duration: 120,
    questions: 50,
    status: 'upcoming',
    price: 299
  },
  {
    id: 3,
    name: 'Mathematics Challenge',
    date: '2023-11-20T09:30:00Z',
    participants: 156,
    type: 'free',
    subject: 'Mathematics',
    duration: 90,
    questions: 40,
    status: 'draft'
  },
];

const recentUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', joined: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), status: 'active', lastActive: new Date() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', joined: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), status: 'active', lastActive: new Date(Date.now() - 3600000) },
  { id: 3, name: 'Alex Johnson', email: 'alex@example.com', joined: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), status: 'inactive', lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', joined: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: 'active', lastActive: new Date(Date.now() - 7200000) },
];

const revenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 58000 },
  { month: 'May', revenue: 62000 },
  { month: 'Jun', revenue: 75000 },
];

const subjectPerformance = [
  { subject: 'Physics', averageScore: 78, completionRate: 82, totalStudents: 345 },
  { subject: 'Chemistry', averageScore: 72, completionRate: 76, totalStudents: 298 },
  { subject: 'Mathematics', averageScore: 68, completionRate: 71, totalStudents: 412 },
  { subject: 'Biology', averageScore: 75, completionRate: 79, totalStudents: 287 },
];

// Stats Card Component
function StatCard({ title, value, icon: Icon, change, description, progress, className = '' }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{description}</span>
              <span className={cn(
                'flex items-center',
                change > 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
              </span>
            </div>
            <Progress value={progress} className="h-2 mt-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Recent Activity Item Component
function ActivityItem({ activity }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'test_completed':
        return <FileCheck className="h-4 w-4 text-green-500" />;
      case 'user_registered':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'test_created':
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className="mt-1">
        <div className="p-2 rounded-lg bg-muted">
          {getActivityIcon(activity.type)}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-medium">{activity.user.name}</span> {activity.action}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
      </div>
      {activity.link && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={activity.link}>View</Link>
        </Button>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  // Mock data for recent activity
  const recentActivity = [
    {
      id: 1,
      type: 'test_completed',
      user: { name: 'John Doe', avatar: '' },
      action: 'completed the Physics Weekly Test',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      link: '/admin/tests/1/results'
    },
    {
      id: 2,
      type: 'user_registered',
      user: { name: 'Jane Smith', avatar: '' },
      action: 'signed up for an account',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      link: '/admin/users/2'
    },
    {
      id: 3,
      type: 'test_created',
      user: { name: 'Admin', avatar: '' },
      action: 'created a new Mathematics Quiz',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      link: '/admin/tests/3'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/reports">
              <FileText className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back, Admin. Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/reports">
              <FileText className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          change={12.5}
          description={`${stats.activeUsers} active today`}
          progress={stats.userRetention}
        />

        <StatCard
          title="Total Tests"
          value={stats.totalTests}
          icon={FileText}
          change={8.3}
          description={`${stats.activeTests} active now`}
          progress={75}
        />

        <StatCard
          title="Total Questions"
          value={stats.totalQuestions}
          icon={FileQuestion}
          change={5.2}
          description="In question bank"
          progress={60}
        />

        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSignIcon}
          change={15.8}
          description="This month"
          progress={65}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active today
              </p>
              <span className="text-xs text-green-500">+{stats.monthlyGrowth}%</span>
            </div>
            <Progress value={stats.userRetention} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests & Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-bold">{stats.totalTests}</div>
                <p className="text-xs text-muted-foreground">Total Tests</p>
              </div>
              <div>
                <div className="text-xl font-bold">{stats.totalContent}</div>
                <p className="text-xs text-muted-foreground">Content Items</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Test Completion</span>
                <span>{stats.testCompletionRate}%</span>
              </div>
              <Progress value={stats.testCompletionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.totalRevenue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total revenue generated
            </p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>This month</span>
                <span className="text-green-500">+12.5%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-bold">{stats.averageScore}%</div>
                <p className="text-xs text-muted-foreground">Avg. Score</p>
              </div>
              <div>
                <div className="text-xl font-bold">{stats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">Courses</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>User Engagement</span>
                <span>High</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Tests */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tests</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/tests">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {upcomingTests.slice(0, 3).map((test) => (
                <div key={test.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{test.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {test.subject} • {test.questions} questions • {test.duration} mins
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(test.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <Badge
                      variant={test.status === 'upcoming' ? 'default' : 'outline'}
                      className="mt-1 capitalize"
                    >
                      {test.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/activity">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Performance chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectPerformance.map((subject) => (
                    <div key={subject.subject} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{subject.subject}</span>
                        <span className="text-sm font-medium">{subject.averageScore}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={subject.averageScore} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {subject.completionRate}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {subject.totalStudents} students
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Users</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/users">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={`/avatars/0${(user.id % 4) + 1}.png`} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                        </p>
                        <Badge
                          variant={user.status === 'active' ? 'outline' : 'secondary'}
                          className={user.status === 'active' ? 'text-green-600' : ''}
                        >
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Upcoming Tests</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/tests">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{test.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {test.subject} • {test.duration} mins • {test.questions} questions
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(test.date).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge
                          variant={test.status === 'upcoming' ? 'default' : 'outline'}
                          className="capitalize"
                        >
                          {test.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {test.participants} participants
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="h-8">
                            <Link href={`/admin/tests/${test.id}`}>
                              <span className="sr-only">Edit</span>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button size="sm" asChild className="h-8">
                            <Link href={`/admin/tests/${test.id}/results`}>
                              Results
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Revenue chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">User growth chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Engagement metrics will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Test performance chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {!activity.read && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      <p className="text-sm">
                        {activity.action === 'completed' && (
                          <>
                            completed <span className="font-medium">{activity.item?.title}</span> {activity.item?.type}
                          </>
                        )}
                        {activity.action === 'started' && (
                          <>
                            started <span className="font-medium">{activity.item?.title}</span> {activity.item?.type}
                          </>
                        )}
                        {activity.action === 'created' && (
                          <>
                            created a new <span className="font-medium">{activity.item?.title}</span> {activity.item?.type}
                          </>
                        )}
                        {activity.action === 'signed up' && (
                          <>
                            signed up for an account
                          </>
                        )}
                      </p>
                      {activity.item && (
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" asChild>
                          <Link href={`/admin/${activity.item.type}s/${activity.item.id}`}>
                            View {activity.item.type}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="mt-4 w-full" asChild>
                <Link href="/admin/activity">View all activity</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-24 flex-col" asChild>
          <Link href="/admin/users/new" className="space-y-2">
            <Users className="h-6 w-6" />
            <span>Add New User</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex-col" asChild>
          <Link href="/admin/questions/import" className="space-y-2">
            <FileText className="h-6 w-6" />
            <span>Import Questions</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex-col" asChild>
          <Link href="/admin/analytics" className="space-y-2">
            <BarChart3 className="h-6 w-6" />
            <span>View Analytics</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-24 flex-col" asChild>
          <Link href="/admin/settings" className="space-y-2">
            <Award className="h-6 w-6" />
            <span>Manage Badges</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
