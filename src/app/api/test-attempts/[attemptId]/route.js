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
    const { answers, currentQuestionIndex, timeSpentSeconds, violation } = await request.json();

    // Verify the attempt exists and belongs to the user
    const existingAttempt = await prisma.testAttempt.findUnique({
      where: {
        id: attemptId,
        userId: session.user.id,
        submittedAt: null,
        finishedAt: null,
      },
      include: {
        test: {
          include: {
            testQuestions: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!existingAttempt) {
      console.error(`Attempt not found or already submitted: ${attemptId}, User: ${session.user.id}`);
      return NextResponse.json(
        { error: 'Test attempt not found or already submitted' },
        { status: 404 }
      );
    }

    const existingMetadata = existingAttempt.metadata || {};
    let newViolations = existingMetadata.violations || [];

    if (violation) {
      const isDuplicate = newViolations.some(
        (v) => v.type === violation.type && v.timestamp === violation.timestamp
      );
      if (!isDuplicate) {
        newViolations = [...newViolations, violation];
      }
    }

    const test = existingAttempt.test;
    const maxTabSwitches = test.maxTabSwitches !== null && test.maxTabSwitches !== undefined ? test.maxTabSwitches : 3;
    const maxViolationsAllowed = test.maxViolationsAllowed !== null && test.maxViolationsAllowed !== undefined ? test.maxViolationsAllowed : 5;

    const tabSwitchesCount = newViolations.filter((v) => v.type === 'TAB_SWITCH_DETECTED').length;
    const activeViolationsCount = newViolations.filter(
      (v) => v.type !== 'MEDIA_ACCESS_DENIED' && v.type !== 'FULLSCREEN_ERROR' && v.type !== 'TAB_SWITCH_DETECTED'
    ).length;

    let shouldDisqualify = false;
    let disqualificationReason = '';

    const hasCameraDenial = newViolations.some((v) => v.type === 'MEDIA_ACCESS_DENIED');
    if (test.faceDetectionEnabled && hasCameraDenial) {
      shouldDisqualify = true;
      disqualificationReason = 'Camera access is required for this test. Proctoring session could not be started.';
    } else if (tabSwitchesCount >= maxTabSwitches) {
      shouldDisqualify = true;
      disqualificationReason = `Exceeded maximum tab switches limit (${maxTabSwitches}).`;
    } else if (activeViolationsCount >= maxViolationsAllowed) {
      shouldDisqualify = true;
      disqualificationReason = `Exceeded maximum proctoring violations limit (${maxViolationsAllowed}).`;
    }

    const now = new Date();
    const attemptUpdateData = {
      answers: answers !== undefined ? answers : undefined,
      metadata: {
        ...existingMetadata,
        ...(currentQuestionIndex !== undefined ? { currentQuestionIndex } : {}),
        violations: newViolations,
        violationCount: newViolations.length,
        lastSavedAt: now.toISOString(),
        ...(shouldDisqualify ? { disqualified: true, disqualificationReason } : {}),
      },
    };

    if (timeSpentSeconds !== undefined) {
      const parsedTime = parseInt(timeSpentSeconds);
      if (!isNaN(parsedTime)) {
        attemptUpdateData.timeSpentSeconds = parsedTime;
      }
    }

    if (shouldDisqualify) {
      attemptUpdateData.status = 'disqualified';
      attemptUpdateData.submittedAt = now;
      attemptUpdateData.finishedAt = now;

      // Calculate score and results for the disqualified attempt
      let score = 0;
      let maxScore = 0;
      let correctAnswersCount = 0;
      const results = {};
      const activeAnswers = answers !== undefined ? answers : (existingAttempt.answers || {});

      test.testQuestions.forEach((tq) => {
        const question = tq.question;
        const userAnswer = activeAnswers[question.id] || null;
        const isCorrect = userAnswer && question.correctAnswer
          ? userAnswer === question.correctAnswer
          : null;

        maxScore += tq.marks;

        if (isCorrect) {
          score += tq.marks;
          correctAnswersCount++;
        }

        results[question.id] = {
          questionId: question.id,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          marks: isCorrect ? tq.marks : 0,
          maxMarks: tq.marks,
        };
      });

      attemptUpdateData.results = results;
      attemptUpdateData.score = score;
      attemptUpdateData.metadata.maxScore = maxScore;

      // Update learning progress
      await prisma.learningProgress.upsert({
        where: {
          userId_testId: {
            userId: session.user.id,
            testId: test.id,
          },
        },
        update: {
          progress: 100,
          status: 'completed',
          score,
          completedAt: now,
        },
        create: {
          userId: session.user.id,
          testId: test.id,
          progress: 100,
          status: 'completed',
          score,
          completedAt: now,
        },
      });

      // Record study session
      await prisma.studySession.create({
        data: {
          userId: session.user.id,
          testId: test.id,
          startTime: existingAttempt.startedAt,
          endTime: now,
          duration: Math.floor((now - existingAttempt.startedAt) / 1000),
          activityType: 'test_disqualified',
          metadata: {
            score,
            maxScore,
            disqualified: true,
            disqualificationReason,
          },
        },
      });
    }

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: attemptUpdateData,
    });

    return NextResponse.json({
      success: true,
      attempt: updatedAttempt,
      disqualified: shouldDisqualify,
      disqualificationReason: shouldDisqualify ? disqualificationReason : undefined,
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
