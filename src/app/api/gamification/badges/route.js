import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { GamificationService } from '@/services/gamification/GamificationService';

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
    const category = searchParams.get('category');
    const userId = searchParams.get('userId') || session.user.id;

    const badges = await prisma.badge.findMany({
      where: category ? { category } : {},
      include: {
        userBadges: {
          where: { userId },
          select: {
            earnedAt: true,
            progress: true,
            isUnlocked: true
          }
        }
      }
    });

    // Transform the data to include user progress
    const badgesWithProgress = badges.map(badge => ({
      ...badge,
      userProgress: badge.userBadges[0] || null,
      userBadges: undefined // Remove the array
    }));

    return NextResponse.json({ badges: badgesWithProgress });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const badge = await prisma.badge.create({
      data: {
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        category: body.category,
        tier: body.tier || 1,
        requiredValue: body.requiredValue,
        subjectId: body.subjectId
      }
    });

    return NextResponse.json({ badge });
  } catch (error) {
    console.error('Error creating badge:', error);
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    );
  }
}
