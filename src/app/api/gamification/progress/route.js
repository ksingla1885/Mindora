import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Get user stats
    const [user, stats, badges, recentActivity] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          class: true,
          xp: true,
          level: true,
          currentStreak: true,
          longestStreak: true,
          lastActiveDate: true,
          createdAt: true
        }
      }),
      prisma.userStats.upsert({
        where: { userId },
        create: { userId },
        update: {},
      }),
      prisma.userBadge.findMany({
        where: { 
          userId,
          isUnlocked: true 
        },
        include: {
          badge: true
        },
        orderBy: {
          earnedAt: 'desc'
        },
        take: 5
      }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    // Calculate XP for next level
    const xpForNextLevel = Math.floor(100 * Math.pow(1.5, user.level - 1));
    const xpForCurrentLevel = user.level > 1 ? 
      Math.floor(100 * Math.pow(1.5, user.level - 2)) : 0;
    const xpProgress = user.xp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const levelProgress = (xpProgress / xpNeeded) * 100;

    // Calculate streak info
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    const isStreakActive = lastActive && 
      (lastActive.getTime() === today.getTime() ||
       (lastActive.getTime() === today.getTime() - 86400000 && 
        new Date().getHours() < 4)); // Allow until 4 AM next day

    // Get leaderboard ranks
    const [overallRank, subjectRanks] = await Promise.all([
      prisma.$queryRaw`
        SELECT COUNT(*) + 1 as rank
        FROM "User" u
        WHERE u.role = 'STUDENT' AND u.xp > ${user.xp}
      `,
      prisma.leaderboardEntry.findMany({
        where: { userId },
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    ]);

    const progress = {
      user: {
        ...user,
        levelProgress: Math.min(100, Math.max(0, levelProgress)),
        xpForNextLevel,
        xpForCurrentLevel,
        xpProgress,
        xpNeeded,
        isStreakActive
      },
      stats: {
        ...stats,
        accuracy: stats.totalQuestionsAttempted > 0 
          ? Math.round((stats.correctAnswers / stats.totalQuestionsAttempted) * 100) 
          : 0,
        averageScore: stats.testsCompleted > 0
          ? Math.round(stats.totalScore / stats.testsCompleted)
          : 0
      },
      badges: {
        total: badges.length,
        recent: badges.slice(0, 5)
      },
      ranks: {
        overall: parseInt(overallRank[0]?.rank) || 0,
        subjects: subjectRanks.map(entry => ({
          subject: entry.subject,
          rank: 0, // This would need to be calculated based on position
          score: entry.totalScore,
          tests: entry.testCount
        }))
      },
      recentActivity
    };

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, data } = await request.json();
    
    switch (action) {
      case 'updateStats':
        const { stats } = data;
        await prisma.userStats.upsert({
          where: { userId: session.user.id },
          update: stats,
          create: { userId: session.user.id, ...stats }
        });
        return NextResponse.json({ success: true });

      case 'logActivity':
        const { type, subjectId, details } = data;
        await prisma.activityLog.create({
          data: {
            userId: session.user.id,
            type,
            subjectId,
            details: details || {},
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
          }
        });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
