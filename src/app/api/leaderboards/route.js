import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const classLevel = searchParams.get('class');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Get current user for personal ranking
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Base query conditions
    const where = {
      user: {
        role: 'STUDENT',
        ...(classLevel && { class: classLevel })
      },
      ...(subjectId && { subjectId })
    };

    // Get leaderboard data with user details
    const leaderboardData = await prisma.leaderboardEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            class: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { totalScore: 'desc' },
        { lastUpdated: 'asc' } // Earlier submission breaks ties
      ],
      take: limit,
      skip: offset
    });

    // Get current user's rank if logged in
    let userRank = null;
    let userEntry = null;
    
    if (currentUserId) {
      // Get user's entry
      userEntry = await prisma.leaderboardEntry.findFirst({
        where: {
          ...where,
          userId: currentUserId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              class: true
            }
          },
          subject: subjectId ? {
            select: {
              id: true,
              name: true
            }
          } : undefined
        }
      });

      // Get user's rank
      if (userEntry) {
        const higherScorers = await prisma.leaderboardEntry.count({
          where: {
            ...where,
            OR: [
              { totalScore: { gt: userEntry.totalScore } },
              { 
                AND: [
                  { totalScore: userEntry.totalScore },
                  { lastUpdated: { lt: userEntry.lastUpdated } }
                ]
              }
            ]
          }
        });
        
        userRank = higherScorers + 1;
      }
    }

    // Get total number of entries for pagination
    const totalEntries = await prisma.leaderboardEntry.count({ where });

    // Get subjects for filter dropdown
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      leaderboard: leaderboardData.map((entry, index) => ({
        ...entry,
        rank: offset + index + 1,
        isCurrentUser: entry.userId === currentUserId
      })),
      userRank: {
        ...userEntry,
        rank: userRank,
        isCurrentUser: true
      },
      pagination: {
        total: totalEntries,
        limit,
        offset,
        hasMore: offset + limit < totalEntries
      },
      filters: {
        subjects,
        selectedSubject: subjectId ? subjects.find(s => s.id === subjectId) : null,
        classLevels: ['6', '7', '8', '9', '10', '11', '12'],
        selectedClass: classLevel
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
