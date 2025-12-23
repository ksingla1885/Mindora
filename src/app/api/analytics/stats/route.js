import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    let startDate;
    switch (range) {
      case '7d':
        startDate = subDays(new Date(), 7);
        break;
      case '30d':
        startDate = subDays(new Date(), 30);
        break;
      case '90d':
        startDate = subDays(new Date(), 90);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get user's study sessions
    const studySessions = await prisma.studySession.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
        },
      },
      select: {
        duration: true,
      },
    });

    // Calculate total study time in minutes
    const totalStudyTime = studySessions.reduce(
      (total, session) => total + (session.duration || 0),
      0
    );

    // Get completed topics
    const completedTopics = await prisma.learningProgress.count({
      where: {
        userId,
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
        },
      },
    });

    // Get average test scores
    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        finishedAt: {
          not: null,
        },
        startTime: {
          gte: startDate,
        },
      },
      select: {
        score: true,
      },
    });

    const averageScore =
      testAttempts.length > 0
        ? testAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) /
          testAttempts.length
        : 0;

    // Get current streak
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(today, 1));
    let streak = 0;
    let currentDate = today;
    let hasActivity = true;

    while (hasActivity && streak < 365) {
      // Cap at 1 year for safety
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const hasActivityOnDay = await prisma.studySession.findFirst({
        where: {
          userId,
          OR: [
            {
              startTime: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
            {
              endTime: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
          ],
        },
        select: { id: true },
      });

      if (hasActivityOnDay) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        hasActivity = false;
      }
    }

    return NextResponse.json({
      totalStudyTime,
      completedTopics,
      averageScore,
      streak,
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
