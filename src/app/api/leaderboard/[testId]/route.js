import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper function to calculate percentile
function calculatePercentile(rank, total) {
  if (total <= 1) return 100;
  return Math.round(((total - rank) / (total - 1)) * 100);
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { testId } = params;
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('pageSize')) || 10;
    const search = searchParams.get('search') || '';
    const timeRange = searchParams.get('timeRange') || 'all';
    const type = searchParams.get('type') || 'overall';
    
    // Calculate date range based on timeRange
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '90d':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null; // All time
    }

    // Base where clause for test attempts
    const whereClause = {
      ...(testId !== 'all' && { testId }),
      ...(startDate && { completedAt: { gte: startDate } }),
      status: 'COMPLETED',
      user: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        })
      }
    };

    // Get total count for pagination
    const total = await prisma.testAttempt.count({
      where: whereClause,
      distinct: ['userId']
    });

    // Get leaderboard data with user information
    const leaderboardData = await prisma.$queryRaw`
      WITH ranked_scores AS (
        SELECT 
          u.id as "userId",
          u.name as "userName",
          u.email as "userEmail",
          u.image as "userImage",
          u.organization as "userOrganization",
          ta.score,
          ta.completedAt as "lastActive",
          ROW_NUMBER() OVER (ORDER BY 
            ${type === 'weekly' ? 
              `SUM(CASE WHEN ta.completedAt >= NOW() - INTERVAL '7 days' THEN ta.score ELSE 0 END) DESC` :
              type === 'monthly' ?
              `SUM(CASE WHEN ta.completedAt >= DATE_TRUNC('month', CURRENT_DATE) THEN ta.score ELSE 0 END) DESC` :
              'ta.score DESC'
            }
          ) as rank,
          COUNT(ta.id) as "testsCompleted",
          AVG(ta.score) as "averageScore",
          AVG(ta.timeSpent) as "averageTimeSpent",
          COUNT(DISTINCT DATE(ta.completedAt)) as "activeDays"
        FROM "User" u
        LEFT JOIN "TestAttempt" ta ON u.id = ta."userId"
        WHERE ${JSON.stringify(whereClause)}
        GROUP BY u.id, ta."userId", u.name, u.email, u.image, u.organization
        HAVING COUNT(ta.id) > 0
        ORDER BY rank
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      )
      SELECT * FROM ranked_scores;
    `;

    // Get current user's rank if not in current page
    let userRank = null;
    if (session.user) {
      const userRankData = await prisma.$queryRaw`
        SELECT * FROM (
          SELECT 
            u.id as "userId",
            ROW_NUMBER() OVER (ORDER BY 
              ${type === 'weekly' ? 
                `SUM(CASE WHEN ta.completedAt >= NOW() - INTERVAL '7 days' THEN ta.score ELSE 0 END) DESC` :
                type === 'monthly' ?
                `SUM(CASE WHEN ta.completedAt >= DATE_TRUNC('month', CURRENT_DATE) THEN ta.score ELSE 0 END) DESC` :
                'ta.score DESC'
              }
            ) as rank,
            COUNT(ta.id) as "testsCompleted"
          FROM "User" u
          LEFT JOIN "TestAttempt" ta ON u.id = ta."userId"
          WHERE ${JSON.stringify(whereClause)}
          GROUP BY u.id
        ) ranked
        WHERE "userId" = ${session.user.id};
      `;

      if (userRankData && userRankData.length > 0) {
        userRank = {
          rank: parseInt(userRankData[0].rank),
          rankDisplay: `#${userRankData[0].rank}`,
          percentile: calculatePercentile(userRankData[0].rank, total),
          totalParticipants: total,
          testsCompleted: parseInt(userRankData[0].testsCompleted),
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image
          }
        };
      }
    }

    // Format response
    const formattedLeaderboard = leaderboardData.map((entry, index) => ({
      rank: parseInt(entry.rank),
      userId: entry.userId,
      user: {
        id: entry.userId,
        name: entry.userName,
        email: entry.userEmail,
        image: entry.userImage,
        organization: entry.userOrganization
      },
      score: Math.round(entry.score * 100) / 100,
      averageScore: Math.round(entry.averageScore * 100) / 100,
      averageTimeSpent: Math.round(entry.averageTimeSpent * 100) / 100,
      testsCompleted: parseInt(entry.testsCompleted),
      lastActive: entry.lastActive,
      activeDays: parseInt(entry.activeDays),
      isCurrentUser: session?.user?.id === entry.userId,
      // Add streak calculation (simplified)
      streak: Math.min(parseInt(entry.activeDays / 3), 30) // Example: 1 point for every 3 active days, max 30
    }));

    return NextResponse.json({
      leaderboard: formattedLeaderboard,
      userRank,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      },
      timeRange,
      type
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
