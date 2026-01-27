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

  try {
    // Check if test exists and is published
    const test = await prisma.test.findUnique({
      where: {
        id: testId,
        isPublished: true,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or not published' },
        { status: 404 }
      );
    }

    // Check if user has already started this test
    let attempt = await prisma.testAttempt.findFirst({
      where: {
        testId,
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
      orderBy: { startedAt: 'desc' },
      include: {
        answers: true,
      },
    });

    // If no in-progress attempt exists, create a new one
    if (!attempt) {
      // Check if test requires payment
      if (test.requiresPayment) {
        const hasPaid = await prisma.payment.findFirst({
          where: {
            userId: session.user.id,
            testId,
            status: 'SUCCEEDED',
          },
        });

        if (!hasPaid) {
          return NextResponse.json(
            {
              error: 'Payment required',
              paymentRequired: true,
              amount: test.paymentAmount,
              currency: test.paymentCurrency,
            },
            { status: 402 }
          );
        }
      }

      // Check if user has reached max attempts
      // If allowMultipleAttempts is false (default), strictly limit to 1 attempt.
      if (!test.allowMultipleAttempts) {
        const attemptCount = await prisma.testAttempt.count({
          where: {
            testId,
            userId: session.user.id,
          },
        });

        if (attemptCount >= 1) {
          return NextResponse.json(
            { error: 'Maximum number of attempts reached. This test only allows a single attempt.' },
            { status: 403 }
          );
        }
      }

      // Create new test attempt
      attempt = await prisma.testAttempt.create({
        data: {
          testId,
          userId: session.user.id,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          timeLimitMinutes: test.durationMinutes,
        },
        include: {
          answers: true,
        },
      });
    }

    // Calculate time spent so far
    const timeSpent = Math.floor((new Date() - new Date(attempt.startedAt)) / 1000);
    const timeLeft = Math.max(0, (test.durationMinutes * 60) - timeSpent);

    // Format questions without answers for security
    const questions = test.questions.map(question => {
      const { correctAnswer, ...rest } = question;
      return rest;
    });

    // Prepare response
    const response = {
      test: {
        ...test,
        questions,
      },
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        timeLeft,
        timeSpent,
      },
      answers: attempt.answers.reduce((acc, answer) => {
        acc[`question_${answer.questionId}`] = answer.answer;
        return acc;
      }, {}),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting test:', error);
    return NextResponse.json(
      { error: 'Failed to start test' },
      { status: 500 }
    );
  }
}
