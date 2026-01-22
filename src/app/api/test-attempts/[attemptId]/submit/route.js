import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
export async function POST(request, { params }) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { attemptId } = await params;
    const { answers } = await request.json();

    // Get the test attempt with test and questions
    // Remove submittedAt/finishedAt filter to handle idempotency
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

    // Check if already submitted
    if (attempt.submittedAt) {
      // Calculate derived stats from stored data if possible, or return stored values
      // Since we don't store correctAnswers count explicitly in DB root, we might need to parse results or just return what we have.
      // For robustness, let's recalculate simply or assume client handles it.
      // Better: Recalculate from stored results/answers if needed, but existing results are in attempt.results

      const storedResults = attempt.results || {};
      let correctAnswers = 0;
      let totalQuestions = attempt.test.testQuestions.length;

      // Count correct answers from stored results
      Object.values(storedResults).forEach(r => {
        if (r.isCorrect) correctAnswers++;
      });

      return NextResponse.json({
        success: true,
        score: attempt.score,
        maxScore: attempt.metadata?.maxScore || 0,
        correctAnswers,
        totalQuestions,
        attempt: {
          id: attempt.id,
          status: attempt.status,
          score: attempt.score,
          maxScore: attempt.metadata?.maxScore || 0,
          submittedAt: attempt.submittedAt,
          test: {
            id: attempt.test.id,
            title: attempt.test.title,
          },
        },
      });
    }

    const now = new Date();
    const test = attempt.test;
    const testQuestions = test.testQuestions;

    // Calculate score if answers are provided
    let score = 0;
    let maxScore = 0;
    let correctAnswers = 0;
    const results = {};

    testQuestions.forEach((tq) => {
      const question = tq.question;
      const userAnswer = answers ? answers[question.id] : (attempt.answers?.[question.id] || null);
      const isCorrect = userAnswer && question.correctAnswer
        ? userAnswer === question.correctAnswer
        : null;

      maxScore += tq.marks;

      if (isCorrect) {
        score += tq.marks;
        correctAnswers++;
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

    // Update the attempt with submission data
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        answers: answers || attempt.answers,
        results,
        score,
        metadata: {
          ...(attempt.metadata || {}),
          maxScore,
        },
        status: 'submitted',
        submittedAt: now,
        finishedAt: now,
      },
    });

    // Record learning progress
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
        startTime: attempt.startedAt,
        endTime: now,
        duration: Math.floor((now - attempt.startedAt) / 1000), // in seconds
        activityType: 'test_completed',
        metadata: {
          score,
          maxScore,
          percentage: Math.round((score / maxScore) * 100),
        },
      },
    });



    // Revalidate the tests list page to reflect completion status
    revalidatePath('/tests');

    return NextResponse.json({
      success: true,
      score,
      maxScore,
      correctAnswers,
      totalQuestions: testQuestions.length,
      attempt: {
        id: updatedAttempt.id,
        status: updatedAttempt.status,
        score: updatedAttempt.score,
        maxScore: updatedAttempt.maxScore,
        submittedAt: updatedAttempt.submittedAt,
        test: {
          id: test.id,
          title: test.title, // Fixed to use test from scope which has title
        },
      },
    });
  } catch (error) {
    console.error('Error submitting test attempt:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit test attempt' },
      { status: 500 }
    );
  }
}
