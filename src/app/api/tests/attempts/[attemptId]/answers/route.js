import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { attemptId } = params;
    const { answers } = await request.json();

    // Validate request body
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Get the attempt with test details
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          select: {
            id: true,
            durationMinutes: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    // Check if attempt exists and belongs to the user
    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    // Check if test is still active
    const now = new Date();
    const endTime = new Date(attempt.startedAt);
    endTime.setMinutes(endTime.getMinutes() + attempt.test.durationMinutes);

    if (attempt.status === 'COMPLETED' || now > endTime) {
      return NextResponse.json(
        { error: 'Test attempt has already ended' },
        { status: 400 }
      );
    }

    // Update or create answers
    const updatedAnswers = await prisma.$transaction(
      Object.entries(answers).map(([questionId, answer]) =>
        prisma.testAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId,
            },
          },
          update: {
            answer: answer.answer,
            isMarkedForReview: answer.isMarkedForReview || false,
          },
          create: {
            attemptId,
            questionId,
            answer: answer.answer,
            isMarkedForReview: answer.isMarkedForReview || false,
          },
        })
      )
    );

    // Update the last saved timestamp
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { lastSavedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: updatedAnswers,
    });

  } catch (error) {
    console.error('Error saving test answers:', error);
    return NextResponse.json(
      { error: 'Failed to save test answers' },
      { status: 500 }
    );
  }
}
