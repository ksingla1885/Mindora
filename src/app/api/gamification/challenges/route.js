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
    const date = searchParams.get('date') || new Date();
    
    const challenges = await GamificationService.getDailyChallenges(session.user.id, new Date(date));
    
    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
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
    
    const challenge = await prisma.dailyChallenge.create({
      data: {
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        xpReward: body.xpReward || 0,
        badgeRewardId: body.badgeRewardId,
        subjectId: body.subjectId,
        requiredAction: body.requiredAction,
        requiredValue: body.requiredValue || 1
      }
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
