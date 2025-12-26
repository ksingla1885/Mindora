'use client';

import {
  Users,
  TrendingUp,
  UserCheck,
  FileCheck,
  DollarSign,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
          <Button className="bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-all shadow-md hover:shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:scale-95">
            Create New Test
          </Button>
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
              <h3 className="text-2xl font-bold text-foreground mt-1">12,450</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>+120 this week</span>
          </div>
        </div>
        {/* Stat 2 */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Students</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">850</h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>+5% vs last week</span>
          </div>
        </div>
        {/* Stat 3 */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Tests Conducted</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">3,420</h3>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>+12% vs last month</span>
          </div>
        </div>
        {/* Stat 4 */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Revenue (Today)</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">$4,200</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>+8% vs yesterday</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Line Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Platform Engagement</h3>
              <p className="text-sm text-muted-foreground">Daily active users over the last 30 days</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> +15.3%
              </span>
            </div>
          </div>
          {/* SVG Chart Visualization */}
          <div className="flex-1 w-full min-h-[250px] relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 250">
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2b6cee" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#2b6cee" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4" x1="0" x2="800" y1="200" y2="200"></line>
              <line className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4" x1="0" x2="800" y1="150" y2="150"></line>
              <line className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4" x1="0" x2="800" y1="100" y2="100"></line>
              <line className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4" x1="0" x2="800" y1="50" y2="50"></line>
              {/* The Area */}
              <path d="M0,200 L0,160 C50,150 100,180 150,140 C200,100 250,120 300,80 C350,40 400,90 450,70 C500,50 550,110 600,90 C650,70 700,40 750,50 L800,30 L800,200 Z" fill="url(#chartGradient)"></path>
              {/* The Line */}
              <path d="M0,160 C50,150 100,180 150,140 C200,100 250,120 300,80 C350,40 400,90 450,70 C500,50 550,110 600,90 C650,70 700,40 750,50 L800,30" fill="none" stroke="#2b6cee" strokeLinecap="round" strokeWidth="3"></path>
              {/* Data point dots */}
              <circle cx="300" cy="80" fill="#2b6cee" r="4" className="stroke-white dark:stroke-slate-900" strokeWidth="2"></circle>
              <circle cx="600" cy="90" fill="#2b6cee" r="4" className="stroke-white dark:stroke-slate-900" strokeWidth="2"></circle>
            </svg>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-4 px-2">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
        {/* Bar Chart */}
        <div className="col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
            <p className="text-sm text-muted-foreground">Monthly revenue</p>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 min-h-[200px] px-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-sm relative group h-[40%]">
              <div className="absolute inset-x-0 bottom-0 bg-primary/30 group-hover:bg-primary transition-all rounded-t-sm h-full"></div>
              <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded transition-opacity">$12k</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-sm relative group h-[65%]">
              <div className="absolute inset-x-0 bottom-0 bg-primary/50 group-hover:bg-primary transition-all rounded-t-sm h-full"></div>
              <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded transition-opacity">$18k</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-sm relative group h-[50%]">
              <div className="absolute inset-x-0 bottom-0 bg-primary/40 group-hover:bg-primary transition-all rounded-t-sm h-full"></div>
              <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded transition-opacity">$15k</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-sm relative group h-[85%]">
              <div className="absolute inset-x-0 bottom-0 bg-primary/70 group-hover:bg-primary transition-all rounded-t-sm h-full"></div>
              <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded transition-opacity">$24k</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-t-sm relative group h-[100%]">
              <div className="absolute inset-x-0 bottom-0 bg-primary group-hover:bg-primary transition-all rounded-t-sm h-full"></div>
              <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded transition-opacity">$28k</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-4 px-1">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
            <Link className="text-sm text-primary hover:text-primary-hover font-medium transition-colors" href="/admin/payments">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="text-xs uppercase bg-secondary/50 text-foreground/70">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg" scope="col">User</th>
                  <th className="px-4 py-3" scope="col">Test ID</th>
                  <th className="px-4 py-3" scope="col">Date</th>
                  <th className="px-4 py-3" scope="col">Amount</th>
                  <th className="px-4 py-3 rounded-r-lg" scope="col">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-secondary/30 transition-colors cursor-pointer group">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-3">
                    <Avatar className="h-8 w-8 group-hover:scale-110 transition-transform">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">JS</AvatarFallback>
                    </Avatar>
                    John Smith
                  </td>
                  <td className="px-4 py-3">#OLY-2023-001</td>
                  <td className="px-4 py-3">Oct 24, 2023</td>
                  <td className="px-4 py-3 text-foreground font-medium">$25.00</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Success</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-secondary/30 transition-colors cursor-pointer group">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-3">
                    <Avatar className="h-8 w-8 group-hover:scale-110 transition-transform">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AL</AvatarFallback>
                    </Avatar>
                    Anna Lee
                  </td>
                  <td className="px-4 py-3">#MATH-ADV-05</td>
                  <td className="px-4 py-3">Oct 24, 2023</td>
                  <td className="px-4 py-3 text-foreground font-medium">$45.00</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-secondary/30 transition-colors cursor-pointer group">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-3">
                    <Avatar className="h-8 w-8 group-hover:scale-110 transition-transform">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">MK</AvatarFallback>
                    </Avatar>
                    Mike Kola
                  </td>
                  <td className="px-4 py-3">#PHYS-CHAMP</td>
                  <td className="px-4 py-3">Oct 23, 2023</td>
                  <td className="px-4 py-3 text-foreground font-medium">$30.00</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Failed</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-secondary/30 transition-colors cursor-pointer group">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-3">
                    <Avatar className="h-8 w-8 group-hover:scale-110 transition-transform">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">SR</AvatarFallback>
                    </Avatar>
                    Sarah Rose
                  </td>
                  <td className="px-4 py-3">#OLY-2023-002</td>
                  <td className="px-4 py-3">Oct 23, 2023</td>
                  <td className="px-4 py-3 text-foreground font-medium">$25.00</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Success</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* Upcoming Tests */}
        <div className="col-span-1 p-6 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Upcoming Olympiads</h3>
            <button className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground cursor-pointer">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {/* Card 1 */}
            <div className="flex gap-4 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <span className="text-[10px] font-bold uppercase">Oct</span>
                <span className="text-lg font-bold leading-none">28</span>
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">National Math Olympiad</h4>
                <p className="text-xs text-muted-foreground">09:00 AM - 12:00 PM</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] bg-secondary text-foreground px-1.5 py-0.5 rounded-md border-none">Advanced</Badge>
                  <span className="text-[10px] text-muted-foreground">250 Registered</span>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="flex gap-4 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 flex flex-col items-center justify-center shrink-0 border border-pink-500/20 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                <span className="text-[10px] font-bold uppercase">Nov</span>
                <span className="text-lg font-bold leading-none">02</span>
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">Physics Challenge</h4>
                <p className="text-xs text-muted-foreground">10:00 AM - 11:30 AM</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] bg-secondary text-foreground px-1.5 py-0.5 rounded-md border-none">Intermediate</Badge>
                  <span className="text-[10px] text-muted-foreground">120 Registered</span>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="flex gap-4 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex flex-col items-center justify-center shrink-0 border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                <span className="text-[10px] font-bold uppercase">Nov</span>
                <span className="text-lg font-bold leading-none">05</span>
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">General Science Quiz</h4>
                <p className="text-xs text-muted-foreground">02:00 PM - 04:00 PM</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] bg-secondary text-foreground px-1.5 py-0.5 rounded-md border-none">Beginner</Badge>
                  <span className="text-[10px] text-muted-foreground">540 Registered</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full py-2.5 mt-2 text-xs font-bold text-muted-foreground hover:text-foreground border-dashed border-border rounded-lg transition-all hover:border-primary/50 cursor-pointer active:scale-95">
              + Schedule New Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
