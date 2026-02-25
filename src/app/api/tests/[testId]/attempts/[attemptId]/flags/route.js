import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// PUT /api/tests/[testId]/attempts/[attemptId]/flags - Update flagged questions
export async function PUT(request, { params }) {
    const { testId, attemptId } = params;
    const session = await auth();

    if (!session) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const { flaggedQuestions } = body;

        if (!flaggedQuestions) {
            return NextResponse.json(
                { success: false, error: 'Missing flaggedQuestions' },
                { status: 400 }
            );
        }

        const attempt = await prisma.testAttempt.update({
            where: {
                id: attemptId,
                testId,
                userId: session.user.id,
            },
            data: {
                metadata: {
                    // If metadata is null, use empty object
                    path: ['metadata'],
                    set: {
                        flaggedQuestions: flaggedQuestions
                    }
                },
                // Also update details for backward compatibility if needed
                details: {
                    path: ['details', 'flaggedQuestions'],
                    set: flaggedQuestions
                }
            }
        });

        // Actually, Prisma Json update syntax is a bit different for deep updates.
        // Simplest is to just update the whole object if we don't care about concurrency on just metadata.

        // Let's first get current attempt to preserve other metadata
        const currentAttempt = await prisma.testAttempt.findUnique({
            where: { id: attemptId },
            select: { metadata: true, details: true }
        });

        const updated = await prisma.testAttempt.update({
            where: { id: attemptId },
            data: {
                metadata: {
                    ...(currentAttempt.metadata || {}),
                    flaggedQuestions
                },
                details: {
                    ...(currentAttempt.details || {}),
                    flaggedQuestions
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Flags updated',
            data: updated
        });

    } catch (error) {
        console.error('Error updating flags:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
