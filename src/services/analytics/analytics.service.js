import prisma from '@/lib/prisma';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';

export const AnalyticsService = {
  // Test performance metrics
  async getTestAnalytics(testId) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        attempts: {
          include: {
            user: true
          }
        },
        questions: {
          include: {
            question: true
          }
        }
      }
    });

    if (!test) return null;

    // Calculate basic statistics
    const scores = test.attempts.map(a => a.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const completionRate = (test.attempts.filter(a => a.finishedAt).length / test.attempts.length) * 100;

    // Question-wise analysis
    const questionStats = await Promise.all(
      test.questions.map(async (tq) => {
        const question = tq.question;
        const attempts = await prisma.testAttempt.findMany({
          where: {
            testId,
            details: {
              path: [tq.questionId],
              not: undefined
            }
          },
          select: {
            details: {
              select: {
                [tq.questionId]: true
              }
            }
          }
        });

        const correctCount = attempts.filter(a => 
          a.details[tq.questionId]?.isCorrect
        ).length;

        return {
          questionId: question.id,
          text: question.text,
          difficulty: question.difficulty,
          totalAttempts: attempts.length,
          correctPercentage: attempts.length > 0 ? (correctCount / attempts.length) * 100 : 0,
          averageTimeSpent: 0 // Would need to track time spent per question
        };
      })
    );

    return {
      testId: test.id,
      title: test.title,
      totalAttempts: test.attempts.length,
      averageScore,
      maxScore,
      minScore,
      completionRate,
      questionStats,
      attemptsOverTime: await this.getAttemptsOverTime(testId),
      scoreDistribution: this.calculateScoreDistribution(scores)
    };
  },

  // Cohort analysis
  async getCohortAnalysis(cohortId) {
    // Implementation for cohort analysis
    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        users: true,
        tests: {
          include: {
            test: true,
            attempts: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    // Calculate cohort metrics
    const metrics = {
      totalStudents: cohort.users.length,
      activeStudents: 0, // Would need to define 'active' criteria
      averageTestScores: {},
      completionRates: {}
    };

    // Calculate test-specific metrics
    for (const test of cohort.tests) {
      const scores = test.attempts.map(a => a.score);
      metrics.averageTestScores[test.testId] = 
        scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      
      metrics.completionRates[test.testId] = 
        (test.attempts.filter(a => a.finishedAt).length / cohort.users.length) * 100;
    }

    return {
      cohortId: cohort.id,
      name: cohort.name,
      ...metrics,
      studentProgress: await this.calculateStudentProgress(cohortId)
    };
  },

  // Helper methods
  async getAttemptsOverTime(testId, timeRange = '7d') {
    const now = new Date();
    let startDate = new Date();
    
    if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === '90d') {
      startDate.setMonth(now.getMonth() - 3);
    }

    const attempts = await prisma.testAttempt.groupBy({
      by: ['createdAt'],
      where: {
        testId,
        createdAt: {
          gte: startDate
        }
      },
      _count: true,
      _avg: {
        score: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return attempts.map(a => ({
      date: a.createdAt,
      count: a._count,
      averageScore: a._avg.score
    }));
  },

  calculateScoreDistribution(scores) {
    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    scores.forEach(score => {
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return distribution;
  },

  async calculateStudentProgress(cohortId) {
    // Implementation to track student progress over time
    return [];
  },

  // User Engagement Metrics
  async getUserEngagementMetrics(dateRange = { from: subDays(new Date(), 30), to: new Date() }) {
    const [totalUsers, activeUsers, newUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: subDays(new Date(), 7)
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        }
      })
    ]);

    // Get daily active users for the last 30 days
    const dailyActiveUsers = await prisma.analyticsEvent.groupBy({
      by: ['createdAt'],
      where: {
        eventType: 'session_start',
        createdAt: {
          gte: subDays(new Date(), 30),
          lte: new Date()
        }
      },
      _count: {
        userId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return {
      totalUsers,
      activeUsers,
      newUsers,
      dailyActiveUsers: dailyActiveUsers.map(item => ({
        date: format(item.createdAt, 'MMM dd'),
        count: item._count.userId
      }))
    };
  },

  // Content Performance Metrics
  async getContentPerformance(dateRange = { from: subDays(new Date(), 30), to: new Date() }) {
    // Most viewed content
    const mostViewedContent = await prisma.contentItem.findMany({
      take: 5,
      orderBy: {
        viewCount: 'desc'
      },
      include: {
        topic: {
          select: {
            name: true,
            subject: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Content completion rates
    const contentCompletion = await prisma.$queryRaw`
      SELECT 
        ci.id,
        ci.title,
        COUNT(DISTINCT cp.userId) as started,
        COUNT(DISTINCT CASE WHEN cp.completedAt IS NOT NULL THEN cp.userId END) as completed,
        ROUND(COUNT(DISTINCT CASE WHEN cp.completedAt IS NOT NULL THEN cp.userId END) * 100.0 / 
              NULLIF(COUNT(DISTINCT cp.userId), 0), 2) as completionRate
      FROM "ContentProgress" cp
      JOIN "ContentItem" ci ON cp.contentItemId = ci.id
      WHERE cp.updatedAt BETWEEN ${dateRange.from} AND ${dateRange.to}
      GROUP BY ci.id, ci.title
      ORDER BY started DESC
      LIMIT 5
    `;

    return {
      mostViewedContent,
      contentCompletion
    };
  },

  // Test Performance Metrics
  async getTestPerformance(dateRange = { from: subDays(new Date(), 30), to: new Date() }) {
    // Test completion rates and average scores
    const testPerformance = await prisma.$queryRaw`
      SELECT 
        t.id,
        t.title,
        COUNT(DISTINCT ta.userId) as totalAttempts,
        COUNT(DISTINCT CASE WHEN ta.finishedAt IS NOT NULL THEN ta.userId END) as completedAttempts,
        ROUND(AVG(ta.score), 2) as averageScore,
        ROUND(COUNT(DISTINCT CASE WHEN ta.finishedAt IS NOT NULL THEN ta.userId END) * 100.0 / 
              NULLIF(COUNT(DISTINCT ta.userId), 0), 2) as completionRate
      FROM "Test" t
      LEFT JOIN "TestAttempt" ta ON t.id = ta.testId
      WHERE ta.createdAt BETWEEN ${dateRange.from} AND ${dateRange.to}
      GROUP BY t.id, t.title
      ORDER BY totalAttempts DESC
    `;

    // Question difficulty analysis
    const questionDifficulty = await prisma.$queryRaw`
      SELECT 
        q.difficulty,
        COUNT(*) as totalQuestions,
        ROUND(AVG(CASE WHEN tq.correctCount > 0 THEN tq.correctCount::float / tq.totalAttempts * 100 ELSE 0 END), 2) as avgSuccessRate
      FROM "Question" q
      LEFT JOIN (
        SELECT 
          questionId,
          COUNT(*) as totalAttempts,
          SUM(CASE WHEN (ta.details->>questionId)::json->>'isCorrect' = 'true' THEN 1 ELSE 0 END) as correctCount
        FROM "TestAttempt" ta,
        jsonb_each(ta.details) as d
        WHERE ta.createdAt BETWEEN ${dateRange.from} AND ${dateRange.to}
        GROUP BY questionId
      ) tq ON q.id = tq.questionId
      GROUP BY q.difficulty
    `;

    return {
      testPerformance,
      questionDifficulty
    };
  },

  // User Progress Tracking
  async getUserProgress(userId) {
    const [completedTests, completedContent, timeSpent] = await Promise.all([
      // Completed tests
      prisma.testAttempt.count({
        where: {
          userId,
          finishedAt: { not: null }
        }
      }),
      // Completed content items
      prisma.contentProgress.count({
        where: {
          userId,
          completedAt: { not: null }
        }
      }),
      // Total time spent (in minutes)
      prisma.analyticsEvent.aggregate({
        where: {
          userId,
          eventType: 'content_view',
          metadata: {
            path: ['duration'],
            gt: 0
          }
        },
        _sum: {
          numericValue: true
        }
      })
    ]);

    // Get progress over time
    const progressData = await prisma.$queryRaw`
      SELECT 
        date_trunc('day', "createdAt") as date,
        COUNT(DISTINCT id) as activities
      FROM "AnalyticsEvent"
      WHERE "userId" = ${userId}
        AND "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date
    `;

    return {
      completedTests,
      completedContent,
      timeSpentMinutes: Math.round((timeSpent._sum.numericValue || 0) / 60),
      progressData: progressData.map(item => ({
        date: format(new Date(item.date), 'MMM dd'),
        count: Number(item.activities)
      }))
    };
  },

  // Helper: Get date range data for charts
  async getDateRangeData(eventType, dateRange, groupBy = 'day') {
    const startDate = startOfDay(new Date(dateRange.from));
    const endDate = endOfDay(new Date(dateRange.to));
    
    // Generate all dates in the range
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Get data from database
    const result = await prisma.analyticsEvent.groupBy({
      by: ['createdAt'],
      where: {
        eventType,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true,
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format data for charts
    const dataMap = new Map(
      result.map(item => [
        format(new Date(item.createdAt), 'yyyy-MM-dd'),
        item._count
      ])
    );

    // Fill in missing dates with 0
    return allDates.map(date => ({
      date: format(date, 'MMM dd'),
      count: dataMap.get(format(date, 'yyyy-MM-dd')) || 0
    }));
  }
};

export default AnalyticsService;
