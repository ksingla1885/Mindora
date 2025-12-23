import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get all challenges with pagination and filtering
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status === 'active') {
      where.isActive = true;
      where.startDate = { lte: new Date() };
      where.OR = [
        { endDate: null },
        { endDate: { gte: new Date() } }
      ];
    } else if (status === 'upcoming') {
      where.isActive = true;
      where.startDate = { gt: new Date() };
    } else if (status === 'expired') {
      where.OR = [
        { isActive: false },
        { endDate: { lt: new Date() } }
      ];
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          _count: {
            select: { userChallenges: true }
          }
        }
      }),
      prisma.challenge.count({ where })
    ]);

    return NextResponse.json({
      data: challenges,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// Create a new challenge
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.description || !data.type || !data.criteria) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = data.endDate ? new Date(data.endDate) : null;
    
    if (endDate && endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type, // DAILY, WEEKLY, MONTHLY, SPECIAL
        criteria: data.criteria,
        xpReward: data.xpReward || 0,
        badgeRewardId: data.badgeRewardId || null,
        startDate,
        endDate,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
