import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/permissions';

// Get test analytics
// GET /api/analytics/test?testId=...
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view analytics' },
        { status: 401 }
      );
    }

    // Check if user has permission to view analytics
    if (!hasPermission(session.user.role, ['ADMIN', 'INSTRUCTOR'])) {
      return NextResponse.json(
        { error: 'You do not have permission to view this data' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const timeRange = searchParams.get('timeRange') || 'all'; // all, 7d, 30d, 90d, 1y
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate = new Date(0); // Beginning of time
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      // 'all' uses default startDate (beginning of time)
    }

    // Get test analytics
    const testAnalytics = await prisma.testAnalytics.findUnique({
      where: { testId },
      include: {
        questionAnalytics: {
          orderBy: { difficulty: 'desc' },
          include: {
            question: {
              select: {
                id: true,
                question: true,
                options: true,
                correctAnswer: true,
                topicId: true,
              },
            },
          },
        },
      },
    });

    if (!testAnalytics) {
      return NextResponse.json(
        { error: 'Analytics not found for this test' },
        { status: 404 }
      );
    }

    // Get time series data for completion rates and scores
    const timeSeriesData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, "completedAt") as period,
        COUNT(*) as attempts,
        AVG(score) as avg_score,
        AVG("percentScore") as avg_percent_score,
        AVG("timeSpent") as avg_time_spent
      FROM "UserTestAnalytics"
      WHERE "testId" = ${testId}
        AND "completedAt" >= ${startDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    // Get question difficulty distribution
    const difficultyDistribution = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN difficulty < 0.3 THEN 'Hard'
          WHEN difficulty < 0.7 THEN 'Medium'
          ELSE 'Easy'
        END as difficulty_level,
        COUNT(*) as question_count
      FROM "QuestionAnalytics"
      WHERE "testAnalyticsId" = ${testAnalytics.id}
      GROUP BY difficulty_level
    `;

    // Get knowledge gaps (top 5 most missed questions)
    const knowledgeGaps = await prisma.$queryRaw`
      SELECT 
        qa.*,
        (qa."totalAttempts" - qa."correctAttempts") as incorrect_attempts,
        q.question,
        q.options,
        q."correctAnswer"
      FROM "QuestionAnalytics" qa
      JOIN "Question" q ON qa."questionId" = q.id
      WHERE qa."testAnalyticsId" = ${testAnalytics.id}
      ORDER BY (qa."totalAttempts" - qa."correctAttempts") DESC
      LIMIT 5
    `;

    // Get test attempts over time
    const attemptsOverTime = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, "completedAt") as period,
        COUNT(*) as attempts
      FROM "UserTestAnalytics"
      WHERE "testId" = ${testId}
        AND "completedAt" >= ${startDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    // Get score distribution
    const scoreDistribution = await prisma.$queryRaw`
      SELECT 
        FLOOR("percentScore" / 10) * 10 as score_range,
        COUNT(*) as student_count
      FROM "UserTestAnalytics"
      WHERE "testId" = ${testId}
        AND "completedAt" >= ${startDate}
      GROUP BY score_range
      ORDER BY score_range ASC
    `;

    // Format the response
    const response = {
      testId: testAnalytics.testId,
      totalAttempts: testAnalytics.totalAttempts,
      averageScore: testAnalytics.averageScore,
      completionRate: testAnalytics.completionRate,
      averageTimeSpent: testAnalytics.averageTimeSpent,
      timeSeries: timeSeriesData,
      difficultyDistribution,
      knowledgeGaps,
      attemptsOverTime,
      scoreDistribution,
      questionAnalytics: testAnalytics.questionAnalytics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching test analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test analytics' },
      { status: 500 }
    );
  }
}
