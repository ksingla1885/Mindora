import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
    const session = await auth();

    if (!session) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const userId = session.user.id;

    try {
        // 1. Fetch all test attempts for this user
        const attempts = await prisma.testAttempt.findMany({
            where: {
                userId,
                status: 'submitted'
            },
            include: {
                test: {
                    select: {
                        title: true,
                        subject: true,
                        category: true,
                    }
                }
            },
            orderBy: {
                submittedAt: 'desc'
            }
        });

        // 2. Calculate summary stats
        const totalTests = attempts.length;
        const avgScore = totalTests > 0
            ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalTests)
            : 0;

        const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);

        // 3. Subject-wise performance
        const subjectStats = attempts.reduce((acc, a) => {
            const subject = a.test.subject || 'General';
            if (!acc[subject]) {
                acc[subject] = { name: subject, count: 0, totalScore: 0 };
            }
            acc[subject].count++;
            acc[subject].totalScore += (a.score || 0);
            return acc;
        }, {});

        const subjects = Object.values(subjectStats).map(s => ({
            name: s.name,
            avgScore: Math.round(s.totalScore / s.count),
            count: s.count
        }));

        // 4. Performance over time (recent 10 tests)
        const performanceTrend = attempts.slice(0, 10).reverse().map(a => ({
            date: a.submittedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: a.score || 0,
            title: a.test.title
        }));

        // 5. Strengths & Weaknesses
        // Just a simple logic based on subject avg score
        const sortedSubjects = [...subjects].sort((a, b) => b.avgScore - a.avgScore);
        const strengths = sortedSubjects.filter(s => s.avgScore >= 70).map(s => s.name);
        const weaknesses = sortedSubjects.filter(s => s.avgScore < 40).map(s => s.name);

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalTests,
                    avgScore,
                    totalTime,
                    highestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score || 0)) : 0,
                },
                subjects,
                performanceTrend,
                strengths,
                weaknesses,
                recentAttempts: attempts.slice(0, 5)
            }
        });
    } catch (error) {
        console.error('Error fetching student analytics:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
