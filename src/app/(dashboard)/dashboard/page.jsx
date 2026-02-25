import { auth } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/cn';
import {
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Target,
  Trophy,
  Play,
  Bell,
  Search,
  Menu,
  MoreVertical,
  Clock,
  Calendar,
  Crown,
  ChevronRight,
  Zap
} from 'lucide-react';
import { getTodaysDPP } from '@/services/dpp/dpp.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  const userId = session.user.id;

  // Fetch full user data for gamification stats
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      points: true,
      xp: true,
      level: true,
    }
  });

  const userStats = {
    points: dbUser?.points || 0,
    xp: dbUser?.xp || 0,
    level: dbUser?.level || 1,
  };

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
    subject: test.subject || 'General',
    date: test.startTime ? new Date(test.startTime) : new Date(),
    type: test.isPaid ? 'Paid' : 'Free',
  }));

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

  const recentScores = recentAttempts.map(attempt => {
    const details = (attempt.details) || {};
    return {
      test: attempt.test.title,
      score: attempt.score || 0,
      total: 100, // Percentage stored in score
      rank: null,
      date: attempt.submittedAt ? attempt.submittedAt.toISOString() : new Date().toISOString(),
      testId: attempt.test.id,
      attemptId: attempt.id,
    };
  });

  // 4. Fetch DPP for today
  let dppAssignments = [];
  try {
    dppAssignments = await getTodaysDPP(userId);
  } catch (error) {
    console.error("Failed to fetch DPP:", error);
  }

  const completedDPP = dppAssignments.filter(a => a.status === 'COMPLETED').length;
  const totalDPP = dppAssignments.length;
  const dppProgress = totalDPP > 0 ? (completedDPP / totalDPP) * 100 : 0;

  // 5. Statistics
  const totalCompleted = recentAttempts.length;
  const avgScore = totalCompleted > 0
    ? Math.round(recentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalCompleted)
    : 0;

  let totalCorrect = 0;
  let totalAnswered = 0;
  recentAttempts.forEach(a => {
    const d = a.details || {};
    totalCorrect += (d.correctCount || 0);
    totalAnswered += ((d.correctCount || 0) + (d.incorrectCount || 0));
  });
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // 6. Leaderboard Preview
  let globalRank = 0;
  let leaderboardPreview = [];
  try {
    const topAttempts = await prisma.testAttempt.groupBy({
      by: ['userId'],
      where: { status: 'submitted' },
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: 3
    });

    const topUserIds = topAttempts.map(a => a.userId);
    const topUsers = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, name: true, image: true }
    });

    leaderboardPreview = topAttempts.map((a, i) => ({
      rank: i + 1,
      name: topUsers.find(u => u.id === a.userId)?.name || 'Student',
      image: topUsers.find(u => u.id === a.userId)?.image,
      score: a._max.score,
      isYou: a.userId === userId
    }));

    const userBest = await prisma.testAttempt.aggregate({
      where: { userId, status: 'submitted' },
      _max: { score: true }
    });

    if (userBest._max.score !== null) {
      const betterCount = await prisma.testAttempt.groupBy({
        by: ['userId'],
        where: { status: 'submitted', score: { gt: userBest._max.score } }
      }).then(g => g.length);
      globalRank = betterCount + 1;
    }
  } catch (e) {
    console.warn("Leaderboard fetch failed");
  }

  const stats = {
    totalTests: totalCompleted,
    averageScore: avgScore,
    accuracy: accuracy,
    globalRank: globalRank,
    leaderboardPreview
  };

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-8 p-6 lg:p-8">
      {/* Welcome & Gamification Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Welcome back, {session.user?.name?.split(' ')[0] || 'Student'}! 👋</h1>
          <p className="text-[#616f89] dark:text-gray-300">Your preparation journey starts here.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <Trophy className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Level {userStats.level}</span>
            </div>
            <div className="mt-1 w-32 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${(userStats.xp % 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="h-10 w-[1px] bg-border mx-2 hidden md:block"></div>

          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <Zap className="h-4 w-4 text-blue-600 fill-current" />
            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{userStats.points} Points</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:bg-[#1f2937] dark:border-[#333]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-gray-300">Total Tests</p>
            <div className="rounded-full bg-blue-50 p-2 text-primary dark:bg-blue-900/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTests}</p>
            <p className="text-xs font-medium text-[#07883b] flex items-center gap-1 mt-1">
              <TrendingUp className="h-3.5 w-3.5" /> Recent Activity
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:bg-[#1f2937] dark:border-[#333]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-gray-300">Average Score</p>
            <div className="rounded-full bg-purple-50 p-2 text-purple-600 dark:bg-purple-900/20">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}%</p>
            <p className="text-xs font-medium text-[#616f89] flex items-center gap-1 mt-1">
              Test Performance
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:bg-[#1f2937] dark:border-[#333]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-gray-300">Accuracy</p>
            <div className="rounded-full bg-orange-50 p-2 text-orange-600 dark:bg-orange-900/20">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accuracy}%</p>
            <p className="text-xs font-medium text-[#616f89] flex items-center gap-1 mt-1">
              Precision Level
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm hover:shadow-md transition-shadow dark:bg-[#1f2937] dark:border-[#333]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-gray-300">Global Rank</p>
            <div className="rounded-full bg-green-50 p-2 text-green-600 dark:bg-green-900/20">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.globalRank > 0 ? `#${stats.globalRank}` : '-'}</p>
            <p className="text-xs font-medium text-[#616f89] flex items-center gap-1 mt-1">
              {stats.globalRank > 0 ? 'Top Ranked' : 'Start testing'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* DPP Card */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-sm overflow-hidden dark:bg-[#1f2937] dark:border-[#333]">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 flex flex-col justify-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 mb-3 dark:bg-blue-900/40 dark:text-blue-200">
                    <Zap className="h-3 w-3 fill-current" />
                    Daily Practice (DPP)
                  </div>
                  {totalDPP > 0 ? (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Today&apos;s Challenge</h3>
                      <p className="mt-1 text-sm text-[#616f89] dark:text-gray-300">
                        {completedDPP === totalDPP
                          ? "Great job! You've completed all tasks for today."
                          : `${completedDPP}/${totalDPP} problems completed today.`}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-4 w-full bg-gray-100 rounded-full h-2 dark:bg-gray-800">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${dppProgress}%` }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">No Active Challenge</h3>
                      <p className="mt-1 text-sm text-[#616f89] dark:text-gray-300">Set your preferences to get daily problems.</p>
                    </>
                  )}
                </div>

                <Link
                  href="/dpp"
                  className={cn(
                    "flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                    totalDPP > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  )}
                >
                  <Play className="h-[18px] w-[18px] fill-current" />
                  {totalDPP > 0 ? (completedDPP === totalDPP ? "Review Practice" : "Continue Practice") : "Go to DPP Dashboard"}
                </Link>
              </div>
              <div className="h-48 md:h-auto md:w-2/5 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-white/20">
                  <Target className="h-24 w-24" />
                </div>
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10"></div>
                <div className="absolute top-5 left-5 h-10 w-10 text-white/50">
                  <TrendingUp />
                </div>
              </div>
            </div>
          </div>

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
                      <span className="uppercase">{format(test.date, 'MMM')}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{test.name}</h4>
                      <p className="text-sm text-[#616f89] dark:text-gray-300">
                        {format(test.date, 'hh:mm a')} • {test.subject}
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
                    <Link
                      href={`/tests/${test.id}`}
                      className="rounded-lg bg-white border border-[#dbdfe6] px-4 py-2 text-sm font-semibold text-[#111318] hover:bg-gray-50 dark:bg-transparent dark:text-white dark:border-gray-600 dark:hover:bg-gray-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
              {upcomingTests.length === 0 && (
                <div className="p-8 text-center text-muted-foreground italic">No upcoming tests scheduled.</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-foreground">Recent Performance</h3>
            <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Test Name</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentScores.map((score, idx) => (
                      <tr key={idx} className="hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{score.test}</td>
                        <td className="px-6 py-4 text-foreground">
                          <span className="font-bold text-primary">{score.score}%</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/tests/${score.testId}/results/${score.attemptId}`} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                            Analysis <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {recentScores.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground italic">
                          No recent performance data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="flex flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-sm dark:bg-[#1f2937] dark:border-[#333] h-fit">
            <div className="p-4 border-b border-[#e5e7eb] flex items-center justify-between dark:border-[#333]">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-500 h-5 w-5" />
                <h3 className="font-bold text-gray-900 dark:text-white">Leaderboard</h3>
              </div>
              <div className="text-xs font-medium text-[#616f89] bg-[#f0f2f4] px-2 py-1 rounded dark:bg-[#2a3649] dark:text-gray-300">Global</div>
            </div>

            {stats.leaderboardPreview.length > 0 ? (
              <div className="flex flex-col">
                {stats.leaderboardPreview.map((entry) => (
                  <div key={entry.rank} className={cn(
                    "flex items-center justify-between p-4 border-b border-[#e5e7eb] last:border-0 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#252f3e] transition-colors",
                    entry.isYou && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-6 text-center text-xs font-bold",
                        entry.rank === 1 ? "text-yellow-600" : entry.rank === 2 ? "text-gray-400" : "text-amber-600"
                      )}>
                        #{entry.rank}
                      </div>
                      <Avatar className="h-8 w-8 ring-1 ring-border">
                        <AvatarImage src={entry.image} />
                        <AvatarFallback className="text-[10px]">{entry.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                        {entry.isYou ? "You" : entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary">{Math.round(entry.score)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col p-6 items-center justify-center text-center gap-2">
                <div className="h-12 w-12 rounded-full bg-yellow-50 flex items-center justify-center dark:bg-yellow-900/20 mb-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Leaderboard empty</p>
                <p className="text-xs text-[#616f89] dark:text-gray-300">Tests taken will appear here.</p>
              </div>
            )}

            {stats.globalRank > 0 && (
              <div className="mt-1 border-t border-[#e5e7eb] bg-blue-50/50 p-3 rounded-b-xl dark:bg-[#1a2332] dark:border-[#333]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center text-xs font-bold text-primary">#{stats.globalRank}</div>
                    <div className="h-8 w-8 rounded-full bg-primary/20 ring-2 ring-white dark:ring-[#1a2332] flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Your Rank</span>
                  </div>
                  <span className="text-sm font-bold text-primary">Global</span>
                </div>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#135bec] to-[#4f46e5] p-6 text-white shadow-lg">
            <div className="relative z-10 flex flex-col gap-4">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Crown className="text-white h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Unlock Premium</h3>
                <p className="text-sm text-blue-100 mt-1">Get access to professional mock tests and deep analysis.</p>
              </div>
              <Link href="/pricing" className="w-full text-center rounded-lg bg-white py-2.5 text-sm font-bold text-black hover:bg-blue-50 transition-colors">Upgrade Now</Link>
            </div>
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"></div>
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
