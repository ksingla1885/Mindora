import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    await getServerSession(authOptions); // Just to check auth, we don't need the session
    
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const classLevel = searchParams.get('classLevel');
    const timeRange = searchParams.get('timeRange') || 'all_time'; // daily, weekly, monthly, all_time
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // For time-based leaderboards, we'll use snapshots
    if (timeRange !== 'all_time') {
      const snapshot = await prisma.leaderboardSnapshot.findFirst({
        where: {
          type: timeRange,
          subjectId: subjectId || null,
          classLevel: classLevel || null,
          endDate: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });

      if (snapshot) {
        // Return paginated results from the snapshot
        const data = JSON.parse(JSON.stringify(snapshot.data));
        const paginatedData = data.slice(offset, offset + limit);
        
        return NextResponse.json({
          leaderboard: paginatedData,
          total: data.length,
          timeRange,
          updatedAt: snapshot.createdAt
        });
      }
    }

    // For all_time or if no snapshot exists, query live data
    const where = {
      user: {
        role: 'STUDENT',
        ...(classLevel && { class: classLevel })
      },
      ...(subjectId && { subjectId })
    };

    const [entries, total] = await Promise.all([
      prisma.leaderboardEntry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              class: true,
              level: true
            }
          },
          subject: subjectId ? {
            select: {
              id: true,
              name: true
            }
          } : false
        },
        orderBy: [
          { totalScore: 'desc' },
          { lastUpdated: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.leaderboardEntry.count({ where })
    ]);

    // Add ranks
    const rankedEntries = entries.map((entry, index) => ({
      ...entry,
      rank: offset + index + 1
    }));

    return NextResponse.json({
      leaderboard: rankedEntries,
      total,
      timeRange: 'all_time',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
