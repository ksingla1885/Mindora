import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { attemptId } = await params;

    const attempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId,
        userId: session.user.id,
      },
      include: {
        test: {
          include: {
            testQuestions: {
              include: {
                question: true,
              },
              orderBy: {
                sequence: 'asc',
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // If test is already submitted, return the result
    if (attempt.status === 'submitted' || attempt.status === 'graded') {
      return NextResponse.json({
        attempt: {
          id: attempt.id,
          status: attempt.status,
          score: attempt.score,
          maxScore: attempt.metadata?.maxScore || 0,
          submittedAt: attempt.submittedAt,
          finishedAt: attempt.finishedAt,
          test: {
            id: attempt.test.id,
            title: attempt.test.title,
          },
        },
      });
    }

    // For in-progress attempts, return the test data
    return NextResponse.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        answers: attempt.answers || {},
        currentQuestionIndex: attempt.metadata?.currentQuestionIndex || 0,
        test: {
          id: attempt.test.id,
          title: attempt.test.title,
          description: attempt.test.description,
          durationMinutes: attempt.test.durationMinutes,
          instructions: attempt.test.instructions,
          autoSubmit: attempt.test.autoSubmit,
        },
        questions: attempt.test.testQuestions.map((tq) => ({
          id: tq.question.id,
          text: tq.question.text,
          type: tq.question.type,
          options: tq.question.options,
          marks: tq.marks,
          difficulty: tq.question.difficulty,
          imageUrl: tq.question.imageUrl,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test attempt' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { attemptId } = await params;
    const { answers, currentQuestionIndex, timeSpentSeconds } = await request.json();

    // Verify the attempt exists and belongs to the user
    const existingAttempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId,
        userId: session.user.id,
        submittedAt: null,
        finishedAt: null,
      },
    });

    if (!existingAttempt) {
      console.error(`Attempt not found or already submitted: ${attemptId}, User: ${session.user.id}`);
      return NextResponse.json(
        { error: 'Test attempt not found or already submitted' },
        { status: 404 }
      );
    }

    const attemptUpdateData = {
      answers: answers !== undefined ? answers : undefined,
      metadata: {
        ...(existingAttempt.metadata || {}),
        ...(currentQuestionIndex !== undefined ? { currentQuestionIndex } : {}),
        lastSavedAt: new Date().toISOString(),
      },
    };

    if (timeSpentSeconds !== undefined) {
      const parsedTime = parseInt(timeSpentSeconds);
      if (!isNaN(parsedTime)) {
        attemptUpdateData.timeSpentSeconds = parsedTime;
      }
    }

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: attemptUpdateData,
    });

    return NextResponse.json({
      success: true,
      attempt: updatedAttempt,
    });
  } catch (error) {
    console.error('Error updating test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to update test attempt' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { attemptId } = await params;

    // Verify the attempt exists and belongs to the user
    const existingAttempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId,
        userId: session.user.id,
        submittedAt: null,
        finishedAt: null,
      },
    });

    if (!existingAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found or already submitted' },
        { status: 404 }
      );
    }

    // Delete the attempt
    await prisma.testAttempt.delete({
      where: { id: attemptId },
    });

    return NextResponse.json({
      success: true,
      message: 'Test attempt deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to delete test attempt' },
      { status: 500 }
    );
  }
}
