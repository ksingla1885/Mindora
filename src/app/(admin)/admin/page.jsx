'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  UserCheck,
  FileCheck,
  DollarSign,
  BarChart3,
  Calendar,
  Loader2,
  PlusCircle,
  UploadCloud,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Curated color palette for charts
const CHART_COLORS = {
  blue: '#6366f1',
  purple: '#a855f7',
  emerald: '#10b981',
  orange: '#f59e0b',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  pink: '#ec4899',
  amber: '#f59e0b',
};

const SUBJECT_COLORS = [
  '#6366f1', '#a855f7', '#10b981', '#f59e0b',
  '#f43f5e', '#06b6d4', '#ec4899', '#8b5cf6',
];

// Custom tooltip for Area Chart
const EngagementTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip for Bar Chart
const RevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs font-bold text-foreground mb-1">{payload[0]?.payload?.date || label}</p>
        <p className="text-sm font-bold text-emerald-400">₹{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for Pie Chart
const SubjectTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs font-bold text-foreground">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">{payload[0].value} topics</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const adminName = session?.user?.name || 'Admin';

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          console.error('API Fetch failed with status:', response.status);
          const text = await response.text();
          let errorData = {};
          try {
            errorData = JSON.parse(text);
          } catch (e) {
            console.error('API response is not JSON:', text.substring(0, 200));
          }
          console.error('API Error Response:', errorData);
          throw new Error(errorData.message || `API Error: ${response.status}`);
        }
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: 'Total Users',
      value: data?.stats?.totalUsers || 0,
      icon: <Users className="h-5 w-5" />,
      color: 'bg-primary/10 text-primary',
      trend: data?.stats?.newStudentsThisMonth > 0 ? `+${data.stats.newStudentsThisMonth} this month` : 'No new users'
    },
    {
      label: 'Active Students',
      value: data?.stats?.totalStudents || 0,
      icon: <UserCheck className="h-5 w-5" />,
      color: 'bg-purple-500/10 text-purple-400',
      trend: 'Registered students'
    },
    {
      label: 'Tests Conducted',
      value: data?.stats?.testsCompleted || 0,
      icon: <FileCheck className="h-5 w-5" />,
      color: 'bg-orange-500/10 text-orange-400',
      trend: `${data?.stats?.activeTests || 0} currently active`
    },
    {
      label: 'Revenue (Today)',
      value: `₹${data?.stats?.revenueToday || 0}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-emerald-500/10 text-emerald-400',
      trend: 'From completed payments'
    }
  ];

  // Compute total 7-day revenue for the header stat
  const totalWeekRevenue = (data?.dailyRevenue || []).reduce((sum, d) => sum + d.revenue, 0);
  const totalTopics = (data?.subjectDistribution || []).reduce((sum, s) => sum + s.value, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-destructive/20 rounded-xl bg-destructive/5 p-8">
        <p className="text-destructive font-semibold mb-2">Error Loading Dashboard</p>
        <p className="text-muted-foreground mb-4 text-center max-w-md">{error}</p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()}>Retry</Button>
          <Button variant="outline" onClick={async () => {
            try {
              const res = await fetch('/api/admin/debug-db');
              const data = await res.json();
              alert(JSON.stringify(data, null, 2));
            } catch (err) {
              alert('Network Error: ' + err.message);
            }
          }}>Run Diagnostics</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {adminName}. Here&apos;s what&apos;s happening with your platform today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-background dark:bg-surface-dark border-border hover:bg-accent text-foreground text-sm font-medium rounded-lg px-5 py-2.5 transition-all hover:-translate-y-0.5 active:scale-95">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg ${stat.color} group-hover:bg-primary group-hover:text-white transition-colors`}>
                {stat.icon}
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users Avatar Stack */}
      {data?.recentUsers?.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 overflow-hidden">
              {data.recentUsers.map((user) => {
                const initials = user.name
                  ?.split(' ')
                  ?.filter(Boolean)
                  ?.map((n) => n[0])
                  ?.join('')
                  ?.toUpperCase()
                  ?.slice(0, 2) || 'U';
                return (
                  <div
                    key={user.id}
                    className="inline-block h-9 w-9 rounded-full ring-2 ring-card bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 select-none cursor-help relative"
                    title={`${user.name || user.email} (Joined ${new Date(user.createdAt).toLocaleDateString()})`}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Recent Signups
              </p>
              <p className="text-xs text-muted-foreground">
                {data.recentUsers.length} new student{data.recentUsers.length > 1 ? 's' : ''} joined the platform recently.
              </p>
            </div>
          </div>
          <Link
            href="/admin/users"
            className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 transition-colors self-start sm:self-center bg-primary/5 hover:bg-primary/10 px-3.5 py-1.5 rounded-lg"
          >
            Manage Users &rarr;
          </Link>
        </div>
      )}

      {/* Charts Section — 3 equal-width columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Platform Engagement — Area Chart */}
        <div className="lg:col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Platform Engagement</h3>
              <p className="text-sm text-muted-foreground">Monthly new students &amp; test attempts</p>
            </div>
          </div>
          {(data?.performanceData?.length > 0) ? (
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.performanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.purple} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.purple} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<EngagementTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke={CHART_COLORS.blue}
                    strokeWidth={2.5}
                    fill="url(#gradStudents)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: CHART_COLORS.blue }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tests"
                    stroke={CHART_COLORS.purple}
                    strokeWidth={2.5}
                    fill="url(#gradTests)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: CHART_COLORS.purple }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS.blue }} />
                  Students
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS.purple }} />
                  Tests
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-[250px] flex flex-col items-center justify-center">
              <div className="p-4 bg-secondary/20 rounded-full mb-4">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h4 className="text-base font-semibold text-foreground mb-2">No engagement data yet</h4>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                User engagement metrics will appear here once students start using the platform.
              </p>
            </div>
          )}
        </div>

        {/* Revenue Trend — Bar Chart (last 7 days) */}
        <div className="lg:col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">₹{totalWeekRevenue}</p>
              <p className="text-xs text-muted-foreground">7-day total</p>
            </div>
          </div>
          {(data?.dailyRevenue?.length > 0 && totalWeekRevenue > 0) ? (
            <div className="flex-1 w-full min-h-[220px] mt-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Bar
                    dataKey="revenue"
                    fill={CHART_COLORS.emerald}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
              <div className="p-4 bg-secondary/20 rounded-full mb-4">
                <DollarSign className="h-12 w-12 text-muted-foreground" />
              </div>
              <h4 className="text-base font-semibold text-foreground mb-2">No revenue data</h4>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Revenue trends will be displayed once payments are processed.
              </p>
            </div>
          )}
        </div>

        {/* Subject Distribution — Donut Pie Chart */}
        <div className="lg:col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Subject Distribution</h3>
            <p className="text-sm text-muted-foreground">Topics per subject</p>
          </div>
          {(data?.subjectDistribution?.length > 0 && totalTopics > 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={data.subjectDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.subjectDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<SubjectTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-foreground">{totalTopics}</span>
                  <span className="text-xs text-muted-foreground">Topics</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4">
                {data.subjectDistribution.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }}
                    />
                    <span className="truncate max-w-[80px]">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
              <div className="p-4 bg-secondary/20 rounded-full mb-4">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h4 className="text-base font-semibold text-foreground mb-2">No subjects yet</h4>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Subject distribution will appear once subjects and topics are created.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Tests */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Top Performing Tests</h3>
            <p className="text-sm text-muted-foreground">Highest scoring and most completed assessments</p>
          </div>
        </div>
        {data?.testPerformance?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pl-2 font-semibold">Test Name</th>
                  <th className="pb-3 text-center font-semibold">Attempts</th>
                  <th className="pb-3 text-center font-semibold">Avg. Score</th>
                  <th className="pb-3 pr-2 font-semibold">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {data.testPerformance.map((test) => (
                  <tr 
                    key={test.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => window.location.href = `/admin/tests/${test.id}`}
                  >
                    <td className="py-3.5 pl-2 font-medium text-foreground group-hover:text-primary transition-colors">
                      {test.name}
                    </td>
                    <td className="py-3.5 text-center text-muted-foreground">
                      {test.attempts}
                    </td>
                    <td className="py-3.5 text-center font-semibold text-foreground">
                      {test.avgScore}%
                    </td>
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500" 
                            style={{ width: `${test.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground w-8 text-right">
                          {test.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-secondary/20 rounded-full mb-4">
              <FileCheck className="h-12 w-12 text-muted-foreground" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-2">No test performance data yet</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Performance statistics will appear here as soon as students complete graded tests.
            </p>
          </div>
        )}
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <Link className="text-sm text-primary hover:text-primary-hover font-medium transition-colors" href="/admin/users">View All</Link>
          </div>
          {data?.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {activity.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-secondary/20 rounded-full mb-4">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h4 className="text-base font-semibold text-foreground mb-2">No activity yet</h4>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Recent user actions will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col h-full">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Common administrative operations</p>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <Link href="/admin/tests/new" className="flex flex-col items-center justify-center p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 text-blue-500 hover:text-blue-600 transition-all text-center group active:scale-95">
              <PlusCircle className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-foreground">Create Test</span>
            </Link>
            <Link href="/admin/questions" className="flex flex-col items-center justify-center p-4 rounded-xl border border-purple-500/10 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/30 text-purple-500 hover:text-purple-600 transition-all text-center group active:scale-95">
              <UploadCloud className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-foreground">Upload CSV</span>
            </Link>
            <Link href="/admin/payments" className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-500 hover:text-emerald-600 transition-all text-center group active:scale-95">
              <Banknote className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-foreground">Payments</span>
            </Link>
            <Link href="/admin/analytics" className="flex flex-col items-center justify-center p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-500 hover:text-amber-600 transition-all text-center group active:scale-95">
              <BarChart3 className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-foreground">Analytics</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
