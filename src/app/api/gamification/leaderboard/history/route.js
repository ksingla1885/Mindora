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
    const timeRange = searchParams.get('timeRange') || 'weekly';
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Calculate date range based on timeRange
    let startDate = new Date();
    let endDate = new Date();
    
    switch (timeRange) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 90); // Last 12-13 weeks
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
        break;
      default:
        startDate.setDate(startDate.getDate() - 30); // Default to 30 days
    }

    // Fetch historical snapshots
    const snapshots = await prisma.leaderboardSnapshot.findMany({
      where: {
        type: timeRange,
        endDate: { lte: endDate },
        startDate: { gte: startDate },
      },
      orderBy: { endDate: 'desc' },
      skip: offset,
      take: limit,
      include: {
        topPerformers: {
          take: 3,
          orderBy: { position: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedSnapshots = snapshots.map(snapshot => ({
      id: snapshot.id,
      timeRange: snapshot.type,
      startDate: snapshot.startDate,
      endDate: snapshot.endDate,
      totalParticipants: snapshot.totalParticipants,
      topPerformers: snapshot.topPerformers.map(entry => ({
        id: entry.user.id,
        name: entry.user.name,
        image: entry.user.image,
        position: entry.position,
        totalXp: entry.totalXp,
      })),
    }));

    return NextResponse.json(formattedSnapshots);
  } catch (error) {
    console.error('Error fetching leaderboard history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard history' },
      { status: 500 }
    );
  }
}
