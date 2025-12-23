import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get all rewards or create a new reward
// POST /api/gamification/rewards
// GET /api/gamification/rewards
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

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.xpValue) {
      return NextResponse.json(
        { error: 'Name and XP value are required' },
        { status: 400 }
      );
    }

    // Create the reward
    const reward = await prisma.reward.create({
      data: {
        name: data.name,
        description: data.description || '',
        xpValue: parseInt(data.xpValue, 10),
        icon: data.icon || 'gift',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy: {
          connect: { id: session.user.id },
        },
      },
    });

    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    );
  }
}

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
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit')) || 100;
    const offset = parseInt(searchParams.get('offset')) || 0;

    const where = {};
    if (isActive) {
      where.isActive = isActive === 'true';
    }

    const [rewards, total] = await Promise.all([
      prisma.reward.findMany({
        where,
        include: {
          _count: {
            select: { userRewards: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.reward.count({ where }),
    ]);

    return NextResponse.json({
      rewards,
      total,
      hasMore: offset + rewards.length < total,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
