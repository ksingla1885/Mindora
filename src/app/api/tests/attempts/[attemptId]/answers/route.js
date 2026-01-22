import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { attemptId } = await params;
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

    // Update or create answers in the JSON field
    const currentAnswers = attempt.answers || {};
    const newAnswers = { ...currentAnswers };

    Object.entries(answers).forEach(([questionId, answerData]) => {
      // Assuming answerData has .answer property as per original code
      // We store the answer value directly to match TestTaker format, 
      // or we could store the whole object if needed. 
      // Given submit/route.js usage, it likely expects values or simple objects.
      // Let's store the value.
      newAnswers[questionId] = answerData.answer;
    });

    // Update the attempt
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        answers: newAnswers,
        metadata: {
          ...(attempt.metadata || {}),
          lastSavedAt: new Date().toISOString()
        }
      },
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
