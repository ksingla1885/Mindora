'use client';

import {
  Users,
  TrendingUp,
  UserCheck,
  FileCheck,
  DollarSign,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const adminName = session?.user?.name || 'Admin';

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
        {/* Stat 1 */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Users</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">0</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>No activity yet</span>
          </div>
        </div>
        {/* Stat 2 */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Students</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">0</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>No activity yet</span>
          </div>
        </div>
        {/* Stat 3 */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Tests Conducted</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">0</h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>No activity yet</span>
          </div>
        </div>
        {/* Stat 4 */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Revenue (Today)</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">$0</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>No activity yet</span>
          </div>
        </div>
      </div>

      {/* Charts Section - Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Line Chart - Empty State */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Platform Engagement</h3>
              <p className="text-sm text-muted-foreground">Daily active users over the last 30 days</p>
            </div>
          </div>
          {/* Empty State */}
          <div className="flex-1 w-full min-h-[250px] flex flex-col items-center justify-center">
            <div className="p-4 bg-secondary/20 rounded-full mb-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-2">No engagement data yet</h4>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              User engagement metrics will appear here once students start using the platform.
            </p>
          </div>
        </div>
        {/* Bar Chart - Empty State */}
        <div className="col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
            <p className="text-sm text-muted-foreground">Monthly revenue</p>
          </div>
          {/* Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            <div className="p-4 bg-secondary/20 rounded-full mb-4">
              <DollarSign className="h-12 w-12 text-muted-foreground" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-2">No revenue data</h4>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Revenue trends will be displayed once payments are processed.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tables and Lists - Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions - Empty State */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
            <Link className="text-sm text-primary hover:text-primary-hover font-medium transition-colors" href="/admin/payments">View All</Link>
          </div>
          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-secondary/20 rounded-full mb-4">
              <DollarSign className="h-12 w-12 text-muted-foreground" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-2">No payments yet</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Payment transactions will appear here once students start purchasing tests.
            </p>
          </div>
        </div>
        {/* Upcoming Tests - Empty State */}
        <div className="col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Upcoming Olympiads</h3>
          </div>
          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="p-4 bg-secondary/20 rounded-full mb-4">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h4 className="text-base font-semibold text-foreground mb-2">No upcoming tests</h4>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Schedule your first test to get started.
            </p>
            <Button variant="outline" className="w-full py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground border-dashed border-border rounded-lg transition-all hover:border-primary/50 cursor-pointer active:scale-95">
              + Schedule New Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
