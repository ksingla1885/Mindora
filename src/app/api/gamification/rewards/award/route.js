import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { userId, rewardId, message } = await request.json();
    
    // Validate required fields
    if (!userId || !rewardId) {
      return NextResponse.json(
        { error: 'User ID and Reward ID are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if reward exists and is active
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId, isActive: true },
    });

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found or inactive' },
        { status: 404 }
      );
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Create user reward assignment
      const userReward = await prisma.userReward.create({
        data: {
          userId,
          rewardId,
          awardedBy: session.user.id,
          message: message || '',
        },
        include: {
          reward: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              xp: true,
            },
          },
        },
      });

      // Update user's XP
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: reward.xpValue,
          },
        },
      });

      // Create a notification for the user
      await prisma.notification.create({
        data: {
          userId,
          type: 'REWARD_AWARDED',
          title: 'New Reward!',
          message: `You've been awarded the ${reward.name} reward!`,
          data: {
            rewardId: reward.id,
            xpAwarded: reward.xpValue,
          },
        },
      });

      // Create an activity log entry
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'REWARD_AWARDED',
          targetType: 'USER',
          targetId: userId,
          metadata: {
            rewardId: reward.id,
            rewardName: reward.name,
            xpAwarded: reward.xpValue,
          },
        },
      });

      return userReward;
    });

    // TODO: Send email notification to the user (optional)
    // await sendRewardNotificationEmail(result.user, result.reward);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error awarding reward:', error);
    return NextResponse.json(
      { error: 'Failed to award reward' },
      { status: 500 }
    );
  }
}

// Get user's rewards
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
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Check if the requested user is the same as the logged-in user or if admin
    if (userId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    // Get user rewards with pagination
    const [userRewards, total] = await Promise.all([
      prisma.userReward.findMany({
        where: { userId },
        include: {
          reward: true,
          awardedByUser: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { awardedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.userReward.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      rewards: userRewards,
      total,
      hasMore: offset + userRewards.length < total,
    });
  } catch (error) {
    console.error('Error fetching user rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rewards' },
      { status: 500 }
    );
  }
}
