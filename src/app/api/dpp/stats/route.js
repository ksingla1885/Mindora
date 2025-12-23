import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's current streak and max streak
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        dppCurrentStreak: true,
        dppMaxStreak: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get start and end of current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get completed DPPs count for current week
    const completedThisWeek = await prisma.dPPAssignment.count({
      where: {
        userId: session.user.id,
        completedAt: {
          gte: startOfWeek,
          lt: endOfWeek
        }
      }
    });

    // Get total completed DPPs
    const totalCompleted = await prisma.dPPAssignment.count({
      where: {
        userId: session.user.id,
        completedAt: { not: null }
      }
    });

    return NextResponse.json({
      currentStreak: user.dppCurrentStreak || 0,
      maxStreak: user.dppMaxStreak || 0,
      completedThisWeek,
      totalCompleted,
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString()
    });

  } catch (error) {
    console.error('Error fetching DPP stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DPP statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
