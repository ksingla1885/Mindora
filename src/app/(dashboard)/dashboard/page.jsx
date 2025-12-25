import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { cn } from '@/lib/cn';
import {
  AssignmentTurnedIn, // Material: assignment_turned_in 
  TrendingUp, // Material: trending_up
  Analytics, // Material: analytics
  Target, // Material: target
  EmojiEvents, // Material: emoji_events (Trophy)
  PlayArrow, // Material: play_arrow
  Notifications, // Material: notifications
  Search, // Material: search
  Menu, // Material: menu
  CheckCircle,
  BarChart2,
  Trophy,
  ArrowRight,
  Clock,
  Calendar,
  MoreVertical,
  Crown
} from 'lucide-react';
// Lucide doesn't have 1:1 matches for all Material names, so we map them:
import {
  CheckCircle2 as IconAssignmentTurnedIn,
  TrendingUp as IconTrendingUp,
  BarChart as IconAnalytics,
  Crosshair as IconTarget,
  Trophy as IconEmojiEvents,
  Play as IconPlayArrow,
  Bell as IconNotifications,
  Search as IconSearch,
  Menu as IconMenu,
  MoreHorizontal
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  const userId = session.user.id;

  // 1. Fetch Enrolled Olympiads / Subjects
  // 1. Fetch Enrolled Olympiads / Subjects
  let enrolledOlympiadsData = [];
  try {
    enrolledOlympiadsData = await prisma.olympiadRegistration.findMany({
      where: { userId },
      include: {
        olympiad: true,
      },
      take: 5,
    });
  } catch (error) {
    console.warn("Database connection failed, using empty fallback data for enrolled olympiads.");
  }

  // 2. Fetch Upcoming Tests
  // 2. Fetch Upcoming Tests
  let upcomingTestsData = [];
  try {
    upcomingTestsData = await prisma.test.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
        isPublished: true,
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 3,
    });
  } catch (error) {
    console.warn("Database connection failed, using empty fallback data for upcoming tests.");
  }

  const upcomingTests = upcomingTestsData.map(test => ({
    id: test.id,
    name: test.title,
    subject: 'General',
    date: test.startTime ? new Date(test.startTime) : new Date(),
    type: test.isPaid ? 'Paid' : 'Free',
  }));

  // 3. Fetch Recent Scores
  // 3. Fetch Recent Scores
  let recentAttempts = [];
  try {
    recentAttempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        status: 'submitted',
      },
      include: {
        test: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 5,
    });
  } catch (error) {
    console.warn("Database connection failed, using empty fallback data for recent scores.");
  }

  const recentScores = recentAttempts.map(attempt => ({
    test: attempt.test.title,
    score: attempt.score || 0,
    total: 100, // Assuming 100 for now
    rank: 12, // Placeholder
    date: attempt.submittedAt ? attempt.submittedAt.toISOString() : new Date().toISOString(),
  }));

  // Stats Data
  const stats = {
    totalTests: recentAttempts.length,
    averageScore: recentScores.length > 0 ? Math.round(recentScores.reduce((a, b) => a + b.score, 0) / recentScores.length) : 0,
    accuracy: 0,
    globalRank: 0
  };

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-8 p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Welcome back, {session.user?.name?.split(' ')[0] || 'Student'}! 👋</h1>
        <p className="text-[#616f89] dark:text-gray-300">Your preparation journey starts here.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tests */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:bg-[#1f2937] dark:border-[#333]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-gray-300">Total Tests</p>
            <div className="rounded-full bg-blue-50 p-2 text-primary dark:bg-blue-900/20">
              <IconAssignmentTurnedIn className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTests}</p>
            <p className="text-xs font-medium text-[#07883b] flex items-center gap-1 mt-1">
              <IconTrendingUp className="h-3.5 w-3.5" /> 0 this week
            </p>
          </div>
        </div>

        {/* Average Score */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:bg-[#1f2937] dark:border-[#333]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-gray-300">Average Score</p>
            <div className="rounded-full bg-purple-50 p-2 text-purple-600 dark:bg-purple-900/20">
              <IconAnalytics className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}%</p>
            <p className="text-xs font-medium text-[#616f89] flex items-center gap-1 mt-1">
              -
            </p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:bg-[#1f2937] dark:border-[#333]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-gray-300">Accuracy</p>
            <div className="rounded-full bg-orange-50 p-2 text-orange-600 dark:bg-orange-900/20">
              <IconTarget className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accuracy}%</p>
            <p className="text-xs font-medium text-[#616f89] flex items-center gap-1 mt-1">
              -
            </p>
          </div>
        </div>

        {/* Global Rank */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:bg-[#1f2937] dark:border-[#333]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-gray-300">Global Rank</p>
            <div className="rounded-full bg-green-50 p-2 text-green-600 dark:bg-green-900/20">
              <IconEmojiEvents className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.globalRank > 0 ? `#${stats.globalRank}` : '-'}</p>
            <p className="text-xs font-medium text-[#616f89] flex items-center gap-1 mt-1">
              Unranked
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Content) */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* DPP Card */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-sm overflow-hidden dark:bg-[#1f2937] dark:border-[#333]">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 flex flex-col justify-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 mb-3 dark:bg-gray-800 dark:text-gray-300">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                    </span>
                    Daily Practice (DPP)
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Active Challenge</h3>
                  <p className="mt-1 text-sm text-[#616f89] dark:text-gray-300">Check back later for new problems.</p>
                </div>
                <button disabled className="flex w-fit items-center gap-2 rounded-lg bg-gray-300 px-5 py-2.5 text-sm font-semibold text-white cursor-not-allowed dark:bg-gray-700">
                  <IconPlayArrow className="h-[18px] w-[18px]" />
                  Start Practice
                </button>
              </div>
              <div className="h-48 md:h-auto md:w-2/5 bg-cover bg-center bg-gray-100 relative dark:bg-gray-800">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <Target className="h-12 w-12 opacity-20" />
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Tests */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Upcoming Tests</h3>
              <Link href="/tests" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm divide-y divide-border">
              {upcomingTests.map((test) => (
                <div key={test.id} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#252f3e] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30 overflow-hidden leading-tight">
                      <span className="text-sm">{test.date.getDate()}</span>
                      <span className="uppercase">{test.date.toLocaleDateString(undefined, { month: 'short' })}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{test.name}</h4>
                      <p className="text-sm text-[#616f89] dark:text-gray-300">
                        {test.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {test.subject}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                      test.type === 'Free'
                        ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-300"
                    )}>
                      {test.type}
                    </span>
                    <button className="rounded-lg bg-white border border-[#dbdfe6] px-4 py-2 text-sm font-semibold text-[#111318] hover:bg-gray-50 dark:bg-transparent dark:text-white dark:border-gray-600 dark:hover:bg-gray-800">
                      Register
                    </button>
                  </div>
                </div>
              ))}
              {upcomingTests.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No upcoming tests found.</div>
              )}
            </div>
          </div>

          {/* Recent Scores Table */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-foreground">Recent Performance</h3>
            <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium">Test Name</th>
                      <th className="px-6 py-3 font-medium">Score</th>
                      <th className="px-6 py-3 font-medium">Rank</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentScores.map((score, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#252f3e]">
                        <td className="px-6 py-4 font-medium text-foreground">{score.test}</td>
                        <td className="px-6 py-4 text-[#111318] dark:text-gray-300">
                          <span className="font-bold">{score.score}</span>/{score.total}
                        </td>
                        <td className="px-6 py-4 text-[#111318] dark:text-gray-300">#{score.rank}</td>
                        <td className="px-6 py-4 text-right">
                          <a href="#" className="text-primary font-medium hover:underline">View Analysis</a>
                        </td>
                      </tr>
                    ))}
                    {recentScores.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          No recent tests taken.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Leaderboard) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Leaderboard Widget */}
          <div className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm dark:bg-[#1f2937] dark:border-[#333] h-fit">
            <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between dark:border-[#333]">
              <div className="flex items-center gap-2">
                <IconEmojiEvents className="text-yellow-500 h-5 w-5" />
                <h3 className="font-bold text-gray-900 dark:text-white">Leaderboard</h3>
              </div>
              <div className="text-xs font-medium text-[#616f89] bg-[#f0f2f4] px-2 py-1 rounded dark:bg-[#2a3649] dark:text-gray-300">This Week</div>
            </div>

            <div className="flex flex-col p-6 items-center justify-center text-center gap-2">
              <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center dark:bg-yellow-900/20 mb-2">
                <IconEmojiEvents className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Leaderboard currently empty</p>
              <p className="text-xs text-[#616f89] dark:text-gray-300">Complete tests to get ranked!</p>
            </div>

            {/* Sticky User Rank */}
            {stats.globalRank > 0 && (
              <div className="mt-1 border-t border-[#e5e7eb] bg-[#f0f2f4] p-3 rounded-b-xl dark:bg-[#1a2332] dark:border-[#333]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center text-xs font-bold text-primary">#{stats.globalRank}</div>
                    <div className="h-8 w-8 rounded-full bg-primary/20 ring-2 ring-white dark:ring-[#1a2332]" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">You</span>
                  </div>
                  <span className="text-sm font-bold text-primary">0 pts</span>
                </div>
              </div>
            )}
          </div>

          {/* Promo / Upgrade */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#135bec] to-[#4f46e5] p-6 text-white shadow-lg">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Crown className="text-white h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Unlock Premium</h3>
                <p className="text-sm text-blue-100 mt-1">Get access to 50+ advanced mock tests and AI analysis.</p>
              </div>
              <button className="w-full rounded-lg bg-white py-2.5 text-sm font-bold text-black hover:bg-blue-50 transition-colors" suppressHydrationWarning>Upgrade Now</button>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
