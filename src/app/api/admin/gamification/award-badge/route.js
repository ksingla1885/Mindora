import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications';

// Award a badge to a user
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, badgeId, reason } = await request.json();

    // Validate required fields
    if (!userId || !badgeId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and badgeId are required' },
        { status: 400 }
      );
    }

    // Check if user and badge exist
    const [user, badge] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.badge.findUnique({ where: { id: badgeId } })
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      );
    }

    // Check if user already has this badge
    const existingBadge = await prisma.userBadge.findFirst({
      where: {
        userId,
        badgeId
      }
    });

    if (existingBadge) {
      return NextResponse.json(
        { 
          error: 'User already has this badge',
          data: existingBadge
        },
        { status: 400 }
      );
    }

    // Award the badge
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        awardedBy: session.user.id,
        reason: reason || 'Awarded by admin',
        isAwarded: true,
        awardedAt: new Date()
      },
      include: {
        badge: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Add XP if the badge has an XP reward
    if (badge.xpReward > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: badge.xpReward }
        }
      });

      // Create XP transaction
      await prisma.xpTransaction.create({
        data: {
          userId,
          amount: badge.xpReward,
          type: 'BADGE_AWARD',
          referenceId: userBadge.id,
          description: `Awarded ${badge.name} badge`
        }
      });
    }

    // Send notification to the user
    await sendNotification({
      userId,
      type: 'BADGE_AWARDED',
      title: 'New Badge Awarded!',
      message: `You've earned the ${badge.name} badge!`,
      data: {
        badgeId: badge.id,
        badgeName: badge.name,
        xpEarned: badge.xpReward || 0
      }
    });

    // Emit WebSocket event for real-time update
    // This assumes you have a WebSocket server set up
    if (process.env.NODE_ENV === 'production') {
      const { broadcastGamificationEvent } = await import('@/lib/websocket/events');
      broadcastGamificationEvent('BADGE_AWARDED', {
        userId,
        badge: {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          xpReward: badge.xpReward
        },
        awardedBy: session.user.id,
        awardedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Badge awarded successfully',
      data: userBadge
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to award badge',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Get all badge awards with filtering
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const badgeId = searchParams.get('badgeId');
    const awardedBy = searchParams.get('awardedBy');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {
      isAwarded: true
    };

    if (userId) where.userId = userId;
    if (badgeId) where.badgeId = badgeId;
    if (awardedBy) where.awardedBy = awardedBy;
    
    if (startDate || endDate) {
      where.awardedAt = {};
      if (startDate) where.awardedAt.gte = new Date(startDate);
      if (endDate) where.awardedAt.lte = new Date(endDate);
    }

    const [awards, total] = await Promise.all([
      prisma.userBadge.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { awardedAt: 'desc' },
        include: {
          badge: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          awardedByUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.userBadge.count({ where })
    ]);

    return NextResponse.json({
      data: awards,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching badge awards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badge awards' },
      { status: 500 }
    );
  }
}
