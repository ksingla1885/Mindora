import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/leaderboard/[testId]
 * Returns the leaderboard for a specific test or all tests.
 * Query params: 
 * - timeRange: all, 7d, 30d
 * - page: number
 * - limit: number
 */
export async function GET(request, { params }) {
  const { testId } = params;
  const session = await auth();
  const { searchParams } = new URL(request.url);

  const timeRange = searchParams.get('timeRange') || 'all';
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 20;
  const skip = (page - 1) * limit;

  try {
    const now = new Date();
    let dateFilter = {};
    if (timeRange === '7d') {
      dateFilter = { finishedAt: { gte: new Date(now.setDate(now.getDate() - 7)) } };
    } else if (timeRange === '30d') {
      dateFilter = { finishedAt: { gte: new Date(now.setMonth(now.getMonth() - 1)) } };
    }

    // Common filter
    const where = {
      status: 'submitted',
      finishedAt: { not: null },
      ...(testId !== 'all' && { testId }),
      ...dateFilter,
    };

    // Calculate leaderboard
    // We want the best attempt per user if multiple attempts allowed
    // For simplicity in SQL/ORM, we'll group by userId

    const totalParticipants = await prisma.testAttempt.groupBy({
      by: ['userId'],
      where,
      _count: { userId: true },
    }).then(groups => groups.length);

    // Get top attempts
    // This is tricky with Prisma ORM alone to get "best attempt per user" with user info in one go
    // We'll fetch the best attempts and then join user data

    const rawLeaderboard = await prisma.testAttempt.groupBy({
      by: ['userId'],
      where,
      _max: {
        score: true,
      },
      _min: {
        timeSpentSeconds: true,
      },
      orderBy: [
        { _max: { score: 'desc' } },
        { _min: { timeSpentSeconds: 'asc' } }
      ],
      take: limit,
      skip: skip,
    });

    // Fetch user details for these users
    const userIds = rawLeaderboard.map(entry => entry.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true, class: true }
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const leaderboard = rawLeaderboard.map((entry, index) => ({
      rank: skip + index + 1,
      userId: entry.userId,
      name: userMap[entry.userId]?.name || 'Anonymous User',
      image: userMap[entry.userId]?.image,
      class: userMap[entry.userId]?.class,
      score: entry._max.score || 0,
      timeSpent: entry._min.timeSpentSeconds || 0,
      isCurrentUser: session?.user?.id === entry.userId,
    }));

    // Find current user's rank
    let currentUserRank = null;
    if (session?.user?.id) {
      // To find rank, we can count how many users have a better score
      const userBestAttempt = await prisma.testAttempt.aggregate({
        where: { ...where, userId: session.user.id },
        _max: { score: true },
        _min: { timeSpentSeconds: true }
      });

      if (userBestAttempt._max.score !== null) {
        const betterUsersCount = await prisma.testAttempt.groupBy({
          by: ['userId'],
          where: {
            ...where,
            OR: [
              { score: { gt: userBestAttempt._max.score } },
              {
                score: userBestAttempt._max.score,
                timeSpentSeconds: { lt: userBestAttempt._min.timeSpentSeconds }
              }
            ]
          },
          _count: { userId: true }
        }).then(groups => groups.length);

        currentUserRank = {
          rank: betterUsersCount + 1,
          score: userBestAttempt._max.score,
          timeSpent: userBestAttempt._min.timeSpentSeconds,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        currentUserRank,
        pagination: {
          total: totalParticipants,
          page,
          limit,
          totalPages: Math.ceil(totalParticipants / limit)
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
