import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Helper to check if user is admin
async function isAdmin() {
    const session = await auth();
    return session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
}

export async function GET(request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const subjectId = searchParams.get('subjectId');
        const classLevel = searchParams.get('classLevel');
        const timeRange = searchParams.get('timeRange') || 'all';
        const search = searchParams.get('search') || '';

        const where = {
            user: {
                role: 'STUDENT',
                ...(classLevel && { class: classLevel }),
                ...(search && { name: { contains: search, mode: 'insensitive' } })
            },
            ...(subjectId && { subjectId })
        };

        // If timeRange is not 'all', we would typically filter by submittedAt on TestAttempt
        // but here we are using LeaderboardEntry. We might need to handle timeRange separately
        // depending on how the schema is structured.

        const entries = await prisma.leaderboardEntry.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        class: true,
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
                { lastUpdated: 'asc' }
            ]
        });

        const rankedEntries = entries.map((entry, index) => ({
            ...entry,
            rank: index + 1
        }));

        return NextResponse.json({
            success: true,
            data: rankedEntries
        });
    } catch (error) {
        console.error('Error fetching admin leaderboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { action } = await request.json();

        if (action === 'recalculate') {
            // Logic to recalculate leaderboard from test attempts
            // This is a simplified version - in a real app this might be a background job
            const students = await prisma.user.findMany({
                where: { role: 'STUDENT' }
            });

            for (const student of students) {
                const stats = await prisma.testAttempt.aggregate({
                    where: { userId: student.id, status: 'submitted' },
                    _sum: { score: true },
                    _count: { id: true }
                });

                if (stats._count.id > 0) {
                    const existingOverall = await prisma.leaderboardEntry.findFirst({
                        where: {
                            userId: student.id,
                            subjectId: null
                        }
                    });

                    const totalScore = stats._sum.score || 0;
                    const testCount = stats._count.id;
                    const averageScore = Math.round(totalScore / testCount);

                    await prisma.leaderboardEntry.upsert({
                        where: {
                            id: existingOverall?.id || 'new-overall-entry'
                        },
                        update: {
                            totalScore,
                            testCount,
                            averageScore,
                            lastUpdated: new Date()
                        },
                        create: {
                            userId: student.id,
                            subjectId: null,
                            totalScore,
                            testCount,
                            averageScore,
                            lastUpdated: new Date()
                        }
                    });
                }
            }

            return NextResponse.json({ success: true, message: 'Leaderboard recalculated' });
        }

        if (action === 'reset') {
            await prisma.leaderboardEntry.deleteMany({});
            return NextResponse.json({ success: true, message: 'Leaderboard reset' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in admin leaderboard action:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
