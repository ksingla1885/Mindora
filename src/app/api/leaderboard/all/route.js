import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    try {
        const where = { status: 'submitted' };

        // Add time range filter
        if (timeRange !== 'all') {
            const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 0;
            if (days > 0) {
                const date = new Date();
                date.setDate(date.getDate() - days);
                where.submittedAt = { gte: date };
            }
        }

        // This is a complex query to get user best scores across all tests
        // Group by userId and get the average score and total time spent
        const leaderboardRaw = await prisma.testAttempt.groupBy({
            by: ['userId'],
            where,
            _avg: {
                score: true,
            },
            _sum: {
                timeSpentSeconds: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _avg: {
                    score: 'desc',
                },
            },
            take: limit,
            skip: skip,
        });

        // Fetch user details for the top students
        const userIds = leaderboardRaw.map(l => l.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                image: true,
            }
        });

        const leaderboard = leaderboardRaw.map((l, index) => {
            const user = users.find(u => u.id === l.userId);
            return {
                rank: skip + index + 1,
                userId: l.userId,
                name: user?.name || 'Anonymous',
                image: user?.image,
                score: Math.round(l._avg.score || 0),
                timeSpent: l._sum.timeSpentSeconds || 0,
                testCount: l._count.id,
                isCurrentUser: session?.user?.id === l.userId,
            };
        });

        // Get current user's rank if not in the list
        let currentUserRank = null;
        if (session?.user?.id) {
            // Simple way to get user rank: count people with better average score
            const userStats = await prisma.testAttempt.aggregate({
                where: { ...where, userId: session.user.id },
                _avg: { score: true },
                _sum: { timeSpentSeconds: true }
            });

            if (userStats._avg.score !== null) {
                const betterUsers = await prisma.testAttempt.groupBy({
                    by: ['userId'],
                    where: { ...where },
                    _avg: { score: true },
                    having: {
                        score: {
                            _avg: { gt: userStats._avg.score }
                        }
                    }
                });

                currentUserRank = {
                    rank: betterUsers.length + 1,
                    score: Math.round(userStats._avg.score),
                    timeSpent: userStats._sum.timeSpentSeconds || 0
                };
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                leaderboard,
                currentUserRank,
                pagination: {
                    page,
                    limit,
                }
            },
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
