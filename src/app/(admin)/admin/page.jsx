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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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
          <p className="text-muted-foreground mt-1">Welcome back, {adminName}. Here's what's happening with your platform today.</p>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Platform Engagement</h3>
              <p className="text-sm text-muted-foreground">Daily active users over the last 30 days</p>
            </div>
          </div>
          {(data?.performanceData?.length > 0) ? (
             <div className="flex-1 w-full min-h-[250px]">
                {/* Chart would go here - implementation depends on chosen library */}
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Charts are being initialized...
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
        
        <div className="col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
            <p className="text-sm text-muted-foreground">Monthly revenue</p>
          </div>
          {data?.stats?.revenueToday > 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
               <h2 className="text-3xl font-bold">₹{data.stats.revenueToday}</h2>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
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

        <div className="col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Upcoming Olympiads</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="p-4 bg-secondary/20 rounded-full mb-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-2">No upcoming tests</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Schedule your first test to get started.
            </p>
            <Link href="/admin/tests/new" className="w-full">
              <Button variant="outline" className="w-full py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground border-dashed border-border rounded-lg transition-all hover:border-primary/50 cursor-pointer active:scale-95">
                + Schedule New Test
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
