import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function GET(request) {
    try {
        const session = await auth();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 5;

        const where = {
            startTime: {
                gt: new Date(),
            },
            isPublished: true,
        };

        // Filter by user's class if student
        if (session?.user?.role === 'STUDENT' && session?.user?.class) {
            where.class = session.user.class;
        }

        const tests = await prisma.test.findMany({
            where,
            include: {
                subject: {
                    select: {
                        name: true,
                    },
                },
                _count: {
                    select: {
                        attempts: true,
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            tests,
        });
    } catch (error) {
        console.error('Error fetching upcoming tests:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch upcoming tests' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
