import prisma from './prisma';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

// Helper function to get date range based on period
export function getDateRange(period = 'month') {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'week':
      startDate = startOfDay(subDays(now, 7));
      endDate = endOfDay(now);
      break;
    case 'year':
      startDate = startOfDay(new Date(now.getFullYear(), 0, 1));
      endDate = endOfDay(now);
      break;
    case 'month':
    default:
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
  }

  return { startDate, endDate };
}

// Get dashboard overview statistics
export async function getDashboardOverview() {
  const { startDate, endDate } = getDateRange('month');

  const [
    totalStudents,
    activeTestsCount,
    totalContent,
    testAttemptsAggregate,
    newStudents,
    recentActivity,
    subjectDistribution,
    testPerformance,
    revenueToday,
    totalUsersCount,
    totalTestAttempts,
  ] = await Promise.all([
    // Total students count
    prisma.user.count({
      where: { role: 'STUDENT' },
    }),

    // Active tests (scheduled but not ended)
    prisma.test.count({
      where: {
        startTime: { lte: new Date() },
        endTime: { gte: new Date() },
      },
    }),

    // Total content items
    prisma.contentItem.count(),

    // Test attempts and average score for the current month
    prisma.testAttempt.aggregate({
      where: {
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
      _avg: { score: true },
    }),

    // New students in the current month
    prisma.user.count({
      where: {
        role: 'STUDENT',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),

    // Recent activity
    prisma.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: subDays(new Date(), 7),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    // Subject distribution
    prisma.subject.findMany({
      include: {
        _count: {
          select: { topics: true },
        },
      },
    }),

    // Test performance data
    prisma.test.findMany({
      where: {
        endTime: {
          lt: new Date(),
        },
      },
      orderBy: {
        endTime: 'desc',
      },
      take: 5,
      include: {
        _count: {
          select: { attempts: true },
        },
        attempts: {
          select: {
            score: true,
            status: true,
            submittedAt: true,
          },
          where: {
            submittedAt: {
              not: null,
            },
          },
        },
      },
    }),

    // Revenue Today
    prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfDay(new Date()),
          lte: endOfDay(new Date()),
        },
      },
      _sum: {
        amount: true,
      },
    }),

    // Total Users count (excluding ADMIN)
    prisma.user.count({
      where: {
        role: { not: 'ADMIN' }
      }
    }),

    // TOTAL Test Attempts (ever)
    prisma.testAttempt.count(),
  ]);

  // Process subject distribution
  const formattedSubjectDistribution = (subjectDistribution || []).map((subject) => ({
    name: subject.name,
    value: subject._count?.topics || 0,
  }));

  // Process test performance
  const formattedTestPerformance = (testPerformance || []).map((test) => {
    const completedAttempts = test.attempts ? test.attempts.filter(a => 
      (a.status === 'completed' || a.status === 'submitted') && a.submittedAt
    ) : [];
    
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length
      : 0;

    return {
      id: test.id,
      name: test.title,
      attempts: test._count?.attempts || 0,
      avgScore: Math.round(avgScore * 10) / 10,
      completionRate: (test._count?.attempts || 0) > 0
        ? Math.round((completedAttempts.length / test._count.attempts) * 100)
        : 0,
    };
  });

  // Process recent activity
  const formattedActivity = recentActivity.map((activity) => ({
    id: activity.id,
    user: activity.user ? {
      id: activity.user.id,
      name: activity.user.name || activity.user.email.split('@')[0],
      email: activity.user.email,
    } : null,
    action: activity.eventType,
    details: activity.metadata || {},
    timestamp: activity.createdAt,
    timeAgo: formatDistanceToNow(activity.createdAt, { addSuffix: true }),
  }));

  // Get monthly data for charts
  const monthlyData = await getMonthlyAnalytics();

  return {
    stats: {
      totalUsers: totalUsersCount,
      totalStudents: totalStudents,
      activeTests: activeTestsCount,
      totalContent,
      avgTestScore: Math.round((testAttemptsAggregate._avg.score || 0) * 10) / 10,
      newStudentsThisMonth: newStudents,
      testsCompleted: totalTestAttempts,
      testsThisMonth: testAttemptsAggregate._count,
      revenueToday: revenueToday._sum.amount || 0,
    },
    recentActivity: formattedActivity,
    performanceData: monthlyData,
    testPerformance: formattedTestPerformance,
    subjectDistribution: formattedSubjectDistribution,
  };
}

// Get monthly analytics data for charts
async function getMonthlyAnalytics(months = 6) {
  const endDate = endOfMonth(new Date());
  const startDate = startOfMonth(subDays(endDate, 30 * (months - 1)));

  try {
    // Get all months in range
    const monthsInRange = eachDayOfInterval({
      start: startDate,
      end: endDate,
    }).filter((date) => date.getDate() === 1);

    // Fetch users created in the range
    const usersInRange = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Fetch test attempts in the range
    const testAttemptsInRange = await prisma.testAttempt.findMany({
      where: {
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        startedAt: true,
      },
    });

    // Group the data by month in memory
    return monthsInRange.map((monthDate) => {
      const monthLabel = format(monthDate, 'MMM yyyy');
      
      const newUsers = usersInRange.filter(u => 
        format(new Date(u.createdAt), 'MMM yyyy') === monthLabel
      ).length;
      
      const testAttempts = testAttemptsInRange.filter(t => 
        format(new Date(t.startedAt), 'MMM yyyy') === monthLabel
      ).length;

      return {
        name: monthLabel,
        students: newUsers,
        tests: testAttempts,
      };
    });
  } catch (error) {
    console.error('Error in getMonthlyAnalytics:', error);
    return [];
  }
}

// Helper function to format time ago
function formatDistanceToNow(date, options = {}) {
  const now = new Date();
  const seconds = Math.floor((now - new Date(date)) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

// Get user activity logs
export async function getUserActivity(userId, limit = 10) {
  return prisma.analyticsEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

// Get system-wide statistics
export async function getSystemStats() {
  const [
    totalUsers,
    totalTests,
    totalQuestions,
    totalContentItems,
    recentSignups,
    recentTestAttempts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.test.count(),
    prisma.question.count(),
    prisma.contentItem.count(),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.testAttempt.findMany({
      where: {
        submittedAt: {
          not: null,
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 5,
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    totalUsers,
    totalTests,
    totalQuestions,
    totalContentItems,
    recentSignups,
    recentTestAttempts,
  };
}
