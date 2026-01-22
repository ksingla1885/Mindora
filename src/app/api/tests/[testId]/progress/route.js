import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { testId } = params;
  const { answers, timeSpent } = await request.json();

  try {
    // Find the in-progress attempt for this user and test
    const attempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'No active test attempt found' },
        { status: 404 }
      );
    }

    // Update or create answers
    const answerUpdates = Object.entries(answers).map(([key, value]) => {
      const questionId = key.replace('question_', '');

      return prisma.testAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId,
          },
        },
        update: {
          answer: value,
          updatedAt: new Date(),
        },
        create: {
          attemptId: attempt.id,
          questionId,
          answer: value,
        },
      });
    });

    // Update the last activity timestamp
    const updateAttempt = prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        lastActivityAt: new Date(),
        timeSpent: timeSpent || 0,
      },
    });

    // Execute all updates in a transaction
    await prisma.$transaction([...answerUpdates, updateAttempt]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
