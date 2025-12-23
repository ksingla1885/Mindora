import { auth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Award, BarChart, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  const userId = session.user.id;

  // 1. Fetch Enrolled Olympiads
  const enrolledOlympiadsData = await prisma.olympiadRegistration.findMany({
    where: { userId },
    include: {
      olympiad: true,
    },
    take: 5,
  });

  const enrolledOlympiads = enrolledOlympiadsData.map(reg => ({
    id: reg.olympiad.id,
    name: reg.olympiad.name,
    progress: 0, // TODO: Calculate real progress based on topic completion
    testDate: reg.olympiad.startDate.toISOString(),
  }));

  // 2. Fetch Upcoming Tests
  const upcomingTestsData = await prisma.test.findMany({
    where: {
      startTime: {
        gte: new Date(),
      },
      isPublished: true,
    },
    orderBy: {
      startTime: 'asc',
    },
    take: 5,
  });

  const upcomingTests = upcomingTestsData.map(test => ({
    id: test.id,
    name: test.title,
    subject: 'General', // Subject relation is on Olympiad or inferred, simplified for now
    date: test.startTime ? test.startTime.toISOString() : new Date().toISOString(),
    duration: test.durationMinutes,
    type: test.isPaid ? 'premium' : 'free',
  }));

  // 3. Fetch Recent Scores
  const recentAttempts = await prisma.testAttempt.findMany({
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

  const recentScores = recentAttempts.map(attempt => ({
    test: attempt.test.title,
    score: attempt.score || 0,
    total: 100, // Assuming 100 for now, or fetch from test.maxScore if added to schema
    date: attempt.submittedAt ? attempt.submittedAt.toISOString() : new Date().toISOString(),
  }));

  // 4. Fetch a "Daily Question" (Random for now)
  const randomQuestion = await prisma.question.findFirst({
    include: { topic: { include: { subject: true } } },
    take: 1,
    skip: Math.floor(Math.random() * 10), // Simple randomization
  });

  const dppProgress = {
    streak: 0, // Placeholder for streak logic
    completed: 0,
    total: 1,
    todayCompleted: false,
    todayQuestion: randomQuestion ? {
      id: randomQuestion.id,
      subject: randomQuestion.topic?.subject?.name || 'General',
      topic: randomQuestion.topic?.name || 'Mixed',
      difficulty: randomQuestion.difficulty || 'medium',
    } : null,
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome back, {session.user?.name?.split(' ')[0] || 'Student'}!</h1>
        <Button asChild>
          <Link href="/practice">Start Practicing</Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Olympiads</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledOlympiads.length}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DPP Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dppProgress.streak} days</div>
            <p className="text-xs text-muted-foreground">Current streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentScores.length > 0
                ? Math.round(recentScores.reduce((sum, test) => sum + (test.score / test.total * 100), 0) / recentScores.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all tests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTests.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Enrolled Olympiads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enrolled Olympiads</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/olympiads">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrolledOlympiads.length > 0 ? (
              enrolledOlympiads.map((olympiad) => (
                <div key={olympiad.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{olympiad.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      Test: {new Date(olympiad.testDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{olympiad.progress}%</span>
                    </div>
                    <Progress value={olympiad.progress} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>You haven't enrolled in any Olympiads yet.</p>
                <Button variant="link" className="mt-2" asChild>
                  <Link href="/olympiads">Browse Olympiads</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Practice Problem */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Practice</CardTitle>
            <div className="text-sm text-muted-foreground">
              {dppProgress.todayCompleted
                ? 'You\'ve completed today\'s DPP! 🎉'
                : 'Complete today\'s question to keep your streak!'}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Streak</span>
                <span className="font-medium">{dppProgress.streak} days</span>
              </div>
              <Progress value={(dppProgress.completed / dppProgress.total) * 100} className="h-2" />
              <div className="text-right text-xs text-muted-foreground">
                {dppProgress.completed} of {dppProgress.total} completed
              </div>
            </div>

            {!dppProgress.todayCompleted && dppProgress.todayQuestion ? (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Today's Question</h4>
                <div className="text-sm text-muted-foreground">
                  <span className="capitalize">{dppProgress.todayQuestion.difficulty}</span> • {dppProgress.todayQuestion.subject} - {dppProgress.todayQuestion.topic}
                </div>
                <Button className="w-full mt-2" asChild>
                  <Link href={`/practice/dpp/${dppProgress.todayQuestion.id}`}>
                    Start Now
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                No practice questions available today.
              </div>
            )}

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/practice/history">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Practice History
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tests */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Tests</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tests">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTests.length > 0 ? (
              <div className="space-y-4">
                {upcomingTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium">{test.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {test.subject} • {test.duration} mins • {test.type === 'premium' ? 'Premium' : 'Free'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(test.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant={test.type === 'premium' ? 'default' : 'outline'} asChild>
                      <Link href={`/tests/${test.id}`}>
                        {test.type === 'premium' ? 'Purchase' : 'View Details'}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No upcoming tests scheduled.</p>
                <Button variant="link" className="mt-2" asChild>
                  <Link href="/practice">Start Practicing</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Scores</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/scores">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentScores.length > 0 ? (
              <div className="space-y-4">
                {recentScores.map((test, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{test.test}</h3>
                      <span className="font-medium">{test.score}/{test.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{new Date(test.date).toLocaleDateString()}</span>
                      <span>{(test.score / test.total * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(test.score / test.total) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No test attempts yet.</p>
                <Button variant="link" className="mt-2" asChild>
                  <Link href="/tests">Take a Test</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
